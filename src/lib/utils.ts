import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { api } from "@/integrations/api/client"
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

export function formatISOString(date: Date | string | number): string {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

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
 * 下载文件
 * @param endpoint 下载接口地址
 * @param filename 下载文件名
 * @param isTemplate 是否为模板文件（直接从/template/路径下载，不通过API代理）
 * @returns 下载是否成功
 */
export async function downloadFile(endpoint: string, filename: string, isTemplate: boolean = false): Promise<boolean> {
  try {
    let response;
    
    if (isTemplate) {
      // 模板文件直接从/template/路径下载，不通过API代理
      response = await fetch(`/template/${endpoint}`);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }
    } else {
      // 其他文件通过API代理下载
      response = await api.downloadFile(endpoint);
    }
    
    // 获取blob数据
    const blob = isTemplate ? await response.blob() : new Blob([response.data]);
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('下载失败:', error);
    throw error;
  }
}