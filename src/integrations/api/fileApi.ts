import { api } from "@/integrations/api/client";
import { AxiosProgressEvent } from 'axios';

// 文件信息接口
export interface FileInfo {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploaderId: string;
  deleted?: boolean;
  deletedAt?: string | null;
}

// 分片上传初始化响应
export interface ChunkedUploadInitResponse {
  uploadId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
}

// 分片上传响应
export interface ChunkUploadResponse {
  uploadId: string;
  chunkNumber: number;
  success: boolean;
  message: string;
}

// 分片上传状态响应
export interface ChunkedUploadStatusResponse {
  uploadId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  missingChunks: number[];
}

// 创建文件API客户端
export const fileApi = {
  // 普通文件上传
  async uploadFile(file: File, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.client.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });

    return response.data;
  },

  // 初始化分片上传
  async initChunkedUpload(fileName: string, fileSize: number, totalChunks: number) {
    const response = await api.post<ChunkedUploadInitResponse>("/files/chunked-upload/init", {
      fileName,
      fileSize,
      totalChunks,
    });
    return response.data;
  },

  // 上传文件分片
  async uploadChunk(
    file: Blob,
    uploadId: string,
    chunkNumber: number,
    totalChunks: number,
    fileName: string,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadId", uploadId);
    formData.append("chunkNumber", chunkNumber.toString());
    formData.append("totalChunks", totalChunks.toString());
    formData.append("fileName", fileName);

    const response = await api.client.post("/files/chunked-upload/chunk", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });

    return response.data;
  },

  // 查询分片上传状态
  async getChunkedUploadStatus(uploadId: string) {
    const response = await api.get<ChunkedUploadStatusResponse>(`/files/chunked-upload/status?uploadId=${uploadId}`);
    return response.data;
  },

  // 合并分片
  async mergeChunks(uploadId: string) {
    const response = await api.post<FileInfo>(`/files/chunked-upload/merge?uploadId=${uploadId}`);
    return response.data;
  },

  // 取消分片上传
  async cancelUpload(uploadId: string) {
    const response = await api.delete<void>(`/files/tmp/${uploadId}`);
    return response.data;
  },

  // 获取文件信息
  async getFileInfo(fileId: string) {
    const response = await api.get<FileInfo>(`/files/${fileId}/info`);
    return response.data;
  },

  // 下载文件
  async downloadFile(fileId: string) {
    const response = await api.downloadFile(`/files/${fileId}/download`);
    return response.data;
  },

};