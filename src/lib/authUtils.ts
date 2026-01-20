// Token管理工具函数
import {institutionApi} from "@/integrations/api/institutionApi.ts";
import {getCurrentUser, getCurrentUserRoles} from "@/integrations/api/authApi.ts";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_INFO_KEY,
  AUTH_BROADCAST_CHANNEL,
} from "@/lib/constants.ts";

// 存储等待重试的请求队列
interface QueueItem {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: any;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

// BroadcastChannel 用于跨 tab 通知（如果环境支持）
const authChannel = typeof window !== 'undefined' && (window as any).BroadcastChannel ? new (window as any).BroadcastChannel(AUTH_BROADCAST_CHANNEL) : null;

// 防止重复清除token导致多次事件触发（抖动抑制）
let _lastClearAt = 0;
const CLEAR_SUPPRESSION_MS = 500; // 500ms内重复的clearTokens调用会被抑制

/**
 * 获取访问令牌
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * 获取刷新令牌
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * 单一入口设置access和refresh token
 */
export const setAuthTokens = (accessToken: string | null, refreshToken: string | null, suppressEvent = false): void => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // 触发认证状态变化事件（减少噪声，仅在必要时触发）
  if (!suppressEvent) {
    // 触发统一的认证状态变化事件，包含用户信息
    const event = new CustomEvent('authStatusChanged', {
      detail: {
        isAuthenticated: !!refreshToken,
        userInfo: refreshToken ? getCurrentUserInfoFromSession() : null
      }
    });
    window.dispatchEvent(event);
    
    // 跨标签页通知
    if (authChannel) {
      try {
        authChannel.postMessage({ 
          type: 'authStatusChanged', 
          isAuthenticated: !!refreshToken
        });
      } catch (e) {
        // ignore
      }
    }
  }
};

/**
 * 清除所有令牌
 */
export const clearTokens = (suppressEvent = false): void => {
  const now = Date.now();
  // 如果上一次清除在短时间内发生，抑制重复调用
  if (now - _lastClearAt < CLEAR_SUPPRESSION_MS) {
    return;
  }
  _lastClearAt = now;

  // 仅在确实存在token时才触发事件，避免不必要的广播
  const hadToken = !!(localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY));

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);

  if (!suppressEvent && hadToken) {
    window.dispatchEvent(new CustomEvent('authStatusChanged', { detail: { isAuthenticated: false } }));
    if (authChannel) {
      try {
        authChannel.postMessage({ type: 'authStatusChanged', isAuthenticated: false });
      } catch (e) {
        // ignore
      }
    }
  }
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
 * 如果提供 error，则 reject 否则 resolve
 * 注意：在重试之前应确保 apiClient.defaults.headers.common['Authorization'] 已更新
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
 * 清除所有Cookies
 */
export const clearCookies = (): void => {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
};

/**
 * 统一跳转到认证页面
 * @param from 来源页面路径，用于登录后返回
 */
export const redirectToAuth = (from?: string): void => {
  // 记录来源页面路径
  if (from && from !== '/auth') {
    sessionStorage.setItem('redirectAfterLogin', from);
  } else {
    // 如果没有提供来源路径，使用当前路径
    const currentPath = window.location.pathname;
    if (currentPath !== '/auth') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
  }

  // 清除令牌和用户信息
  clearTokens(true);
  
  // 清除Cookies
  clearCookies();
  
  // 跳转到认证页面
  window.location.href = '/auth';
};

/**
 * 获取当前用户信息（从 localStorage，这样可以触发 storage 事件进行跨tab同步）
 */
export const getCurrentUserInfoFromSession = (): any | null => {
  // 只检查refresh token是否过期，不过期直接返回localStorage中的用户信息
  if (!isAuthenticated()) {
    localStorage.removeItem(USER_INFO_KEY);
    return null;
  }

  const userInfo = localStorage.getItem(USER_INFO_KEY);
  if (userInfo) {
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  }

  // 如果localStorage中没有用户信息，但token有效，自动获取用户信息并缓存
  return null;
};

// 自动获取并缓存用户信息的函数
export const getOrFetchUserInfo = async (): Promise<any | null> => {
  // 首先尝试从localStorage获取
  let userInfo = getCurrentUserInfoFromSession();
  if (userInfo) {
    return userInfo;
  }

  // 如果localStorage中没有，但认证有效，尝试获取并缓存
  if (isAuthenticated()) {
    try {
      return await refreshUserInfo();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  return null;
};

// 统一处理登录成功后的所有操作
export const handleLoginSuccess = async (accessToken: string, refreshToken: string, loginData: any): Promise<any> => {
  // 先保存token到内存但不触发事件
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  
  // 直接使用登录接口返回的完整信息
  const { user, roles, institution } = loginData;
  
  // 构建用户信息对象
  const userInfo = {
    user,
    roles,
    institution
  };
  
  // 将用户信息存储到localStorage
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  
  // 通过 BroadcastChannel 通知其他 tab 用户信息已更新
  if (authChannel) {
    try {
      authChannel.postMessage({ type: 'userInfoUpdated' });
    } catch (e) {
      // ignore
    }
  }
  
  // 用户信息获取完成后，触发认证状态变化事件
  // 创建事件对象
  const eventDetail = {
    isAuthenticated: true,
    accessToken,
    refreshToken,
    userInfo
  };
  
  // 触发认证状态变化事件
  window.dispatchEvent(new CustomEvent('authStatusChanged', { detail: eventDetail }));
  
  // 通过 BroadcastChannel 通知其他 tab 页认证状态已更新
  if (authChannel) {
    try {
      authChannel.postMessage({ type: 'authStatusChanged', ...eventDetail });
    } catch (e) {
      // ignore
    }
  }
  
  return userInfo;
};

/**
 * 从localStorage获取当前用户角色
 */
export const getCurrentUserRolesFromSession = (): string[] | null => {
  const currentUserInfoFromSession = getCurrentUserInfoFromSession();
  if (currentUserInfoFromSession && currentUserInfoFromSession.roles) {
    return currentUserInfoFromSession.roles;
  }
  return null;
};

/**
 * 从localStorage获取当前用户信息
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
    
    // 将用户信息存储到localStorage（以便触发 storage 事件进行跨tab同步）
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

    // 通过 BroadcastChannel 通知其他 tab
    if (authChannel) {
      try {
        authChannel.postMessage({ type: 'userInfoUpdated' });
      } catch (e) {
        // ignore
      }
    }

    return userInfo;
  } catch (error) {
    console.error('刷新用户信息失败:', error);
    throw error;
  }
};