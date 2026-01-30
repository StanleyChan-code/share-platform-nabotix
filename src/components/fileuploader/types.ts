import { FileInfo } from "@/integrations/api/fileApi";

export interface FileUploaderProps {
    onUploadComplete?: (fileInfo: FileInfo) => void;
    onResetComplete?: () => void;
    maxSize?: number;
    chunkSize?: number;
    acceptedFileTypes?: string[];
    allowAllFileTypes?: boolean;
    maxConcurrentUploads?: number;
    templateFile?: string;
    templateLabel?: string;
    templateFileName?: string;
    isStaticTemplateFile?: boolean;
    required?: boolean;
    onValidityChange?: (isValid: boolean) => void;
    validateOnSubmit?: boolean;
}

export interface TusFileUploaderProps extends FileUploaderProps {
    tusEndpoint?: string;
}

export interface FileUploaderHandles {
    handleReset: (cleanTmpFile?: boolean) => void;
    validate: () => boolean;
    checkValidity: () => boolean;
    getValidationError: () => string | null;
    setCustomValidity: (message: string) => void;
    markAsTouched: () => void;
    clearError: () => void;
    reset: () => void;
    acceptedAndReset: () => void;
}

export interface UploadState {
    uploadId?: string;
    uploadedFileId?: string;
    uploadedChunks?: number[];
    isChunked?: boolean;
    failedChunks?: number[]; // 失败的分片索引
    retryCount?: number;
    totalChunks?: number;
    fileName?: string;
    fileSize?: number;
    chunkProgress?: { [chunkIndex: number]: number };
}

export interface ChunkTask {
    chunkIndex: number;
    chunk: Blob;
    retryCount: number;
    lastError?: string;
    isPermanentError?: boolean; // 是否为永久性错误（权限错误等）
}