import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, X, Pause, Play, RotateCcw, Download, Info } from 'lucide-react';
import {FileUploaderHandles, FileUploaderProps, TusFileUploaderProps} from './types';
import { fileApi, FileInfo } from '@/integrations/api/fileApi';
import { getAccessToken } from '@/lib/authUtils';

// 引入 Uppy v5 核心库
import {Tus, Uppy} from "uppy";

// 定义类型
interface Meta {
    [key: string]: any;
}

// 创建 Uppy 实例的工厂函数
const createUppyInstance = (options: {
    endpoint: string;
    maxFileSize?: number;
    allowedFileTypes?: string[];
}) => {
    return new Uppy<Meta>({
        autoProceed: false,
        restrictions: {
            maxFileSize: options.maxFileSize || null,
            allowedFileTypes: options.allowedFileTypes?.length ? options.allowedFileTypes : null,
            maxNumberOfFiles: 1,
        },
    }).use(Tus, {
        endpoint: options.endpoint,
        chunkSize: 5 * 1024 * 1024, // 5MB 分片
        retryDelays: [0, 1000, 3000, 5000],
        removeFingerprintOnSuccess: true,
        onBeforeRequest: (req: any, file: any) => {
            const token = getAccessToken();
            if (token) {
                req.setHeader('Authorization', `Bearer ${token}`);
            }
        },
    });
};

const UppyFileUploader = forwardRef<FileUploaderHandles, TusFileUploaderProps>(({
                                                                                 onUploadComplete,
                                                                                 onResetComplete,
                                                                                 maxSize = 10 * 1024 * 1024 * 1024, // 10GB
                                                                                 acceptedFileTypes = [],
                                                                                 allowAllFileTypes = false,
                                                                                 templateFile,
                                                                                 templateLabel,
                                                                                 templateFileName,
                                                                                 isStaticTemplateFile = true,
                                                                                 required = false,
                                                                                 onValidityChange,
                                                                                 validateOnSubmit = true,
                                                                                 tusEndpoint = '/files/tus/',
                                                                             }, ref) => {
    // 使用 useRef 来保存 Uppy 实例，避免重复创建 [3](@ref)
    const uppyRef = useRef<Uppy<Meta> | null>(null);
    const [uppy] = useState(() => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const instance = createUppyInstance({
            endpoint: `${apiBaseUrl}${tusEndpoint}`,
            maxFileSize: maxSize,
            allowedFileTypes: allowAllFileTypes ? undefined : acceptedFileTypes,
        });
        uppyRef.current = instance;
        return instance;
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'paused' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isTouched, setIsTouched] = useState(false);

    // Uppy 事件处理 - 修复事件监听器管理 [1](@ref)
    useEffect(() => {
        // 保存事件处理函数的引用以便正确清理
        const handleFileAdded = (file: any) => {
            setCurrentFile(file.data);
            setUploadStatus('idle');
            setUploadProgress(0);
            setErrorMessage('');
            setValidationError(null);
            setIsTouched(true);
        };

        const handleUploadProgress = (progress: number) => {
            setUploadProgress(progress);
        };

        const handleUploadSuccess = async (file: any) => {
            setUploadStatus('success');
            setUploadProgress(100);

            // 从uploadURL中提取uploadId
            const urlParts = file.uploadURL.split('/');
            const uploadId = urlParts[urlParts.length - 1];

            try {
                // 调用TUS上传完成接口
                const completeResponse = await fileApi.completeTusUpload(uploadId, file.name);
                
                if (onUploadComplete) {
                    const fileInfo: FileInfo = {
                        id: completeResponse.data?.fileId || uploadId,
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        uploaderId: 'uppy-uploader',
                        deleted: false,
                        deletedAt: null,
                    };
                    onUploadComplete(fileInfo);
                }
            } catch (error) {
                console.error('TUS上传完成接口调用失败:', error);
                // 即使complete接口调用失败，也通知父组件上传完成
                if (onUploadComplete) {
                    const fileInfo: FileInfo = {
                        id: uploadId,
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        uploaderId: 'uppy-uploader',
                        deleted: false,
                        deletedAt: null,
                    };
                    onUploadComplete(fileInfo);
                }
            }
        };

        const handleError = (error: Error) => {
            setUploadStatus('error');
            setErrorMessage(`上传失败: ${error.message}`);
        };

        const handleComplete = (result: any) => {
            if (result.successful && result.successful.length > 0) {
                handleUploadSuccess(result.successful[0]);
            }
        };

        // 注册事件监听器
        uppy.on('file-added', handleFileAdded);
        uppy.on('progress', handleUploadProgress);
        uppy.on('complete', handleComplete);
        uppy.on('error', handleError);

        // 清理函数 - 正确移除事件监听器 [1](@ref)
        return () => {
            uppy.off('file-added', handleFileAdded);
            uppy.off('progress', handleUploadProgress);
            uppy.off('complete', handleComplete);
            uppy.off('error', handleError);
        };
    }, [uppy, onUploadComplete]);

    // 核心操作函数
    const handleUpload = useCallback(() => {
        if (uppy.getFiles().length === 0) {
            setValidationError('请先选择文件');
            return;
        }
        setErrorMessage('');
        setValidationError(null);
        setUploadStatus('uploading');

        uppy.upload().catch((error: Error) => {
            setErrorMessage(`开始上传失败: ${error.message}`);
            setUploadStatus('error');
        });
    }, [uppy]);

    const handlePauseResume = useCallback(() => {
        const files = uppy.getFiles();
        if (files.length === 0) return;

        const file = files[0];
        const tusUploader = uppy.getPlugin('Tus') as any;

        if (uploadStatus === 'uploading') {
            // 暂停上传
            if (tusUploader && tusUploader.pause) {
                tusUploader.pause(file.id);
                setUploadStatus('paused');
            }
        } else if (uploadStatus === 'paused') {
            // 恢复上传
            if (tusUploader && tusUploader.resume) {
                tusUploader.resume(file.id);
                setUploadStatus('uploading');
            }
        }
    }, [uppy, uploadStatus]);

    const handleCancel = useCallback(() => {
        uppy.cancelAll();
        setUploadStatus('idle');
        setUploadProgress(0);
        setErrorMessage('上传已取消');
    }, [uppy]);

    const handleRetry = useCallback(() => {
        setErrorMessage('');
        setUploadStatus('uploading');

        uppy.retryAll().catch((error: Error) => {
            setErrorMessage(`重试失败: ${error.message}`);
            setUploadStatus('error');
        });
    }, [uppy]);

    const handleReset = useCallback((cleanTmpFile: boolean = true) => {
        uppy.cancelAll();
        setCurrentFile(null);
        setUploadProgress(0);
        setUploadStatus('idle');
        setErrorMessage('');
        setValidationError(null);
        setIsTouched(false);

        if (onResetComplete) {
            onResetComplete();
        }
    }, [uppy, onResetComplete]);

    // 验证逻辑
    const validate = useCallback((): boolean => {
        if (required && !currentFile) {
            setValidationError('请选择文件');
            return false;
        }
        setValidationError(null);
        return true;
    }, [required, currentFile]);

    const checkValidity = useCallback((): boolean => {
        return validate() && validationError === null;
    }, [validate, validationError]);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
        handleReset: () => handleReset(),
        validate,
        checkValidity,
        getValidationError: () => validationError,
        setCustomValidity: (message: string) => setValidationError(message),
        markAsTouched: () => setIsTouched(true),
        clearError: () => setValidationError(null),
        reset: () => handleReset(),
        acceptedAndReset: () => handleReset(false),
    }), [handleReset, validate, checkValidity, validationError]);

    // 自定义文件选择处理
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // 格式化文件为 Uppy 所需的格式
            const fileDescriptors = Array.from(files).map(file => ({
                data: file,
                name: file.name,
                size: file.size,
                type: file.type,
            }));
            // 使用 Uppy 的 addFiles 方法添加文件
            uppy.addFiles(fileDescriptors);
        }
    }, [uppy]);

    // 拖放功能处理
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            // 只处理第一个文件并格式化为 Uppy 所需的格式
            const fileDescriptor = {
                data: files[0],
                name: files[0].name,
                size: files[0].size,
                type: files[0].type,
            };
            // 使用 Uppy 的 addFiles 方法添加文件
            uppy.addFiles([fileDescriptor]);
        }
    }, [uppy]);

    // 移除文件
    const handleRemoveFile = useCallback(() => {
        const files = uppy.getFiles();
        if (files.length > 0) {
            uppy.removeFile(files[0].id);
            setCurrentFile(null);
            setUploadStatus('idle');
            setUploadProgress(0);
            setErrorMessage('');
            setValidationError(null);
        }
    }, [uppy]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
        };
    }, []);

    return (
        <div className="space-y-4">
            {/* 自定义文件上传界面 */}
            <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {currentFile ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <Upload className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium truncate max-w-md">{currentFile.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleRemoveFile}
                                className="text-gray-400 hover:text-red-600"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {uploadStatus !== 'idle' && uploadStatus !== 'error' && (
                            <Progress value={uploadProgress} className="w-full max-w-md" />
                        )}
                    </div>
                ) : (
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-3">
                            <div className="bg-gray-100 p-3 rounded-full">
                                <Upload className="h-8 w-8 text-gray-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">拖放文件到此处或</p>
                                <p className="text-sm text-gray-500">支持单个文件上传</p>
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                accept={allowAllFileTypes ? '*' : acceptedFileTypes.join(',')}
                                onChange={handleFileInputChange}
                                className="hidden"
                                multiple={false}
                            />
                            <Button type="button" asChild>
                                <span>选择文件</span>
                            </Button>
                        </div>
                    </label>
                )}
            </div>

            {/* 自定义控制按钮和状态显示 */}
            <div className="flex flex-col gap-2">
                {/* 上传进度条 */}
                {(uploadStatus === 'uploading' || uploadStatus === 'paused') && (
                    <>
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-center text-sm text-gray-500">
                            {uploadProgress.toFixed(1)}% - 状态: {uploadStatus === 'paused' ? '已暂停' : '上传中'}
                        </p>
                    </>
                )}

                {/* 操作按钮组 */}
                <div className="flex justify-center gap-2 flex-wrap">
                    {/* 上传/继续按钮 */}
                    {(uploadStatus === 'idle' || uploadStatus === 'paused') && (
                        <Button
                            type="button"
                            onClick={uploadStatus === 'paused' ? handlePauseResume : handleUpload}
                            disabled={!currentFile}
                        >
                            {uploadStatus === 'paused' ? <Play className="h-4 w-4 mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                            {uploadStatus === 'paused' ? '继续上传' : '开始上传'}
                        </Button>
                    )}

                    {/* 暂停按钮 */}
                    {uploadStatus === 'uploading' && (
                        <Button type="button" onClick={handlePauseResume} variant="outline">
                            <Pause className="h-4 w-4 mr-1" />
                            暂停
                        </Button>
                    )}

                    {/* 取消按钮 */}
                    {(uploadStatus === 'uploading' || uploadStatus === 'paused') && (
                        <Button type="button" onClick={handleCancel} variant="outline">
                            <X className="h-4 w-4 mr-1" />
                            取消
                        </Button>
                    )}

                    {/* 重试按钮 */}
                    {uploadStatus === 'error' && (
                        <Button type="button" onClick={handleRetry} variant="outline">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            重试
                        </Button>
                    )}

                    {/* 重置按钮 */}
                    {(uploadStatus === 'success' || currentFile) && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="outline">
                                    <X className="h-4 w-4 mr-1" />
                                    清除
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>确认清除</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        这将清除当前选择的文件及其上传进度。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleReset()}>确认清除</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* 模板下载按钮 */}
                    {templateFile && (
                        <Button type="button" variant="outline" size="sm" onClick={() => window.open(templateFile, '_blank')}>
                            <Download className="h-4 w-4 mr-1" />
                            {templateLabel || '下载模板'}
                        </Button>
                    )}
                </div>

                {/* 错误和验证信息显示 */}
                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                {(isTouched || currentFile) && validationError && (
                    <Alert variant="default" className="border-red-200 bg-red-50 text-red-800">
                        <Info className="h-4 w-4" />
                        <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                )}

                {uploadStatus === 'success' && (
                    <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
                        <Info className="h-4 w-4" />
                        <AlertDescription>文件上传成功！</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
});

UppyFileUploader.displayName = 'UppyFileUploader';

export default UppyFileUploader;