import { api } from './client';
import { Page } from './client';

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

// 获取特定机构信息
export const getInstitutionById = async (id: string) => {
  return api.get<Institution>(`/institutions/${id}`);
};

// 获取当前用户所属机构信息（适用于机构管理员）
export const getCurrentUserInstitution = async () => {
  return api.get<Institution>('/manage/institutions/own');
};

// 更新当前用户所属机构信息（适用于机构管理员）
export const updateCurrentUserInstitution = async (data: Partial<Institution>) => {
  return api.put<Institution>('/manage/institutions/own', data);
};

// 验证通过机构（适用于平台管理员）
export const verifyInstitution = async (id: string) => {
  return api.post<Institution>(`/manage/institutions/${id}/verify`);
};

// 获取所有机构列表（公共接口）
export const getAllInstitutions = async (page: number = 0, size: number = 10) => {
  return api.get<Page<Institution>>(`/institutions?page=${page}&size=${size}`);
};

// 根据名称搜索机构（公共接口）
export const searchInstitutions = async (name: string) => {
  return api.get<Page<Institution>>(`/institutions/search?name=${encodeURIComponent(name)}`);
};

// 获取所有机构列表（管理接口，平台管理员专用）
export const getAllInstitutionsForAdmin = async (page: number = 0, size: number = 10) => {
  return api.get<Page<Institution>>('/manage/institutions', {
    params: { page, size }
  });
};

// 创建新机构（平台管理员专用）
export const createInstitution = async (data: Omit<Institution, 'id' | 'createdAt' | 'updatedAt' | 'verified'>) => {
  return api.post<Institution>('/manage/institutions', data);
};

// 更新机构信息（平台管理员或机构管理员）
export const updateInstitution = async (id: string, data: Partial<Institution>) => {
  return api.put<Institution>(`/manage/institutions/${id}`, data);
};

// 删除机构（平台管理员专用）
export const deleteInstitution = async (id: string) => {
  return api.delete<void>(`/manage/institutions/${id}`);
};