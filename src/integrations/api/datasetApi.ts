import { api } from "@/integrations/api/client";

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
  updatedAt: string; // ISO格式日期时间
  searchCount: number;

  // 关联信息
  subjectArea: {
    id: string;
    name: string;
  };

  // 父级数据集关系
  parentDatasetId?: string;

  // 版本信息
  versions: DatasetVersion[];

  // 时间轴视图中的随访数据集（在特定接口中提供）
  followUpDatasets?: Dataset[];
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
    const response = await api.get<ResearchSubject[]>('/subjects');
    return response.data;
  }
};