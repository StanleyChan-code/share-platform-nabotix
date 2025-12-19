import { api } from "@/integrations/api/client";
import { Page } from "@/integrations/api/client";

interface UserDto{
  id: string;
  name: string;
  phone: string;
  realName: string;
  title: string;
  username: string;
}

// 定义数据集相关接口
export interface Dataset {
  // 基本信息
  id: string;
  titleCn: string;
  description: string;
  type: string; // 数据集类型，如 "COHORT"
  datasetLeader: string;
  principalInvestigator: string;
  dataCollectionUnit: string;
  startDate: string; // ISO格式日期时间
  endDate: string; // ISO格式日期时间
  keywords: string[];
  category?: string; // 过时不用，请使用subjectArea
  samplingMethod: string;
  published: boolean;
  shareAllData: boolean;
  contactPerson: string;
  contactInfo: string;
  demographicFields: string[] | Record<string, string>; // 可能是数组或键值对对象
  outcomeFields: string[] | Record<string, string>; // 可能是数组或键值对对象
  firstPublishedDate: string; // ISO格式日期时间
  currentVersionDate: string; // ISO格式日期时间
  createdAt: string;
  updatedAt: string; // ISO格式日期时间
  searchCount: number;

  // 关联信息
  subjectArea: {
    id: string;
    name: string;
  };
  provider: UserDto;



  // 父级数据集关系
  parentDatasetId?: string;

  // 版本信息
  versions: DatasetVersion[];

  // 时间轴视图中的随访数据集（在特定接口中提供）
  followUpDatasets?: Dataset[];
  
  // 申请机构限制
  applicationInstitutionIds?: string[] | null;
}

export interface DatasetVersion {
  id: string;
  datasetId: string;
  versionNumber: string;
  createdAt: string; // ISO格式日期时间
  publishedDate: string | null; // ISO格式日期时间或null
  description: string;
  recordCount: number;
  variableCount: number;
  approved: boolean | null;
  approvedAt: string | null; // ISO格式日期时间或null
  rejectReason: string | null;
  supervisor: {
    id: string;
    username: string;
    realName: string;
  } | null;

  // 文件记录ID（管理接口中使用）
  fileRecordId?: string;
  dataDictRecordId?: string;
  termsAgreementRecordId?: string;
  dataSharingRecordId?: string;
}

// 定义研究方向（学科）结构
export interface ResearchSubject {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  searchCount: number;
}

// 分页查询参数
export interface Pageable {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// 查询参数接口
export interface DatasetQueryParams {
  subjectAreaId?: string;
  titleCnOrKey?: string;
  providerId?: string;
  isTopLevel?: boolean;
  currentVersionDateFrom?: string;
  currentVersionDateTo?: string;
  loadTimeline?: boolean;
}

// 创建数据集请求参数
export interface CreateDatasetRequest {
  titleCn: string;
  description: string;
  type: string;
  datasetLeader: string;
  principalInvestigator: string;
  dataCollectionUnit: string;
  startDate: string;
  endDate: string;
  keywords: string[];
  subjectAreaId: string;
  category?: string;
  samplingMethod: string;
  published: boolean;
  shareAllData: boolean;
  contactPerson: string;
  contactInfo: string;
  demographicFields: string[] | Record<string, string>;
  outcomeFields: string[] | Record<string, string>;
  parentDatasetId?: string;
  applicationInstitutionIds?: string[] | null;
  versionNumber: string;
  versionDescription: string;
  fileRecordId: string;
  dataDictRecordId: string;
  termsAgreementRecordId: string;
  dataSharingRecordId: string;
  recordCount: number;
  variableCount: number;
}

// 更新数据集基本信息请求参数
export interface UpdateDatasetBasicInfoRequest {
  description: string;
  keywords: string[];
  published: boolean;
  shareAllData: boolean;
  contactPerson: string;
  contactInfo: string;
  demographicFields: string[] | Record<string, string>;
  outcomeFields: string[] | Record<string, string>;
  samplingMethod: string;
  applicationInstitutionIds: string[] | null;
}

// 添加数据集版本请求参数
export interface AddDatasetVersionRequest {
  versionNumber: string;
  description: string;
  fileRecordId: string;
  dataDictRecordId: string;
  termsAgreementRecordId: string;
  dataSharingRecordId: string;
  recordCount: number;
  variableCount: number;
}

// 更新数据集版本审核状态请求参数
export interface UpdateDatasetVersionApprovalRequest {
  approved: boolean;
  rejectionReason?: string;
}

// 数据集API函数
export const datasetApi = {
  // 获取数据集详情
  async getDatasetById(id: string, loadTimeline: boolean = false) {
    const response = await api.get<Dataset>(`/datasets/${id}?loadTimeline=${loadTimeline}`);
    return response.data;
  },

  // 获取所有数据集
  async getAllDatasets() {
    const response = await api.get<Dataset[]>('/datasets');
    return response.data;
  },

  // 根据条件搜索数据集
  async searchDatasets(params: {
    searchTerm?: string;
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params.category && params.category !== 'all') queryParams.append('category', params.category);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);

    const response = await api.get<Dataset[]>(`/datasets/search?${queryParams.toString()}`);
    return response.data;
  },

  // 获取数据集版本
  async getDatasetVersions(datasetId: string) {
    const response = await api.get<DatasetVersion[]>(`/datasets/${datasetId}/versions`);
    return response.data;
  },

  // 获取研究学科领域
  async getResearchSubjects() {
    const response = await api.get<ResearchSubject[]>('/research-subjects');
    return response.data;
  },

  // 根据条件查询数据集
  async queryDatasets(params: {
    page?: number;
    size?: number;
    searchTerm?: string;
    type?: string;
    subjectAreaId?: string;
    dateFrom?: string;
    dateTo?: string;
    loadTimeline?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('loadTimeline', String(params.loadTimeline ?? true));

    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.searchTerm) queryParams.append('titleCnOrKey', params.searchTerm);
    if (params.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params.subjectAreaId) queryParams.append('subjectAreaId', params.subjectAreaId);
    if (params.dateFrom) queryParams.append('currentVersionDateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('currentVersionDateTo', params.dateTo);

    const response = await api.get<Page<Dataset>>(`/datasets/query?${queryParams.toString()}`);
    return response.data;
  },

  // 获取数据集时间轴（随访数据集）
  async getDatasetTimeline(id: string) {
    const response = await api.get<Dataset[]>(`/datasets/${id}/timeline`);
    return response.data;
  },

  // 管理接口 - 获取所有管理的数据集列表（分页）
  async getManageableDatasets(params?: Pageable) {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

    const response = await api.get<Page<Dataset>>(`/manage/datasets?${queryParams.toString()}`);
    return response.data;
  },

  // 管理接口 - 根据ID获取特定管理的数据集
  async getManageableDatasetById(id: string) {
    const response = await api.get<Dataset>(`/manage/datasets/${id}`);
    return response.data;
  },
  // 高级搜索数据集接口
  async advancedSearchDatasets(params: {
    institutionId?: string;
    subjectAreaId?: string;
    titleCnOrKey?: string;
    providerId?: string;
    isTopLevel?: boolean;
    currentVersionDateFrom?: string;
    currentVersionDateTo?: string;
    type?: string;
    published?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const queryParams = new URLSearchParams();

    if (params.institutionId) queryParams.append('institutionId', params.institutionId);
    if (params.subjectAreaId) queryParams.append('subjectAreaId', params.subjectAreaId);
    if (params.titleCnOrKey) queryParams.append('titleCnOrKey', params.titleCnOrKey);
    if (params.providerId) queryParams.append('providerId', params.providerId);
    if (params.isTopLevel !== undefined) queryParams.append('isTopLevel', String(params.isTopLevel));
    if (params.currentVersionDateFrom) queryParams.append('currentVersionDateFrom', params.currentVersionDateFrom);
    if (params.currentVersionDateTo) queryParams.append('currentVersionDateTo', params.currentVersionDateTo);
    if (params.type) queryParams.append('type', params.type);
    if (params.published !== undefined) queryParams.append('published', String(params.published));

    // 分页参数
    queryParams.append('page', (params.page ?? 0).toString());
    queryParams.append('size', (params.size ?? 10).toString());
    queryParams.append('sortBy', params.sortBy ?? 'currentVersionDate');
    queryParams.append('sortDir', params.sortDir ?? 'desc');

    const response = await api.get<Page<Dataset>>(`/manage/datasets/advanced?${queryParams.toString()}`);
    return response.data;
  },



  // 管理接口 - 创建新的数据集
  async createDataset(data: CreateDatasetRequest) {
    const response = await api.post<Dataset>('/manage/datasets', data);
    return response.data;
  },

  // 管理接口 - 更新现有数据集基本信息
  async updateDatasetBasicInfo(id: string, data: UpdateDatasetBasicInfoRequest) {
    const response = await api.put<Dataset>(`/manage/datasets/${id}/basic-info`, data);
    return response.data;
  },

  // 管理接口 - 为现有数据集添加新版本
  async addDatasetVersion(id: string, data: AddDatasetVersionRequest) {
    const response = await api.post<DatasetVersion>(`/manage/datasets/${id}/versions`, data);
    return response.data;
  },

  // 管理接口 - 更新数据集版本审核状态
  async updateDatasetVersionApproval(
    datasetId: string,
    datasetVersionId: string,
    data: UpdateDatasetVersionApprovalRequest
  ) {
    const response = await api.put<DatasetVersion>(
      `/manage/datasets/${datasetId}/${datasetVersionId}/approval`,
      data
    );
    return response.data;
  },

  // 管理接口 - 根据标题模糊搜索数据集列表
  async searchManageableDatasets(title: string, params?: Pageable) {
    const queryParams = new URLSearchParams();
    queryParams.append('title', title);

    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

    const response = await api.get<Page<Dataset>>(`/manage/datasets/search?${queryParams.toString()}`);
    return response.data;
  },

  // 下载数据集版本的数据字典文件
  async downloadDataDictionary(datasetId: string, versionId: string) {
    const response = await api.downloadFile(`/datasets/${datasetId}/versions/${versionId}/data-dictionary`);
    return response.data;
  },

  // 下载数据集版本的使用协议文件
  async downloadTermsAgreement(datasetId: string, versionId: string) {
    const response = await api.downloadFile(`/datasets/${datasetId}/versions/${versionId}/terms-agreement`);
    return response.data;
  },

  // 下载数据集版本的数据分享文件
  async downloadDataSharing(datasetId: string, versionId: string) {
    const response = await api.downloadFile(`/datasets/${datasetId}/versions/${versionId}/data-sharing`);
    return response.data;
  },

  // 软删除数据集
  async deleteDataset(id: string) {
    const response = await api.delete<void>(`/datasets/${id}`);
    return response.data;
  }
};