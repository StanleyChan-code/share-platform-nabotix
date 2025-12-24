import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 从环境变量获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 定义标准API响应结构
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// 定义分页响应结构
export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理通用响应格式
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 后端返回格式为 { success: boolean, message: string, data: any, timestamp: string }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 认证失败，清除本地token并重定向到登录页
      localStorage.removeItem('authToken');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// API客户端类
class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  // 通用的CRUD方法
  async get<T = any>(endpoint: string, config?: AxiosRequestConfig) {
    return this.client.get<ApiResponse<T>>(endpoint, config);
  }

  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<ApiResponse<T>>(endpoint, data, config);
  }

  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<ApiResponse<T>>(endpoint, data, config);
  }

  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig) {
    return this.client.delete<ApiResponse<T>>(endpoint, config);
  }

  async downloadFile(endpoint: string, config?: AxiosRequestConfig) {
    return this.client.get(endpoint, {
      ...config,
      responseType: 'blob',
    });
  }

  // 设置认证token
  setAuthToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  // 清除认证token
  clearAuthToken() {
    localStorage.removeItem('authToken');
  }

  // 检查是否已认证
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

// 定义错误类型
interface ApiError extends Error {
  message: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

// 重新导出类型以便其他模块使用
export type { ApiError };

// 导出API客户端实例
export const api = new ApiClient();

// 为了向后兼容，也导出原始的axios实例
export { apiClient };