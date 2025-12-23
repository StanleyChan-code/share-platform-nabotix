import { api, Page } from './client';
import { FileInfo } from './fileApi';

// 申请记录接口定义
export interface Application {
  id: string;
  datasetId: string;
  datasetInstitutionId: string;
  datasetTitle: string;
  applicantId: string;
  applicantName: string;
  supervisorId: string | null;
  supervisorName: string | null;
  providerId: string | null;
  providerName: string | null;
  applicantRole: string;
  applicantType: string;
  projectTitle: string;
  projectDescription: string;
  fundingSource: string;
  purpose: string;
  projectLeader: string;
  approvalDocumentId: string | null;
  status: 'SUBMITTED' | 'PENDING_PROVIDER_REVIEW' | 'PENDING_INSTITUTION_REVIEW' | 'APPROVED' | 'DENIED';
  adminNotes: string | null;
  providerNotes: string | null;
  submittedAt: string;
  providerReviewedAt: string | null;
  institutionReviewedAt: string | null;
  approvedAt: string | null;
  providerReviewResult: boolean | null;
  institutionReviewResult: boolean | null;
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
 * 数据集提供者查看申请记录列表
 */
export async function getProviderApplications(page: number = 0, size: number = 10, sortBy: string = 'submittedAt', sortDir: string = 'desc') {
  const response = await api.get<Page<Application>>(`/applications/provider-applications?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
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
 * 下载申请文件
 */
export async function downloadApplicationFile(applicationId: string, fileId: string) {
  const response = await api.get(`/applications/${applicationId}/files/${fileId}`, {
    responseType: 'blob'
  });
  return response.data;
}

// 新增：获取指定数据集的已批准研究成果（用于ResearchOutputsTab）
export async function getApprovedResearchOutputs(datasetId: string, page: number = 0, size: number = 10) {
  const response = await api.get<Page<Application>>(`/datasets/${datasetId}/approved-research-outputs?page=${page}&size=${size}`);
  return response.data;
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