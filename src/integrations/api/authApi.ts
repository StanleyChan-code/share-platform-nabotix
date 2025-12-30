import { api } from './client';
import { refreshAfterLogin } from "@/lib/pendingCountsController";
import { getRefreshToken } from "@/lib/authUtils";

// 登录请求
export interface LoginCredentials {
  phone: string;
  password?: string;
  verificationCode?: string;
  loginType: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  roles: string[];
  user: {
    id: number;
    username: string;
    phone: string;
    realName?: string;
    email?: string;
  };
}

export const login = async (credentials: LoginCredentials) => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  
  // 登录成功后保存双token
  if (response.data.success) {
    const { accessToken, refreshToken } = response.data.data;
    api.setAuthToken(accessToken, refreshToken);
    
    // 登录成功后立即刷新待审核数量
    refreshAfterLogin();
  }
  
  return response;
};

// 注册请求
export interface RegisterData {
  phone: string;
  verificationCode: string;
  username: string;
  realName: string;
  email?: string;
  password: string;
  idType: string;
  idNumber: string;
  institutionId: string;
}

export const register = async (userData: RegisterData) => {
  return api.post<void>('/auth/register', userData);
};

// 发送验证码请求
export interface VerificationCodeData {
  phone: string;
  businessType?: string;
}

export const sendVerificationCode = async (phone: string, businessType?: string) => {
  return api.post<void>('/auth/send-verification-code', { phone, businessType });
};

// 获取当前用户信息
export interface UserProfile {
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
}

export const getCurrentUser = async () => {
  return api.get<UserProfile>('/users/profile');
};

// 获取当前用户角色
export const getCurrentUserRoles = async () => {
  return api.get<string[]>('/users/authorities');
};

// 更新用户信息请求
export interface UpdateUserProfileData {
  username: string;
  email: string;
  education: string;
  field: string;
  title: string;
}

export const updateUserProfile = async (userData: UpdateUserProfileData) => {
  return api.put<UserProfile>('/users/profile', userData);
};

// 登出请求
export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // 无论API调用是否成功，都要清理本地状态
    api.clearAuthToken();
    
    // 登出时重置待审核数量为0
    // 由于我们无法直接访问控制器内部状态，我们可以通过刷新来重置
    // 这将在API返回401错误时自动将数量设为0
  }
};
