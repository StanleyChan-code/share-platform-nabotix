import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {fileApi} from "@/integrations/api/fileApi";
import {Clock, Download, Info, Pause, Play, RotateCcw, X} from 'lucide-react';
import {toast} from "@/hooks/use-toast";

import {ChunkTask, FileUploaderHandles, FileUploaderProps, UploadState} from './types';
import {ErrorClassifier, FileValidator, ProgressCalculator, SpeedCalculator, UploadQueue} from './uploadUtils';
import {formatFileSize, downloadFile} from "@/lib/utils.ts";

// 清理状态类型
interface CleanupState {
    isCleaning: boolean;
    lastCleanupTime: number;
    pendingCleanups: Array<{ uploadId: string; timestamp: number }>;
    deletedFileIds: string[];
}

const FileUploader = forwardRef<FileUploaderHandles, FileUploaderProps>(({
                                                                             onUploadComplete,
                                                                             onResetComplete,
                                                                             maxSize = 10 * 1024 * 1024 * 1024,
                                                                             chunkSize = 20 * 1024 * 1024,
                                                                             acceptedFileTypes = [],
                                                                             allowAllFileTypes = false,
                                                                             maxConcurrentUploads = 3,
                                                                             templateFile,
                                                                             templateLabel,
                                                                             templateFileName,
                                                                             isStaticTemplateFile = true,
                                                                             required = false,
                                                                             onValidityChange,
                                                                             validateOnSubmit = true
                                                                         }, ref) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isRetryNeeded, setIsRetryNeeded] = useState(false);
    const [activeUploads, setActiveUploads] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState('0 KB/s');
    const [estimatedTime, setEstimatedTime] = useState('--:--');
    const [totalUploadedBytes, setTotalUploadedBytes] = useState(0);

    const [validationError, setValidationError] = useState<string | null>(null);
    const [isTouched, setIsTouched] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const uploadQueueRef = useRef<UploadQueue>(new UploadQueue(maxConcurrentUploads));
    const speedCalculatorRef = useRef<SpeedCalculator>(new SpeedCalculator());
    const speedUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const uploadStateRef = useRef<UploadState>({
        uploadedChunks: [],
        failedChunks: [],
        chunkProgress: {}
    });

    // 清理状态管理
    const cleanupStateRef = useRef<CleanupState>({
        isCleaning: false,
        lastCleanupTime: 0,
        pendingCleanups: [],
        deletedFileIds: []
    });

    const isCancelledRef = useRef(false);
    const isPausedRef = useRef(false);
    const shouldStopOnFailureRef = useRef(false);

    // 清理临时文件的函数（带重试机制）
    const cleanupTemporaryFiles = async (uploadId?: string, maxRetries: number = 3): Promise<boolean> => {
        const targetUploadId = uploadId || uploadStateRef.current.uploadId;
        if (!targetUploadId) return true;

        // 防止重复清理
        if (cleanupStateRef.current.isCleaning) {
            cleanupStateRef.current.pendingCleanups.push({
                uploadId: targetUploadId,
                timestamp: Date.now()
            });
            return false;
        }

        cleanupStateRef.current.isCleaning = true;

        try {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    if (cleanupStateRef.current.deletedFileIds.includes(targetUploadId)) {
                        return true;
                    }

                    console.log(`清理临时文件 ${targetUploadId}, 尝试 ${attempt}/${maxRetries}`);

                    await fileApi.cancelUpload(targetUploadId);

                    console.log(`临时文件 ${targetUploadId} 清理成功`);
                    cleanupStateRef.current.deletedFileIds.push(targetUploadId);
                    cleanupStateRef.current.lastCleanupTime = Date.now();

                    // 清理成功后更新状态
                    if (uploadStateRef.current.uploadedFileId === targetUploadId) {
                        uploadStateRef.current.uploadedFileId = undefined;
                    }

                    return true;
                } catch (error) {
                    console.warn(`清理临时文件 ${targetUploadId} 失败 (尝试 ${attempt}/${maxRetries}):`, error);

                    if (attempt < maxRetries) {
                        // 指数退避重试
                        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
                    } else {
                        console.error(`清理临时文件 ${targetUploadId} 最终失败`);
                        return false;
                    }
                }
            }
        } finally {
            cleanupStateRef.current.isCleaning = false;

            // 处理等待中的清理任务
            if (cleanupStateRef.current.pendingCleanups.length > 0) {
                const nextCleanup = cleanupStateRef.current.pendingCleanups.shift();
                if (nextCleanup) {
                    // 延迟执行下一个清理任务，避免堆栈溢出
                    setTimeout(() => {
                        cleanupTemporaryFiles(nextCleanup.uploadId, maxRetries);
                    }, 100);
                }
            }
        }

        return false;
    };

    // 确保清理的函数（在组件卸载时也会调用）
    const ensureCleanup = async (uploadedFileId?: string): Promise<void> => {
        const targetUploadId = uploadedFileId || uploadStateRef.current.uploadedFileId;
        if (!targetUploadId) return;

        // 在后台进行清理，不阻塞主流程
        cleanupTemporaryFiles(targetUploadId);
    };

    // 组件卸载时的清理
    useEffect(() => {
        return () => {
            // 停止所有定时器
            stopSpeedUpdateInterval();

            // 取消进行中的上传
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // 清理临时文件
            ensureCleanup();
        };
    }, []);

    // 验证函数
    const validateInput = (forceValidation = false): boolean => {
        const hasFile = !!file;

        if (!forceValidation && !isTouched && !hasFile) {
            setValidationError(null);
            onValidityChange?.(!required);
            return !required;
        }

        if (required && !hasFile) {
            const errorMsg = '请选择要上传的文件';
            setValidationError(errorMsg);
            onValidityChange?.(false);
            return false;
        }

        if (!required && !hasFile) {
            setValidationError(null);
            onValidityChange?.(true);
            return true;
        }

        setValidationError(null);
        onValidityChange?.(true);
        return true;
    };

    const checkValidity = (): boolean => {
        return validateInput(true);
    };

    // 文件选择处理 - 在选择新文件前清理旧文件
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        const validation = FileValidator.validateFile(
            selectedFile,
            acceptedFileTypes,
            allowAllFileTypes,
            maxSize
        );

        if (!validation.isValid) {
            setErrorMessage(validation.error!);
            resetFileInput();
            validateInput(true);
            return;
        }

        setFile(selectedFile);
        setErrorMessage('');
        setIsRetryNeeded(false);
        isCancelledRef.current = false;
        isPausedRef.current = false;
        shouldStopOnFailureRef.current = false;
        speedCalculatorRef.current.reset();
        setUploadSpeed('0 KB/s');
        setEstimatedTime('--:--');
        setUploadedBytes(0);

        setValidationError(null);
        onValidityChange?.(true);

        // 清除已经上传的临时文件
        await ensureCleanup();
        onResetComplete();

        await startAutoUpload(selectedFile);
    };

    // 重置处理 - 增强清理逻辑
    const handleReset = async (cleanTmpFile: boolean = true) => {
        if (isUploading) {
            await handleCancel(cleanTmpFile);
        } else {
            if (cleanTmpFile && uploadStateRef.current.uploadedFileId) {
                await ensureCleanup(); // 使用确保清理的函数
            }

            setFile(null);
            resetUploadState();
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            validateInput(true);
            onResetComplete?.();
        }
    };

    // 清除文件处理 - 增强清理逻辑
    const handleClearFile = async () => {
        if (isUploading) {
            await handleCancel(true); // 取消并清理
        } else {
            await handleReset(true);
        }

        validateInput(true);
    };

    const markAsTouched = () => {
        setIsTouched(true);
        validateInput(true);
    };

    const clearError = () => {
        setValidationError(null);
    };

    const reset = async () => {
        // 清理临时文件
        if (uploadStateRef.current.uploadedFileId) {
            await ensureCleanup();
        }

        setFile(null);
        setValidationError(null);
        setIsTouched(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        resetUploadState();
    };

    const setCustomValidity = (message: string) => {
        setValidationError(message);
        onValidityChange?.(false);
    };

    const getValidationError = (): string => {
        return validationError || '';
    };

    // 暴露方法给 FormValidator
    useImperativeHandle(ref, () => ({
        handleReset: (cleanTmpFile = true) => handleReset(cleanTmpFile),
        validate: () => validateInput(true),
        checkValidity: () => checkValidity(),
        getValidationError: () => getValidationError(),
        setCustomValidity: (message: string) => setCustomValidity(message),
        markAsTouched: () => markAsTouched(),
        clearError: () => clearError(),
        reset: () => reset(),
        acceptedAndReset: () => acceptedAndReset(),
    }));

    // 当文件变化时触发验证
    useEffect(() => {
        if (isTouched || validationError) {
            validateInput();
        }
    }, [file, isTouched]);

    // 检查是否需要显示速度信息
    const shouldShowSpeedInfo = () => {
        return uploadSpeed !== '0 B/s' && uploadSpeed !== '0 KB/s' && uploadSpeed !== '0 MB/s';
    };

    const getFileRequirementsText = (): string => {
        const requirements = [];

        if (!allowAllFileTypes && acceptedFileTypes.length > 0) {
            requirements.push(`支持格式: ${acceptedFileTypes.join(', ')}`);
        }

        if (maxSize < Infinity) {
            requirements.push(`最大文件大小: ${formatFileSize(maxSize)}`);
        }

        if (required) {
            requirements.push('必填');
        }

        return requirements.join(' | ');
    };

    // 启动速度更新定时器
    const startSpeedUpdateInterval = () => {
        if (speedUpdateIntervalRef.current) {
            clearInterval(speedUpdateIntervalRef.current);
        }

        speedUpdateIntervalRef.current = setInterval(() => {
            if (isUploading && !isPausedRef.current && !isCancelledRef.current) {
                updateSpeedDisplay();
            }
        }, 500);
    };

    // 停止速度更新定时器
    const stopSpeedUpdateInterval = () => {
        if (speedUpdateIntervalRef.current) {
            clearInterval(speedUpdateIntervalRef.current);
            speedUpdateIntervalRef.current = null;
        }
    };

    // 更新速度显示
    const updateSpeedDisplay = () => {
        const speed = speedCalculatorRef.current.calculateSpeed(totalUploadedBytes);
        setUploadSpeed(speed);

        if (file) {
            const timeRemaining = speedCalculatorRef.current.getEstimatedTime(
                file.size,
                totalUploadedBytes
            );
            setEstimatedTime(timeRemaining);
        }
    };

    // 安全添加上传字节数
    const addUploadedBytes = (bytes: number) => {
        setTotalUploadedBytes(prev => {
            const newTotal = prev + bytes;
            if (newTotal > Number.MAX_SAFE_INTEGER || newTotal < 0) {
                console.warn('Upload bytes counter overflow, resetting');
                speedCalculatorRef.current.setTotalUploadedBytes(bytes);
                return bytes;
            }
            speedCalculatorRef.current.addUploadedBytes(bytes);
            return newTotal;
        });
    };

    // 安全设置上传字节数
    const setUploadedBytes = (bytes: number) => {
        const safeBytes = Math.max(0, Math.min(bytes, Number.MAX_SAFE_INTEGER));
        setTotalUploadedBytes(safeBytes);
        speedCalculatorRef.current.setTotalUploadedBytes(safeBytes);
    };

    // 上传成功后的清理处理
    const handleUploadSuccess = () => {
        setUploadStatus('success');
        setIsUploading(false);
        setUploadProgress(100);
        stopSpeedUpdateInterval();
        setUploadSpeed('0 KB/s');
        setEstimatedTime('完成');

        // 上传成功后清理旧的临时文件（如果还有的话）
        if (uploadStateRef.current.uploadedFileId) {
            ensureCleanup();
        }
        uploadStateRef.current.uploadedFileId = uploadStateRef.current.uploadId;
    };

    const startAutoUpload = async (fileToUpload: File) => {

        resetUploadState();
        setIsUploading(true);
        setUploadStatus('uploading');
        abortControllerRef.current = new AbortController();

        startSpeedUpdateInterval();

        try {
            const isChunked = fileToUpload.size > chunkSize;
            uploadStateRef.current = {
                ...uploadStateRef.current,
                isChunked,
                totalChunks: Math.ceil(fileToUpload.size / chunkSize),
                fileName: fileToUpload.name,
                fileSize: fileToUpload.size
            };

            if (isChunked) {
                await uploadFileInChunks(fileToUpload);
            } else {
                await uploadFileDirectly(fileToUpload);
            }

            if (!isCancelledRef.current) {
                handleUploadSuccess();
            }
        } catch (error: any) {
            handleUploadError(error);
        }
    };

    const uploadFileDirectly = async (file: File) => {
        if (!abortControllerRef.current) {
            abortControllerRef.current = new AbortController();
        }

        const response = await fileApi.uploadFile(
            file,
            (progressEvent) => {
                if (isCancelledRef.current) return;
                if (isPausedRef.current) return;

                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
                setUploadProgress(Math.min(progress, 100));
                setUploadedBytes(progressEvent.loaded);
                updateSpeedDisplay();
            }
        );

        if (isCancelledRef.current) {
            throw new Error('Upload cancelled');
        }

        if (response.success) {
            uploadStateRef.current.uploadId = response.data.id;
            onUploadComplete?.(response.data);
        } else {
            throw new Error(response.message || '上传失败');
        }
    };

    const uploadFileInChunks = async (file: File) => {
        const totalChunks = uploadStateRef.current.totalChunks!;

        // 初始化分片上传
        let uploadId = uploadStateRef.current.uploadId;
        if (!uploadId) {
            const initResponse = await fileApi.initChunkedUpload(
                file.name,
                file.size,
                totalChunks
            );

            if (isCancelledRef.current) {
                await ensureCleanup(uploadId);
                throw new Error('Upload cancelled');
            }

            if (!initResponse.success) {
                throw new Error(initResponse.message || '初始化分片上传失败');
            }

            uploadId = initResponse.data.uploadId;
            uploadStateRef.current.uploadId = uploadId;
        }

        // 获取已上传的分片
        const uploadedChunks = await getUploadedChunks(uploadId);
        uploadStateRef.current.uploadedChunks = uploadedChunks;

        // 准备任务队列
        prepareTaskQueue(file, uploadedChunks);

        // 开始智能并行上传
        await startSmartParallelUploads(uploadId, file.name, totalChunks, file.size);

        if (isCancelledRef.current) {
            await ensureCleanup(uploadId);
            throw new Error('Upload cancelled');
        }

        // 合并分片
        setIsMerging(true)
        const mergeResponse = await fileApi.mergeChunks(uploadId);
        setIsMerging(false)

        if (isCancelledRef.current) {
            await ensureCleanup(uploadId);
            throw new Error('Upload cancelled');
        }

        if (mergeResponse.success) {
            uploadStateRef.current.uploadId = mergeResponse.data.id;
            onUploadComplete?.(mergeResponse.data);
        } else {
            throw new Error(mergeResponse.message || '合并文件失败');
        }
    };

    const startSmartParallelUploads = async (
        uploadId: string,
        fileName: string,
        totalChunks: number,
        totalFileSize: number
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            let hasFatalError = false;
            let completedCount = uploadStateRef.current.uploadedChunks?.length || 0;
            let consecutiveFailures = 0;
            const maxConsecutiveFailures = 5;

            let isProcessing = true;
            let activeTaskCount = 0;

            const checkCompletion = () => {
                if (completedCount >= totalChunks && activeTaskCount === 0) {
                    isProcessing = false;
                    resolve();
                    return true;
                }
                return false;
            };

            const processNextTask = async () => {
                if (hasFatalError || isCancelledRef.current || shouldStopOnFailureRef.current) {
                    isProcessing = false;
                    return;
                }

                if (checkCompletion()) {
                    return;
                }

                if (consecutiveFailures >= maxConsecutiveFailures) {
                    hasFatalError = true;
                    shouldStopOnFailureRef.current = true;
                    isProcessing = false;
                    reject(new Error('连续上传失败过多，上传已停止'));
                    return;
                }

                if (isPausedRef.current) {
                    await new Promise<void>(pauseResolve => {
                        const checkPause = () => {
                            if (!isPausedRef.current || hasFatalError || isCancelledRef.current || shouldStopOnFailureRef.current) {
                                pauseResolve();
                            } else {
                                setTimeout(checkPause, 100);
                            }
                        };
                        checkPause();
                    });
                }

                if (hasFatalError || isCancelledRef.current || shouldStopOnFailureRef.current) {
                    isProcessing = false;
                    return;
                }

                while (uploadQueueRef.current.getActiveCount() < maxConcurrentUploads) {
                    const task = uploadQueueRef.current.getNextTask();
                    if (!task) {
                        if (checkCompletion()) {
                            return;
                        }
                        break;
                    }

                    if (isCancelledRef.current || shouldStopOnFailureRef.current) {
                        isProcessing = false;
                        break;
                    }

                    activeTaskCount++;
                    uploadQueueRef.current.addActiveTask(task.chunkIndex);
                    setActiveUploads(uploadQueueRef.current.getActiveCount());

                    processTask(task, uploadId, fileName, totalChunks, totalFileSize)
                        .then(() => {
                            consecutiveFailures = 0;
                            completedCount++;
                            activeTaskCount--;
                            uploadQueueRef.current.removeActiveTask(task.chunkIndex);
                            uploadQueueRef.current.addCompletedTask(task.chunkIndex);
                            setActiveUploads(uploadQueueRef.current.getActiveCount());

                            const chunkSizeBytes = Math.min(chunkSize, totalFileSize - task.chunkIndex * chunkSize);
                            addUploadedBytes(chunkSizeBytes);

                            // 关键修复：分片完成后清除该分片的进度记录
                            delete uploadStateRef.current.chunkProgress[task.chunkIndex];

                            // 使用更准确的进度计算
                            const progress = ProgressCalculator.calculateProgressSafe(
                                totalChunks,
                                completedCount,
                                uploadStateRef.current.chunkProgress // 现在chunkProgress只包含进行中的分片
                            );
                            setUploadProgress(Math.min(progress, 100));

                            if (completedCount >= totalChunks && activeTaskCount === 0) {
                                isProcessing = false;
                                resolve();
                                return;
                            }

                            if (isProcessing) {
                                processNextTask();
                            }
                        })
                        .catch((error) => {
                            activeTaskCount--;
                            consecutiveFailures++;
                            uploadQueueRef.current.removeActiveTask(task.chunkIndex);
                            setActiveUploads(uploadQueueRef.current.getActiveCount());

                            if (error.isPermanentError) {
                                uploadQueueRef.current.addFailedTask(task.chunkIndex);
                                console.warn(`分片 ${task.chunkIndex + 1} 永久性错误:`, error.message);
                            } else if (error.maxRetriesReached) {
                                uploadQueueRef.current.addFailedTask(task.chunkIndex);
                                console.warn(`分片 ${task.chunkIndex + 1} 重试失败:`, error.message);
                            } else if (error.shouldStopUpload) {
                                hasFatalError = true;
                                shouldStopOnFailureRef.current = true;
                                isProcessing = false;
                                reject(new Error('上传失败，请检查网络连接'));
                                return;
                            } else if (error.shouldRequeue) {
                                uploadQueueRef.current.addTasks([task]);
                            } else {
                                uploadQueueRef.current.addTasks([task]);
                            }

                            if (uploadQueueRef.current.getQueueLength() > 0 || activeTaskCount > 0) {
                                processNextTask();
                            } else {
                                if (checkCompletion()) {
                                    return;
                                }
                            }
                        });
                }

                if (uploadQueueRef.current.getQueueLength() > 0 && activeTaskCount === 0) {
                    setTimeout(() => {
                        if (isProcessing) {
                            processNextTask();
                        }
                    }, 100);
                }
            };

            processNextTask();

            const completionCheckInterval = setInterval(() => {
                if (!isProcessing) {
                    clearInterval(completionCheckInterval);
                    return;
                }

                if (completedCount >= totalChunks && activeTaskCount === 0) {
                    isProcessing = false;
                    clearInterval(completionCheckInterval);
                    resolve();
                }
            }, 1000);

            const cleanup = () => {
                clearInterval(completionCheckInterval);
                isProcessing = false;
            };

            Promise.race([
                new Promise<void>((res) => { /* 等待正常完成 */
                }),
                new Promise<void>((_, rej) => setTimeout(() => rej(new Error('上传超时')), 5 * 60 * 1000))
            ]).catch(error => {
                cleanup();
                reject(error);
            });
        });
    };

    const processTask = async (
        task: ChunkTask,
        uploadId: string,
        fileName: string,
        totalChunks: number,
        totalFileSize: number
    ): Promise<void> => {
        const maxRetries = task.isPermanentError ? 1 : 3;

        for (let attempt = task.retryCount; attempt <= maxRetries; attempt++) {
            if (isCancelledRef.current || shouldStopOnFailureRef.current) {
                throw new Error('Upload cancelled');
            }

            if (isPausedRef.current) {
                await new Promise<void>(resolve => {
                    const checkPause = () => {
                        if (!isPausedRef.current || isCancelledRef.current || shouldStopOnFailureRef.current) {
                            resolve();
                        } else {
                            setTimeout(checkPause, 100);
                        }
                    };
                    checkPause();
                });
            }

            if (isCancelledRef.current || shouldStopOnFailureRef.current) {
                throw new Error('Upload cancelled');
            }

            try {
                await uploadSingleChunk(task.chunk, uploadId, task.chunkIndex, totalChunks, fileName, totalFileSize);
                return;
            } catch (error: any) {
                task.retryCount = attempt + 1;
                task.lastError = error.message;

                const isPermanent = ErrorClassifier.isPermanentError(error);
                const isNetworkError = ErrorClassifier.isNetworkError(error);

                if (isPermanent) {
                    task.isPermanentError = true;
                }

                if (attempt < maxRetries) {
                    if (isPermanent) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
                    } else {
                        const tempError = new Error('临时错误，等待重试');
                        (tempError as any).shouldRequeue = true;
                        throw tempError;
                    }
                } else {
                    const maxRetryError = new Error(`上传失败，已达到最大重试次数`);
                    (maxRetryError as any).maxRetriesReached = true;
                    if (isPermanent) {
                        (maxRetryError as any).isPermanentError = true;
                    }
                    if (isNetworkError) {
                        (maxRetryError as any).shouldStopUpload = true;
                    }
                    throw maxRetryError;
                }
            }
        }

        throw new Error('未知错误');
    };

    const uploadSingleChunk = async (
        chunk: Blob,
        uploadId: string,
        chunkIndex: number,
        totalChunks: number,
        fileName: string,
        totalFileSize: number
    ) => {
        try {
            await fileApi.uploadChunk(
                chunk,
                uploadId,
                chunkIndex + 1,
                totalChunks,
                fileName,
                (progressEvent) => {
                    if (isCancelledRef.current || isPausedRef.current || shouldStopOnFailureRef.current) return;

                    const chunkProgress = (progressEvent.loaded * 100) / progressEvent.total!;
                    uploadStateRef.current.chunkProgress = {
                        ...uploadStateRef.current.chunkProgress,
                        [chunkIndex]: Math.min(chunkProgress, 100)
                    };

                    // 只计算未完成分片的进度
                    const currentCompletedCount = uploadQueueRef.current.getCompletedCount();
                    const overallProgress = ProgressCalculator.calculateProgressSafe(
                        totalChunks,
                        currentCompletedCount,
                        uploadStateRef.current.chunkProgress
                    );
                    setUploadProgress(Math.min(overallProgress, 100));
                }
            );
        } catch (error: any) {
            if (ErrorClassifier.isNetworkError(error)) {
                const networkError = new Error('网络连接失败');
                (networkError as any).isNetworkError = true;
                (networkError as any).shouldStopUpload = true;
                throw networkError;
            }
            throw error;
        }
    };

    const prepareTaskQueue = (file: File, uploadedChunks: number[]) => {
        const tasks: ChunkTask[] = [];
        const totalChunks = uploadStateRef.current.totalChunks!;

        for (let i = 0; i < totalChunks; i++) {
            if (!uploadedChunks.includes(i + 1)) {
                const start = i * chunkSize;
                const end = Math.min(file.size, start + chunkSize);
                const chunk = file.slice(start, end);
                tasks.push({
                    chunkIndex: i,
                    chunk,
                    retryCount: 0
                });
            }
        }

        uploadQueueRef.current.addTasks(tasks);
    };

    const getUploadedChunks = async (uploadId: string): Promise<number[]> => {
        try {
            const statusResponse = await fileApi.getChunkedUploadStatus(uploadId);
            return statusResponse.data.uploadedChunks || [];
        } catch (error) {
            console.warn('Failed to get upload status, uploading all chunks');
            return [];
        }
    };

    const handleUploadError = (error: any) => {
        if (isCancelledRef.current) {
            console.log('Upload cancelled by user');
        } else if (shouldStopOnFailureRef.current) {
            setErrorMessage('上传失败，请检查网络连接后重试');
            setUploadStatus('error');
            setIsRetryNeeded(true);
            setIsUploading(false);
            stopSpeedUpdateInterval();
        } else if (error.message?.includes('连续上传失败过多')) {
            setErrorMessage('上传失败过多，已自动停止');
            setUploadStatus('error');
            setIsRetryNeeded(true);
            setIsUploading(false);
            stopSpeedUpdateInterval();
        } else {
            setUploadStatus('error');
            setErrorMessage(error.message || '上传失败');
            setIsUploading(false);
            stopSpeedUpdateInterval();
        }
    };

    const handlePauseResume = () => {
        if (isCancelledRef.current || shouldStopOnFailureRef.current) return;

        if (isPausedRef.current) {
            isPausedRef.current = false;
            setIsPaused(false);
            startSpeedUpdateInterval();
        } else {
            isPausedRef.current = true;
            setIsPaused(true);
            stopSpeedUpdateInterval();
            setUploadSpeed('0 KB/s');
            setEstimatedTime('已暂停');
        }
    };

    // 重试处理 - 先清理再重试
    const handleRetry = async () => {
        if (!file) return;

        setIsRetryNeeded(false);
        setErrorMessage('');
        isCancelledRef.current = false;
        isPausedRef.current = false;
        shouldStopOnFailureRef.current = false;
        setIsPaused(false);
        setIsUploading(true);
        speedCalculatorRef.current.reset();
        setUploadSpeed('0 KB/s');
        setEstimatedTime('--:--');
        setUploadedBytes(0);

        uploadQueueRef.current.clear();
        uploadStateRef.current.failedChunks = [];
        uploadStateRef.current.chunkProgress = {};

        startAutoUpload(file);
    };

    // 取消上传处理 - 增强清理逻辑
    const handleCancel = async (cleanTmpFile: boolean = true) => {
        if (isCancelledRef.current) return;

        isCancelledRef.current = true;
        isPausedRef.current = false;
        shouldStopOnFailureRef.current = false;
        setIsPaused(false);
        setIsRetryNeeded(false);
        stopSpeedUpdateInterval();

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 清除正在上传的临时文件
        if (isUploading) {
            await ensureCleanup(uploadStateRef.current.uploadId);
        } else if (cleanTmpFile) {
            await ensureCleanup();
        }

        setIsUploading(false);
        setUploadStatus('idle');
        setUploadSpeed('0 KB/s');
        setEstimatedTime('--:--');

        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 重置上传状态
    const resetUploadState = () => {
        setUploadProgress(0);
        setUploadStatus('idle');
        setErrorMessage('');
        setIsRetryNeeded(false);
        setIsPaused(false);
        setActiveUploads(0);
        setUploadSpeed('0 KB/s');
        setEstimatedTime('--:--');
        setUploadedBytes(0);
        isCancelledRef.current = false;
        isPausedRef.current = false;
        shouldStopOnFailureRef.current = false;
        speedCalculatorRef.current.reset();
        uploadQueueRef.current.clear();

        // 保留uploadId用于后续清理，但清空其他状态
        const currentUploadId = uploadStateRef.current.uploadId;
        uploadStateRef.current = {
            uploadedChunks: [],
            failedChunks: [],
            chunkProgress: {},
            uploadId: null,
            uploadedFileId: currentUploadId,
        };
        stopSpeedUpdateInterval();
    };

    const resetFileInput = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownloadTemplate = async () => {
        if (!templateFile) return;

        try {
            let downloadFileName: string;
            if (templateFileName) {
                // 如果提供了完整的下载文件名，直接使用
                downloadFileName = templateFileName;
            } else {
                // 否则根据模板文件扩展名和标签生成文件名
                const fileExtension = templateFile.split('.').pop() || '';
                downloadFileName = `${templateLabel || 'template'}.${fileExtension}`;
            }

            // 显示下载开始的toast提示
            toast({
                title: "开始下载",
                description: `文件 "${downloadFileName}" 已开始下载`
            });

            await downloadFile(templateFile, downloadFileName, isStaticTemplateFile);
        } catch (error) {
            console.error('下载模板失败:', error);
            toast({
                title: "下载失败",
                description: "模板文件下载失败，请稍后重试",
                variant: "destructive"
            });
        }
    };

    const acceptedAndReset = () => {
        cleanupStateRef.current.deletedFileIds.push(uploadStateRef.current.uploadedFileId)
        uploadStateRef.current.uploadedFileId = undefined;
        reset();
    };

    const hasFileRequirements = !allowAllFileTypes && (acceptedFileTypes.length > 0 || maxSize < Infinity);

    return (
        <div className="space-y-4 min-w-min">
            {/* 文件要求提示 */}
            {hasFileRequirements && (
                <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                    <Info className="h-3 w-3 mr-2 flex-shrink-0"/>
                    <span>{getFileRequirementsText()}</span>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer">
                    <span className={`mr-4 py-2 px-4 rounded border-0 text-sm font-semibold inline-block ${
                        isUploading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : validationError
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                    }`}>
                        {file && !isUploading && !isPaused && !errorMessage ? '清除并重新上传' : '上传文件'}
                    </span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isUploading && !isPaused && !isRetryNeeded}
                        accept={FileValidator.getAcceptString(acceptedFileTypes, allowAllFileTypes)}
                        className="hidden"
                        onBlur={() => markAsTouched()}
                    />
                </label>

                {isRetryNeeded && (
                    <Button
                        type="button"
                        onClick={handleRetry}
                        variant="outline"
                    >
                        <RotateCcw className="h-4 w-4 mr-2"/>
                        重试
                    </Button>
                )}

                {templateFile && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                    >
                        <Download className="h-4 w-4"/>
                        {templateLabel || '模板'}
                    </Button>
                )}
            </div>

            {file && (
                <div className="flex items-center gap-2 justify-between border border-gray-200 rounded-md px-4 py-2 bg-green-50">
                    <div className="text-sm text-gray-500">
                        <p>文件名: {file.name}</p>
                        <p>文件大小: {formatFileSize(file.size)}</p>
                    </div>
                    {uploadStatus === 'success' && !isUploading && !isPaused && (
                        <Button
                            type="button"
                            onClick={handleClearFile}
                            variant="outline"
                            size="icon"
                            title="清除文件"
                            className={"text-red-500 hover:bg-red-100 hover:text-red-700"}
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                    )}
                </div>
            )}

            {validationError && (
                <div className="mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-200">
                    {validationError}
                </div>
            )}

            {(isUploading || isPaused) && (
                <div className="space-y-2">
                    <Progress value={Math.min(uploadProgress, 100)} className="w-full"/>
                    <p className="text-center text-sm text-gray-500">{Math.min(uploadProgress, 100)}%</p>

                    {shouldShowSpeedInfo() && (
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                                <span className="font-medium">上传速度:</span>
                                <span>{uploadSpeed}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3"/>
                                <span className="font-medium">剩余时间:</span>
                                <span>{estimatedTime}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between text-xs text-gray-500">
                        <span>状态: {isPaused ? '已暂停' : isMerging ? '正在合并' : '上传中'}</span>
                    </div>

                    <div className="flex justify-center space-x-2">
                        <Button
                            type="button"
                            onClick={handlePauseResume}
                            variant={isPaused ? "default" : "outline"}
                            disabled={isCancelledRef.current || shouldStopOnFailureRef.current}
                        >
                            {isPaused ? <Play className="h-4 w-4"/> : <Pause className="h-4 w-4"/>}
                            {isPaused ? '继续上传' : '暂停上传'}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleCancel()}
                            variant="outline"
                            disabled={isCancelledRef.current}
                        >
                            {isCancelledRef.current ? '已取消' : '取消上传'}
                        </Button>
                    </div>
                </div>
            )}

            {errorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            {isCancelledRef.current && !isUploading && (
                <div className="text-sm text-gray-500 text-center">
                    上传已取消
                </div>
            )}
        </div>
    );
});

export default FileUploader;