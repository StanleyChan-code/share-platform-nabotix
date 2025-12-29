// Token管理工具函数
import {institutionApi} from "@/integrations/api/institutionApi.ts";
import {getCurrentUser, getCurrentUserRoles} from "@/integrations/api/authApi.ts";
import {apiClient} from "@/integrations/api/client.ts";

// 存储等待重试的请求队列
interface QueueItem {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: any;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

/**
 * 获取访问令牌
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * 获取刷新令牌
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

/**
 * 设置访问令牌
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem('access_token', token);

  // 触发认证状态变化事件
  window.dispatchEvent(new CustomEvent('authStatusChanged', { detail: { isAuthenticated: true } }));
};

/**
 * 设置刷新令牌
 */
export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
  
  // 触发认证状态变化事件
  window.dispatchEvent(new CustomEvent('authStatusChanged', { detail: { isAuthenticated: true } }));
};

/**
 * 清除所有令牌
 */
export const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('userInfo');
  
  // 触发认证状态变化事件
  window.dispatchEvent(new CustomEvent('authStatusChanged', { detail: { isAuthenticated: false } }));
};

/**
 * 检查访问令牌是否过期
 * JWT的payload包含exp字段，表示过期时间（Unix时间戳）
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('解析token失败:', error);
    return true;
  }
};

/**
 * 检查用户是否已认证
 */
export const isAuthenticated = (): boolean => {
  const refreshToken = getRefreshToken();
  // 只检查localStorage中的refresh token是否过期
  return refreshToken !== null && !isTokenExpired(refreshToken);
};

/**
 * 添加请求到等待队列
 */
export const addRequestToQueue = (config: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject, config });
  });
};

/**
 * 清空等待队列
 */
export const clearRequestQueue = (error?: any): void => {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve();
    }
  });
  failedQueue = [];
};

/**
 * 获取等待队列
 */
export const getFailedQueue = (): QueueItem[] => {
  return failedQueue;
};

/**
 * 设置刷新状态
 */
export const setIsRefreshing = (status: boolean): void => {
  isRefreshing = status;
};

/**
 * 获取刷新状态
 */
export const getIsRefreshing = (): boolean => {
  return isRefreshing;
};

/**
 * 从sessionStorage获取当前用户信息
 */
export const getCurrentUserInfoFromSession = (): any | null => {
  // 只检查refresh token是否过期，不过期直接返回session中的用户信息
  if (!isAuthenticated()) {
    sessionStorage.removeItem('userInfo');
    return null;
  }
  
  const userInfo = sessionStorage.getItem('userInfo');
  if (userInfo) {
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  }
  return null;
};

/**
 * 从sessionStorage获取当前用户角色
 */
export const getCurrentUserRolesFromSession = (): string[] | null => {
  const currentUserInfoFromSession = getCurrentUserInfoFromSession();
  if (currentUserInfoFromSession && currentUserInfoFromSession.roles) {
    return currentUserInfoFromSession.roles;
  }
  return null;
};

/**
 * 从sessionStorage获取当前用户信息
 */
export const getCurrentUserFromSession = (): any | null => {
  const currentUserInfoFromSession = getCurrentUserInfoFromSession();
  if (currentUserInfoFromSession) {
    return currentUserInfoFromSession.user;
  }
  return null;
};

/**
 * 刷新用户信息
 */
export interface UserInfo {
  user: {
    id: string;
    username: string;
    realName: string;
    email: string;
    phone: string;
    institutionId: string;
    password: string | null;
    idType: string | null;
    idNumber: string | null;
    education: string | null;
    title: string | null;
    field: string | null;
    supervisorId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  roles: string[];
  institution: any | null;
}

export const refreshUserInfo = async (): Promise<UserInfo> => {
  try {
    
    // 获取用户信息
    const userResponse = await getCurrentUser();
    const user = userResponse.data.data;
    
    // 获取用户角色
    const rolesResponse = await getCurrentUserRoles();
    const roles = rolesResponse.data.data;
    
    // 获取机构信息
    let institution;
    if (user.institutionId) {
      try {
        const institutionResponse = await institutionApi.getInstitutionById(user.institutionId);
        institution = institutionResponse.data;
      } catch (instError) {
        console.warn('获取机构信息失败:', instError);
        institution = null;
      }
    }
    
    // 构建用户信息对象
    const userInfo = {
      user,
      roles,
      institution,
    };
    
    // 将用户信息存储到sessionStorage
    sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    return userInfo;
  } catch (error) {
    console.error('刷新用户信息失败:', error);
    throw error;
  }
};