import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {fileApi, FileInfo} from "@/integrations/api/fileApi";

// 创建一个共享的暂停控制器类
class PauseController {
    private paused = false;
    private listeners: Array<() => void> = [];

    isPaused(): boolean {
        return this.paused;
    }

    setPaused(paused: boolean): void {
        this.paused = paused;
        // 通知所有监听器状态变化
        this.listeners.forEach(listener => listener());
    }

    subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    async waitForResume(): Promise<void> {
        if (!this.paused) return;

        return new Promise(resolve => {
            const unsubscribe = this.subscribe(() => {
                if (!this.paused) {
                    unsubscribe();
                    resolve();
                }
            });
        });
    }
}

interface FileUploaderProps {
    onUploadComplete?: (fileInfo: FileInfo) => void;
    onResetComplete?: () => void;
    maxSize?: number; // 最大文件大小(字节)，默认为10GB
    chunkSize?: number; // 分片大小(字节)，默认为5MB
}

export interface FileUploaderHandles {
    handleReset: () => void;
}

interface UploadState {
    uploadId?: string;  // 分片上传的ID
    uploadedFileId?: string;  // 已上传文件的ID（用于普通上传）
    uploadedChunks?: number[];  // 已上传的分片
    isChunked?: boolean;  // 是否是分片上传
    lastFailedChunk?: number;  // 记录最后一个失败的分片索引
    retryCount?: number;  // 记录重试次数
}

const FileUploader = forwardRef<FileUploaderHandles, FileUploaderProps>
(({
      onUploadComplete,
      onResetComplete,
      maxSize = 10 * 1024 * 1024 * 1024, // 10GB
      chunkSize = 5 * 1024 * 1024, // 5MB
  }, ref) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isRetryNeeded, setIsRetryNeeded] = useState(false); // 新增：是否需要重试
    const [retryError, setRetryError] = useState(''); // 新增：重试错误信息

    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const pauseControllerRef = useRef<PauseController>(new PauseController());

    // 添加一个 ref 来跟踪是否被取消
    const cancelledRef = useRef(false);

    // 修改上传状态管理
    const uploadStateRef = useRef<UploadState>({
        uploadId: undefined,
        uploadedFileId: undefined,
        uploadedChunks: [],
        isChunked: false,
        lastFailedChunk: -1,
        retryCount: 0
    });

    // 同步 pauseController 和 React 状态
    useEffect(() => {
        return pauseControllerRef.current.subscribe(() => {
            setIsPaused(pauseControllerRef.current.isPaused());
        });
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > maxSize) {
                setErrorMessage(`文件大小不能超过 ${(maxSize / (1024 * 1024)).toFixed(2)} MB`);
                setFile(null);
                return;
            }

            setFile(selectedFile);
            setErrorMessage('');
            setRetryError('');
            setIsRetryNeeded(false);
            cancelledRef.current = false; // 重置取消状态
            setIsCancelled(false);
            setIsPaused(false);

            handleUpload(selectedFile);
        }
    };

    const handleUpload = async (fileToUpload?: File) => {
        const targetFile = fileToUpload || file;
        if (!targetFile) return;

        // 重置状态
        setIsUploading(true);
        setIsCancelled(false);
        setIsPaused(false);
        setIsRetryNeeded(false);
        setRetryError('');
        cancelledRef.current = false;
        pauseControllerRef.current.setPaused(false);
        setUploadProgress(0);
        setUploadStatus('uploading');
        setErrorMessage('');

        // 重置上传状态
        uploadStateRef.current = {
            uploadId: undefined,
            uploadedFileId: undefined,
            uploadedChunks: [],
            isChunked: targetFile.size > chunkSize,
            lastFailedChunk: -1,
            retryCount: 0
        };

        abortControllerRef.current = new AbortController();

        try {
            if (uploadStateRef.current.isChunked) {
                await uploadFileInChunks(targetFile);
            } else {
                await uploadFileDirectly(targetFile);
            }

            if (!cancelledRef.current) {
                setUploadStatus('success');
            }
        } catch (error: any) {
            if (cancelledRef.current) {
                console.log('Upload cancelled by user');
            } else if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
                console.log('Upload aborted');
            } else if (isRetryNeeded) {
                // 重试失败，保持暂停状态
                console.log('Retry failed, keeping paused state');
            } else {
                setUploadStatus('error');
                setErrorMessage(error.message || '上传失败');
                console.error('Upload failed:', error);
            }
        } finally {
            if (!isPaused && !isRetryNeeded) {
                setIsUploading(false);
            }
        }
    };

    const uploadFileDirectly = async (file: File) => {
        if (!abortControllerRef.current) {
            abortControllerRef.current = new AbortController();
        }

        const response = await fileApi.uploadFile(
            file,
            (progressEvent) => {
                if (cancelledRef.current) return;
                if (isPaused) return;

                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
                setUploadProgress(progress);
            }
        );

        if (cancelledRef.current) {
            throw new Error('Upload cancelled');
        }

        if (response.success) {
            // 保存上传的文件ID
            uploadStateRef.current.uploadedFileId = response.data.id;
            onUploadComplete?.(response.data);
        } else {
            throw new Error(response.message || '上传失败');
        }
    };

    const uploadFileInChunks = async (file: File) => {
        const totalChunks = Math.ceil(file.size / chunkSize);
        const fileName = file.name;
        const fileSize = file.size;
        const maxRetries = 1;

        // 初始化分片上传
        const initResponse = await fileApi.initChunkedUpload(
            fileName,
            fileSize,
            totalChunks
        );

        if (cancelledRef.current) {
            await cleanupUpload(); // 清理
            throw new Error('Upload cancelled');
        }

        const uploadId = initResponse.data.uploadId;
        uploadStateRef.current.uploadId = uploadId;
        uploadStateRef.current.retryCount = 0; // 重置重试计数

        // 获取已上传的分片
        const uploadedChunks = await getUploadedChunks(uploadId);
        uploadStateRef.current.uploadedChunks = uploadedChunks;

        // 上传未完成的分片
        for (let i = 0; i < totalChunks; i++) {
            if (cancelledRef.current) {
                await cleanupUpload(); // 清理
                throw new Error('Upload cancelled');
            }

            await pauseControllerRef.current.waitForResume();

            if (cancelledRef.current) {
                await cleanupUpload(); // 清理
                throw new Error('Upload cancelled');
            }

            if (uploadedChunks.includes(i + 1)) {
                setUploadProgress(Math.round(((i + 1) * 100) / totalChunks));
                continue;
            }

            try {
                await uploadChunkWithRetry(
                    file,
                    i,
                    totalChunks,
                    uploadId,
                    fileName,
                    uploadedChunks,
                    maxRetries
                );
                // 记录已上传的分片
                uploadStateRef.current.uploadedChunks = [...(uploadStateRef.current.uploadedChunks || []), i + 1];
                // 重置失败状态
                setIsRetryNeeded(false);
                setRetryError('');
                uploadStateRef.current.lastFailedChunk = -1;
                uploadStateRef.current.retryCount = 0;
            } catch (error: any) {
                if (error.message.includes('max retries reached')) {
                    // 达到最大重试次数，设置暂停状态
                    uploadStateRef.current.lastFailedChunk = i;
                    uploadStateRef.current.retryCount = maxRetries;
                    setIsRetryNeeded(true);
                    setRetryError(`上传失败，请重试`);
                    pauseControllerRef.current.setPaused(true);
                    setIsPaused(true);
                    setIsUploading(false);
                    throw error; // 抛出错误，但不再清理，以便可以重试
                } else {
                    await cleanupUpload(); // 上传失败时清理
                    throw error;
                }
            }
        }

        if (cancelledRef.current) {
            await cleanupUpload(); // 清理
            throw new Error('Upload cancelled');
        }

        // 合并分片
        const mergeResponse = await fileApi.mergeChunks(
            uploadId
        );

        if (cancelledRef.current) {
            await cleanupUpload(); // 清理
            throw new Error('Upload cancelled');
        }

        if (mergeResponse.success) {
            uploadStateRef.current.uploadedFileId = mergeResponse.data.id;
            onUploadComplete?.(mergeResponse.data);
        } else {
            await cleanupUpload(); // 合并失败时清理
            throw new Error(mergeResponse.message || '合并文件失败');
        }
    };

    // 清理上传的文件/分片
    const cleanupUpload = async () => {
        try {
            // 如果是分片上传且有 uploadId，清理分片
            if (uploadStateRef.current.isChunked && uploadStateRef.current.uploadId) {
                const uploadId = uploadStateRef.current.uploadId;
                uploadStateRef.current.uploadId = null;
                await fileApi.cancelUpload(uploadId);
            }
            // 如果是普通上传且有文件ID，删除文件
            else if (!uploadStateRef.current.isChunked && uploadStateRef.current.uploadedFileId) {
                await fileApi.cancelUpload(uploadStateRef.current.uploadedFileId);
                console.log('Deleted uploaded file:', uploadStateRef.current.uploadedFileId);
            }
        } catch (error) {
            console.error('Failed to cleanup upload:', error);
        }
    };

    const getUploadedChunks = async (uploadId: string): Promise<number[]> => {
        try {
            const statusResponse = await fileApi.getChunkedUploadStatus(
                uploadId
            );
            return statusResponse.data.uploadedChunks || [];
        } catch (error) {
            console.warn('Failed to get upload status, uploading all chunks');
            return [];
        }
    };

    const uploadChunkWithRetry = async (
        file: File,
        chunkIndex: number,
        totalChunks: number,
        uploadId: string,
        fileName: string,
        uploadedChunks: number[],
        maxRetries: number
    ) => {
        const start = chunkIndex * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        let retryCount = 0;
        let lastError: Error | null = null;

        while (retryCount < maxRetries) {
            if (cancelledRef.current) {
                throw new Error('Upload cancelled');
            }

            await pauseControllerRef.current.waitForResume();

            try {
                await uploadSingleChunk(
                    chunk,
                    uploadId,
                    chunkIndex,
                    totalChunks,
                    fileName
                );
                return;
            } catch (error: any) {
                lastError = error;
                retryCount++;
                uploadStateRef.current.retryCount = retryCount;

                if (cancelledRef.current) {
                    throw new Error('Upload cancelled');
                }

                if (retryCount < maxRetries) {
                    console.warn(`上传分片 ${chunkIndex + 1} 失败 (尝试 ${retryCount}/${maxRetries}):`, error.message);
                    // 指数退避
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
                } else {
                    // 达到最大重试次数
                    const maxRetryError = new Error(`上传失败，请重试`);
                    (maxRetryError as any).maxRetriesReached = true;
                    throw maxRetryError;
                }
            }
        }

        throw lastError || new Error(`上传分片 ${chunkIndex + 1} 失败`);
    };

    const uploadSingleChunk = async (
        chunk: Blob,
        uploadId: string,
        chunkIndex: number,
        totalChunks: number,
        fileName: string
    ) => {
        await fileApi.uploadChunk(
            chunk,
            uploadId,
            chunkIndex + 1,
            totalChunks,
            fileName,
            (progressEvent) => {
                if (cancelledRef.current || isPaused) return;
                const chunkProgress = (progressEvent.loaded * 100) / progressEvent.total!;
                const overallProgress = Math.round(((chunkIndex + chunkProgress / 100) * 100) / totalChunks);
                setUploadProgress(overallProgress);
            }
        );
    };

    const handlePauseResume = () => {
        if (cancelledRef.current) return; // 已取消，不处理暂停

        const isCurrentlyPaused = pauseControllerRef.current.isPaused();

        if (isCurrentlyPaused) {
            // 恢复上传
            pauseControllerRef.current.setPaused(false);
            setIsPaused(false);

            if (isRetryNeeded) {
                // 如果是重试场景，重新开始上传
                setIsRetryNeeded(false);
                setRetryError('');
                setIsUploading(true);
                // 继续从失败的分片开始上传
                if (file) {
                    handleUpload(file);
                }
            } else {
                // 正常恢复
                setIsUploading(true);
            }
        } else {
            // 暂停上传
            pauseControllerRef.current.setPaused(true);
            setIsPaused(true);
        }
    };

    const handleCancel = async (cleanTmpFile: boolean = true) => {
        // 设置取消标志
        cancelledRef.current = true;
        setIsCancelled(true);
        setIsPaused(false);
        setIsRetryNeeded(false);
        setRetryError('');
        pauseControllerRef.current.setPaused(false);

        // 中止所有请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 清理已上传的内容
        if (cleanTmpFile !== false) {
            await cleanupUpload();
        }

        // 立即停止上传
        setIsUploading(false);
        setUploadStatus('idle');
        setUploadProgress(0);

        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRetry = async () => {
        if (!file) return;

        // 重置重试相关状态
        cancelledRef.current = true;
        setIsCancelled(true);
        setIsPaused(false);
        setIsRetryNeeded(false);
        setRetryError('');
        pauseControllerRef.current.setPaused(false);

        // 中止所有请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 清理已上传的内容
        await cleanupUpload();

        // 立即停止上传
        setIsUploading(false);
        setUploadStatus('idle');
        setUploadProgress(0);

        handleUpload(file);
    };

    const handleReset = (cleanTmpFile: boolean=true) => {
        // 先取消任何进行中的上传
        handleCancel(cleanTmpFile);

        // 重置所有状态
        setFile(null);
        setUploadProgress(0);
        setUploadStatus('idle');
        setErrorMessage('');
        setRetryError('');
        setIsRetryNeeded(false);
        setIsCancelled(false);
        setIsPaused(false);
        setIsUploading(false);
        cancelledRef.current = false;
        pauseControllerRef.current.setPaused(false);
        uploadStateRef.current = {
            uploadId: undefined,
            uploadedFileId: undefined,
            uploadedChunks: [],
            isChunked: false,
            lastFailedChunk: -1,
            retryCount: 0
        };

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onResetComplete?.();
    };

    useImperativeHandle(ref, () => ({
        handleReset
    }));

    // 获取按钮文本
    const getPauseResumeButtonText = () => {
        if (isRetryNeeded) {
            return '重试上传';
        }
        return isPaused ? '继续上传' : '暂停上传';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isUploading && !isPaused}
                    className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && !isUploading && !isPaused && !errorMessage && (
                    <Button onClick={handleReset} variant="outline">
                        清除
                    </Button>
                )}
                {(file && errorMessage) && (
                    <Button onClick={handleRetry} variant="outline">
                        重试
                    </Button>
                )}
            </div>

            {file && (
                <div className="text-sm text-gray-500">
                    <p>文件名: {file.name}</p>
                    <p>文件大小: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    {isRetryNeeded && uploadStateRef.current.lastFailedChunk !== undefined && (
                        <p className="text-amber-600">
                            分片 {uploadStateRef.current.lastFailedChunk + 1} 上传失败，已重试 {uploadStateRef.current.retryCount} 次
                        </p>
                    )}
                </div>
            )}

            {(isUploading || isPaused) && (
                <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full"/>
                    <p className="text-center text-sm text-gray-500">{uploadProgress}%</p>

                    {retryError && (
                        <div className="text-amber-600 text-sm text-center">
                            {retryError}
                        </div>
                    )}

                    <div className="flex justify-center space-x-2">
                        {!isCancelled && (
                            <>
                                <Button
                                    type="button"
                                    onClick={handlePauseResume}
                                    variant={isRetryNeeded ? "default" : "outline"}
                                    disabled={isCancelled}
                                >
                                    {getPauseResumeButtonText()}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCancel}
                                    variant="outline"
                                    disabled={isCancelled}
                                >
                                    {isCancelled ? '已取消' : '取消上传'}
                                </Button>
                            </>
                        )}
                        {isCancelled && (
                            <Button
                                type="button"
                                onClick={handleReset}
                                variant="outline"
                            >
                                重新选择文件
                            </Button>
                        )}
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
        </div>
    );
});

export default FileUploader;