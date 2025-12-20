import { api, Page } from './client';

// 机构信息接口
export interface Institution {
  id: string;
  fullName: string;
  shortName: string;
  type: string;
  contactPerson: string;
  contactIdType: string;
  contactIdNumber: string;
  contactPhone: string;
  contactEmail: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// 机构API函数
export const institutionApi = {
  // 获取特定机构信息
  async getInstitutionById(id: string) {
    const response = await api.get<Institution>(`/institutions/${id}`);
    return response.data;
  },

  // 获取当前用户所属机构信息（适用于机构管理员）
  async getCurrentUserInstitution() {
    const response = await api.get<Institution>('/manage/institutions/own');
    return response.data;
  },

  // 更新当前用户所属机构信息（适用于机构管理员）
  async updateCurrentUserInstitution(data: Partial<Institution>) {
    const response = await api.put<Institution>('/manage/institutions/own', data);
    return response.data;
  },

  // 验证通过机构（适用于平台管理员）
  async verifyInstitution(id: string) {
    const response = await api.post<Institution>(`/manage/institutions/${id}/verify`);
    return response.data;
  },

  // 获取所有机构列表（公共接口）
  async getAllInstitutions(page: number = 0, size: number = 10) {
    const response = await api.get<Page<Institution>>(`/institutions?page=${page}&size=${size}`);
    return response.data;
  },

  // 根据名称搜索机构（公共接口）
  async searchInstitutions(name: string) {
    const response = await api.get<Page<Institution>>(`/institutions/search?name=${encodeURIComponent(name)}`);
    return response.data;
  },

  // 获取所有机构列表（管理接口，平台管理员专用）
  async getAllInstitutionsForAdmin(page: number = 0, size: number = 10) {
    const response = await api.get<Page<Institution>>('/manage/institutions', {
      params: { page, size }
    });
    return response.data;
  },

  // 搜索机构（管理接口，平台管理员专用）
  async searchInstitutionsForAdmin(name: string, page: number = 0, size: number = 10) {
    const response = await api.get<Page<Institution>>('/manage/institutions/search', {
      params: { name, page, size }
    });
    return response.data;
  },

  // 创建新机构（平台管理员专用）
  async createInstitution(data: Omit<Institution, 'id' | 'createdAt' | 'updatedAt' | 'verified'>) {
    const response = await api.post<Institution>('/manage/institutions', data);
    return response.data;
  },

  // 更新机构信息（平台管理员或机构管理员）
  async updateInstitution(id: string, data: Partial<Institution>) {
    const response = await api.put<Institution>(`/manage/institutions/${id}`, data);
    return response.data;
  },

  // 删除机构（平台管理员专用）
  async deleteInstitution(id: string) {
    const response = await api.delete<void>(`/manage/institutions/${id}`);
    return response.data;
  },

  // 获取机构下的用户列表（管理接口）
  async getInstitutionUsers(institutionId: string, page: number = 0, size: number = 10) {
    const response = await api.get<Page<any>>(`/manage/institutions/${institutionId}/users`, {
      params: { page, size }
    });
    return response.data;
  },

  // 添加用户到机构（机构管理员专用）
  async addUserToInstitution(institutionId: string, userId: string) {
    const response = await api.post<void>(`/manage/institutions/${institutionId}/users/${userId}`);
    return response.data;
  },

  // 从机构移除用户（机构管理员专用）
  async removeUserFromInstitution(institutionId: string, userId: string) {
    const response = await api.delete<void>(`/manage/institutions/${institutionId}/users/${userId}`);
    return response.data;
  },

  // 获取机构下的数据集列表（管理接口）
  async getInstitutionDatasets(institutionId: string, page: number = 0, size: number = 10) {
    const response = await api.get<Page<any>>(`/manage/institutions/${institutionId}/datasets`, {
      params: { page, size }
    });
    return response.data;
  },

  // 获取机构下的申请列表（管理接口）
  async getInstitutionApplications(institutionId: string, page: number = 0, size: number = 10) {
    const response = await api.get<Page<any>>(`/manage/institutions/${institutionId}/applications`, {
      params: { page, size }
    });
    return response.data;
  },

  // 获取机构统计信息（管理接口）
  async getInstitutionStatistics(institutionId: string) {
    const response = await api.get<any>(`/manage/institutions/${institutionId}/statistics`);
    return response.data;
  }
};