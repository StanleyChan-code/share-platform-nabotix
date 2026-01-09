import { api, Page } from './client';

// 用户信息接口
export interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email: string;
  institutionId: string;
  password?: string;
  idType?: string;
  idNumber?: string;
  education?: string;
  title?: string;
  field?: string;
  supervisorId?: string;
  createdAt?: string;
  updatedAt?: string;
  authorities?: string[];
  disabled?: boolean;
}

export interface UserDto {
  id: string;
  name: string;
  phone: string;
  realName: string;
  title: string;
  username: string;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  realName: string;
  phone: string;
  email: string;
  password: string;
  institutionId: string;
  idType?: string;
  idNumber?: string;
  education?: string;
  title?: string;
  field?: string;
  authorities?: string[]; // 添加权限字段
}

// 更新用户信息请求
export interface UpdateUserRequest {
  username?: string;
  phone?: string;
  email?: string;
  education?: string;
  field?: string;
  title?: string;
  realName?: string;
  idType?: string;
  idNumber?: string;
}

// 更新用户权限请求
export interface UpdateUserAuthoritiesRequest {
  userId: string;
  authorities: string[];
}

// 更新手机号请求
export interface UpdatePhoneRequest {
  newPhone: string;
}

// 机构相关用户信息
export interface RelatedUsersDto {
  datasetApprovers?: UserDto[];

  datasetProviders?: UserDto[];

  researchOutputApprovers?: UserDto[];

  institutionUserManagers?: UserDto[];

  institutionSupervisors: UserDto[];
}



// 用户API函数
export const userApi = {
  // 平台管理员创建用户
  async createUser(request: CreateUserRequest) {
    const response = await api.post<User>('/manage/users', request);
    return response.data;
  },

  // 获取用户列表（分页）
  async getUsers(page: number = 0, size: number = 10, institutionId?: string) {
    const response = await api.get<Page<User>>('/manage/users', {
      params: { page, size, institutionId }
    });
    return response.data;
  },

  // 平台管理员获取全部用户列表（分页）
  async getAllUsers(page: number = 0, size: number = 10) {
    const response = await api.get<Page<User>>('/manage/users/all', {
      params: { page, size }
    });
    return response.data;
  },

  // 根据ID获取用户信息
  async getUserById(userId: string) {
    const response = await api.get<User>(`/manage/users/${userId}`);
    return response.data;
  },

  // 根据手机号获取用户信息
  async getUserByPhone(phone: string) {
    const response = await api.get<User>(`/manage/users/phone/${phone}`);
    return response.data;
  },

  // 更新用户信息
  async updateUserByAdmin(userId: string, request: UpdateUserRequest) {
    const response = await api.put<User>(`/manage/users/${userId}/admin-profile`, request);
    return response.data;
  },

  // 获取用户权限列表
  async getUserAuthorities(userId: string) {
    const response = await api.get<string[]>(`/manage/authorities/${userId}`);
    return response.data;
  },

  // 获取系统权限列表
  async getAvailableAuthorities() {
    const response = await api.get<string[]>('/manage/authorities');
    return response.data;
  },

  // 更新用户权限
  async updateUserAuthorities(request: UpdateUserAuthoritiesRequest) {
    const response = await api.put<string>('/manage/authorities', request);
    return response.data;
  },

  // 更新用户手机号
  async updatePhone(userId: string, request: UpdatePhoneRequest) {
    const response = await api.put<User>(`/manage/users/${userId}/phone`, request);
    return response.data;
  },

  // 获取当前用户所属机构的相关用户信息（用户管理员和机构管理员）
  async getInstitutionRelatedUsers() {
    const response = await api.get<RelatedUsersDto>('/users/institution-related-users');
    return response.data;
  },

  // 更新用户禁用状态
  async updateUserDisabledStatus(userId: string, disabled: boolean) {
    const response = await api.put<User>(`/manage/users/${userId}/disabled`, disabled);
    return response.data;
  }

};