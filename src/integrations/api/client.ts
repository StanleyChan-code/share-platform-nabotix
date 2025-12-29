import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  isAuthenticated as isTokenAuthenticated,
    isTokenExpired,
  addRequestToQueue,
  clearRequestQueue,
  setIsRefreshing,
  getIsRefreshing, getAccessToken,
} from '../../lib/authUtils';

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

// 辅助函数：根据路径决定跳转还是刷新
function handleAuthFailure() {
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/admin') || currentPath.startsWith('/profile')) {
    // 记录原始路径，以便登录后返回
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    clearTokens();
    // 等待缓存清除完成后再跳转
    setTimeout(() => {
      window.location.href = '/auth';
    }, 100);
  } else {
    // 刷新页面前也要清除token，避免刷新后仍使用过期的token
    clearTokens();
    // 等待缓存清除完成后再刷新
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
}

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && token !== 'undefined') {
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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // 检查本地存储的refresh token是否已过期，如果已过期则直接跳转登录
      const refreshToken = getRefreshToken();
      if (!refreshToken || isTokenExpired(refreshToken)) {
        // 如果没有刷新令牌或已过期，使用统一的认证失败处理
        handleAuthFailure();
        return Promise.reject(error);
      }

      if (getIsRefreshing()) {
        // 如果正在刷新，将当前请求加入队列等待
        return addRequestToQueue(originalRequest).then(() => {
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      setIsRefreshing(true);

      try {
        // 调用刷新Token接口
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken
        });
        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

        // 更新本地存储的Token
        setAccessToken(accessToken);
        setRefreshToken(newRefreshToken);

        // 更新后续请求的Authorization头
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // 重试之前失败的请求队列
        clearRequestQueue();
        setIsRefreshing(false);

        // 重试最初的请求
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新Token失败，使用统一的认证失败处理
        clearRequestQueue(refreshError);
        setIsRefreshing(false);
        handleAuthFailure();
        return Promise.reject(refreshError);
      }
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
  setAuthToken(accessToken: string, refreshToken: string) {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  }

  // 清除认证token
  clearAuthToken() {
    clearTokens();
  }

  // 检查是否已认证
  isAuthenticated(): boolean {
    return isTokenAuthenticated();
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