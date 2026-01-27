import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"
import {FileDownloadTokenDto} from "@/integrations/api/client"
import {fileApi, FileInfo} from "@/integrations/api/fileApi"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * 格式化日期为 yyyy-MM-dd 格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string | number): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * 格式化日期为 yyyy-MM-dd hh:mm:ss 格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDateTime(date: Date | string | number): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatISOString(date: Date | string | number, toDayEnd: boolean = false): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (toDayEnd) {
        // 格式化日期为 yyyy-MM-dd 23:59:59 格式
        return `${year}-${month}-${day}T23:59:59Z`;
    }

    // 直接构造 UTC 时间的 ISO 字符串
    return `${year}-${month}-${day}T00:00:00Z`;
}

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件信息
 * @param fileId 文件ID
 * @returns 文件信息
 */
export async function getFileInfo(fileId: string): Promise<FileInfo | null> {
    try {
        const response = await fileApi.getFileInfo(fileId);
        if (response.success) {
            return response.data;
        }
        throw new Error('获取文件信息失败');
    } catch (error) {
        console.error('查询文件信息失败:', error);
        throw error;
    }
}

/**
 * 下载模版文件（在/template/路径下直接下载，不通过API代理）
 * @param endpoint 下载接口地址
 * @param filename 下载文件名
 * @returns 下载是否成功
 */
export async function downloadTemplateFile(endpoint: string, filename: string = undefined): Promise<string> {
    try {
        // 模板文件直接从/template/路径下载，不通过API代理
        const link = document.createElement('a');
        link.href = `/template/${endpoint}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return filename;
    } catch (error) {
        console.error('下载失败:', error);
        throw error;
    }
}

/**
 * 下载文件
 * @param downloadToken 文件下载令牌
 * @returns 下载文件名
 */
export async function downloadFile(downloadToken: FileDownloadTokenDto): Promise<string> {
    try {
        // 获取下载令牌
        const {token, fileId, downloadUrlTemplate, saveFileName} = downloadToken;

        // 构建实际的下载URL
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const downloadUrl = `${apiBaseUrl}/files/download${downloadUrlTemplate.replace('{token}', token).replace('{fileId}', fileId)}`;

        // 创建下载链接
        const link = document.createElement('a');
        link.href = downloadUrl;
        // 使用后端提供的文件名
        link.download = saveFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return saveFileName;
    } catch (error) {
        console.error('下载失败:', error);
        throw error;
    }
}

export function generateDownloadUrl(downloadToken: FileDownloadTokenDto): string {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const {token, fileId, downloadUrlTemplate} = downloadToken;
    return `${apiBaseUrl}/files/download${downloadUrlTemplate.replace('{token}', token).replace('{fileId}', fileId)}`;
}