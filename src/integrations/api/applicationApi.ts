import { api, Page } from './client';
import {RelatedUsersDto} from "@/integrations/api/userApi.ts";
import {Dataset} from "@/integrations/api/datasetApi.ts";

// 申请记录接口定义
export interface Application {
  id: string;
  dataset: Dataset;

  applicantId: string;
  applicantName: string;
  applicantRole: string;
  applicantType: string;
  projectTitle: string;
  projectDescription: string;
  fundingSource: string;
  purpose: string;
  projectLeader: string;
  approvalDocumentId: string | null;
  submittedAt: string;

  providerId: string | null;
  providerName: string | null;
  providerNotes: string | null;
  providerReviewedAt: string | null;
  providerReviewResult: boolean | null;

  supervisorId: string | null;
  supervisorName: string | null;
  adminNotes: string | null;
  institutionReviewedAt: string | null;
  institutionReviewResult: boolean | null;

  approvedAt: string | null; // 定义改为审结时间（通过或者最终拒绝的时间）
  status: 'SUBMITTED' | 'PENDING_PROVIDER_REVIEW' | 'PENDING_INSTITUTION_REVIEW' | 'APPROVED' | 'DENIED';
}

// 创建申请请求体
export interface CreateApplicationRequest {
  datasetId: string;
  applicantRole: string;
  applicantType: string;
  projectTitle: string;
  projectDescription: string;
  fundingSource: string;
  purpose: string;
  projectLeader: string;
  approvalDocumentId?: string;
}

// 审核申请请求体
export interface ReviewApplicationRequest {
  notes: string;
  approved: boolean;
}

/**
 * 用户申请数据集
 */
export async function createApplication(request: CreateApplicationRequest) {
  const response = await api.post<Application>('/applications', request);
  return response.data;
}

/**
 * 根据数据集ID获取当前用户的申请记录
 */
export async function getApplicationsByDatasetId(datasetId: string) {
  const response = await api.get<Application[]>(`/applications/by-dataset/${datasetId}`);
  return response.data;
}

/**
 * 数据集提供者审核申请
 */
export async function reviewApplicationByProvider(id: string, request: ReviewApplicationRequest) {
  const response = await api.put<Application>(`/applications/${id}/provider-review`, request);
  return response.data;
}

/**
 * 申请者查询自己的申请记录
 */
export async function getMyApplications(page: number = 0, size: number = 10, sortBy: string = 'submittedAt', sortDir: string = 'desc') {
  const response = await api.get<Page<Application>>(`/applications/my-applications?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  return response.data;
}

/**
 * 软删除申请记录
 */
export async function deleteApplication(id: string) {
  const response = await api.delete<Application>(`/applications/${id}`);
  return response.data;
}

/**
 * 根据数据集ID分页获取申请记录列表（管理接口）
 */
export async function getApplicationsByDatasetIdPageManage(
  datasetId: string, 
  page: number = 0, 
  size: number = 10, 
  sortBy: string = 'submittedAt', 
  sortDir: string = 'desc'
) {
  const response = await api.get<Page<Application>>(`/manage/applications/by-dataset/${datasetId}/page?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  return response.data;
}

/**
 * 申请审核员审核申请
 */
export async function reviewApplicationByApprover(id: string, request: ReviewApplicationRequest) {
  const response = await api.put<Application>(`/manage/applications/${id}/approver-review`, request);
  return response.data;
}

/**
 * 获取申请文件下载令牌
 */
export async function getDownloadApplicationFileToken(applicationId: string, fileId: string) {
  return await api.getDownloadToken(`/applications/${applicationId}/files/${fileId}`);
}

// 新增：获取所有申请记录（管理端，支持筛选）
export async function getAllApplications(
  page: number = 0, 
  size: number = 10, 
  sortBy: string = 'submittedAt', 
  sortDir: string = 'desc',
  institutionId?: string,
  projectTitle?: string,
  status?: string
) {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  params.append('sortBy', sortBy);
  params.append('sortDir', sortDir);
  
  if (institutionId) {
    params.append('institutionId', institutionId);
  }
  if (projectTitle) {
    params.append('projectTitle', projectTitle);
  }
  if (status) {
    params.append('status', status);
  }
  
  const response = await api.get<Page<Application>>(`/manage/applications?${params.toString()}`);
  return response.data;
}

/**
 * 根据申请ID获取相关用户信息
 */
export async function getApplicationRelatedUsers(applicationId: string) {
  const response = await api.get<RelatedUsersDto>(`/applications/related-users/${applicationId}`);
  return response.data;
}