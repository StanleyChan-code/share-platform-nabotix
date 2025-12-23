import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fileApi, FileInfo } from "@/integrations/api/fileApi";
import { X, RotateCcw, Pause, Play, Info, Clock } from 'lucide-react';

import { FileUploaderProps, FileUploaderHandles, UploadState, ChunkTask } from './types';
import { FileValidator, UploadQueue, ProgressCalculator, ErrorClassifier, SpeedCalculator } from './uploadUtils';
import { formatFileSize } from "@/lib/utils.ts";

const FileUploader = forwardRef<FileUploaderHandles, FileUploaderProps>(({
                                                                             onUploadComplete,
                                                                             onResetComplete,
                                                                             maxSize = 10 * 1024 * 1024 * 1024,
                                                                             chunkSize = 5 * 1024 * 1024,
                                                                             acceptedFileTypes = [],
                                                                             allowAllFileTypes = false,
                                                                             maxConcurrentUploads = 3,
                                                                         }, ref) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isRetryNeeded, setIsRetryNeeded] = useState(false);
    const [activeUploads, setActiveUploads] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState('0 KB/s');
    const [estimatedTime, setEstimatedTime] = useState('--:--');
    const [totalUploadedBytes, setTotalUploadedBytes] = useState(0);

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

    const isCancelledRef = useRef(false);
    const isPausedRef = useRef(false);
    const shouldStopOnFailureRef = useRef(false);

    // 检查是否需要显示速度信息（速度大于0时才显示）
    const shouldShowSpeedInfo = () => {
        return uploadSpeed !== '0 B/s' && uploadSpeed !== '0 KB/s' && uploadSpeed !== '0 MB/s';
    };

    // 文件要求提示文本
    const getFileRequirementsText = (): string => {
        const requirements = [];

        if (!allowAllFileTypes && acceptedFileTypes.length > 0) {
            requirements.push(`支持格式: ${acceptedFileTypes.join(', ')}`);
        }

        if (maxSize < Infinity) {
            requirements.push(`最大文件大小: ${formatFileSize(maxSize)}`);
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
            // 防止溢出
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

    useEffect(() => {
        return () => {
            stopSpeedUpdateInterval();
        };
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

        startAutoUpload(selectedFile);
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
                setUploadStatus('success');
                setIsUploading(false);
                setUploadProgress(100); // 确保进度显示100%
                stopSpeedUpdateInterval();
                // 上传完成时强制更新一次速度显示
                setUploadSpeed('0 KB/s');
                setEstimatedTime('完成');
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
                setUploadProgress(Math.min(progress, 100)); // 确保不超过100%
                setUploadedBytes(progressEvent.loaded);
                // 直接调用速度更新，确保实时性
                updateSpeedDisplay();
            }
        );

        if (isCancelledRef.current) {
            throw new Error('Upload cancelled');
        }

        if (response.success) {
            uploadStateRef.current.uploadedFileId = response.data.id;
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
                await cleanupUpload();
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
            await cleanupUpload();
            throw new Error('Upload cancelled');
        }

        // 合并分片
        const mergeResponse = await fileApi.mergeChunks(uploadId);

        if (isCancelledRef.current) {
            await cleanupUpload();
            throw new Error('Upload cancelled');
        }

        if (mergeResponse.success) {
            uploadStateRef.current.uploadedFileId = mergeResponse.data.id;
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

                            // 使用修复后的进度计算方法
                            const progress = ProgressCalculator.calculateProgressSafe(
                                totalChunks,
                                completedCount,
                                uploadStateRef.current.chunkProgress
                            );
                            setUploadProgress(Math.min(progress, 100)); // 确保不超过100%

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
                new Promise<void>((res) => { /* 等待正常完成 */ }),
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
                        [chunkIndex]: Math.min(chunkProgress, 100) // 确保分片进度不超过100%
                    };

                    const chunkUploadedBytes = Math.round(
                        (Math.min(chunkProgress, 100) / 100) * chunk.size // 使用限制后的进度
                    );

                    const completedChunksSize = uploadQueueRef.current.completedCount * chunkSize;
                    const currentChunkSize = chunkUploadedBytes;
                    const totalBytes = completedChunksSize + currentChunkSize;

                    setUploadedBytes(totalBytes);

                    const currentCompletedCount = uploadQueueRef.current.completedCount;
                    const overallProgress = ProgressCalculator.calculateProgressSafe(
                        totalChunks,
                        currentCompletedCount,
                        uploadStateRef.current.chunkProgress
                    );
                    setUploadProgress(Math.min(overallProgress, 100)); // 确保总进度不超过100%
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

        if (cleanTmpFile) {
            await cleanupUpload();
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

    const handleReset = async (cleanTmpFile: boolean = true) => {
        if (isUploading) {
            await handleCancel(cleanTmpFile);
        } else {
            if (cleanTmpFile && uploadStateRef.current.uploadId) {
                await cleanupUpload();
            }

            setFile(null);
            resetUploadState();
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            onResetComplete?.();
        }
    };

    const cleanupUpload = async (): Promise<void> => {
        try {
            if (uploadStateRef.current.uploadId) {
                await fileApi.cancelUpload(uploadStateRef.current.uploadId);
                uploadStateRef.current.uploadId = undefined;
            }
        } catch (error) {
            console.error('清理上传文件失败:', error);
        }
    };

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

        const currentUploadId = uploadStateRef.current.uploadId;
        uploadStateRef.current = {
            uploadedChunks: [],
            failedChunks: [],
            chunkProgress: {},
            uploadId: currentUploadId
        };
        stopSpeedUpdateInterval();
    };

    const resetFileInput = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClearFile = async () => {
        if (isUploading) {
            await handleCancel(true);
        } else {
            await handleReset(true);
        }
    };

    useImperativeHandle(ref, () => ({
        handleReset: (cleanTmpFile = true) => handleReset(cleanTmpFile)
    }));

    const hasFileRequirements = !allowAllFileTypes && (acceptedFileTypes.length > 0 || maxSize < Infinity);

    return (
        <div className="space-y-4">
            {/* 文件要求提示 */}
            {hasFileRequirements && (
                <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                    <Info className="h-3 w-3 mr-2 flex-shrink-0"/>
                    <span>{getFileRequirementsText()}</span>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isUploading && !isPaused && !isRetryNeeded}
                    accept={FileValidator.getAcceptString(acceptedFileTypes, allowAllFileTypes)}
                    className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                {file && !isUploading && !isPaused && !errorMessage && (
                    <Button
                        type="button"
                        onClick={handleClearFile}
                        variant="outline"
                        size="icon"
                        title="清除文件"
                    >
                        <X className="h-4 w-4"/>
                    </Button>
                )}

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
            </div>

            {file && (
                <div className="text-sm text-gray-500">
                    <p>文件名: {file.name}</p>
                    <p>文件大小: {formatFileSize(file.size)}</p>
                </div>
            )}

            {(isUploading || isPaused) && (
                <div className="space-y-2">
                    <Progress value={Math.min(uploadProgress, 100)} className="w-full"/> {/* 确保进度条不超过100% */}
                    <p className="text-center text-sm text-gray-500">{Math.min(uploadProgress, 100)}%</p> {/* 显示限制后的进度 */}

                    {/* 上传速度和剩余时间显示 - 只在有速度时显示 */}
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

                    {/* 状态信息 */}
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>状态: {isPaused ? '已暂停' : '上传中'}</span>
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

            {uploadStatus === 'success' && (
                <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                        文件上传成功！
                    </AlertDescription>
                </Alert>
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