import { api } from './client';

// 登录请求
export interface LoginCredentials {
  phone: string;
  password?: string;
  verificationCode?: string;
  loginType: string;
}

export interface LoginResponse {
  token: string;
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
  return api.post<LoginResponse>('/auth/login', credentials);
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
    await api.post('/auth/logout');
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // 无论API调用是否成功，都要清理本地状态
    localStorage.removeItem('authToken');
  }
};