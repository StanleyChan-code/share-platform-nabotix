import { api } from "@/integrations/api/client";

// 定义研究成果相关接口
export interface ResearchOutput {
  id: string;
  dataset: {
    id: string;
    titleCn: string;
  } | null;
  submitter: {
    id: string;
    username: string;
    realName: string;
  };
  type: string;
  otherType: string | null;
  title: string;
  abstractText: string;
  outputNumber: string;
  citationCount: number;
  publicationUrl: string | null;
  fileId: string | null;
  createdAt: string;
  approved: boolean | null;
  approver: {
    id: string;
    username: string;
    realName: string;
  } | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  otherInfo: Record<string, any>;
}

export interface OutputStatistics {
  totalApprovedOutputs: number;
  academicPapers: number;
  patentOutputs: number;
  totalCitations: number;
}

export interface Pagination {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginatedOutputs {
  content: ResearchOutput[];
  page: Pagination;
}

// 研究成果API函数
export const outputApi = {
  // 获取研究成果统计信息
  async getOutputStatistics() {
    const response = await api.get<OutputStatistics>('/research-outputs/statistics');
    return response.data;
  },

  // 分页获取已审核通过的研究成果列表
  async getPublicOutputs(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page?.toString() || '0');
    queryParams.append('size', params.size?.toString() || '10');
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);

    const response = await api.get<PaginatedOutputs>(`/research-outputs/public?${queryParams.toString()}`);
    return response.data.data;
  },

  // 根据PubMed ID获取文章信息
  async getPubMedOutput(pubMedId: string) {
    const response = await api.get<ResearchOutput>(`/research-outputs/pubmed/${pubMedId}`);
    return response.data.data;
  },

  // 用户提交新的研究成果
  async submitOutput(output: {
    datasetId: string;
    type: string;
    otherType: string | null;
    title: string;
    abstractText: string;
    outputNumber: string;
    citationCount: number;
    publicationUrl: string;
    fileId: string;
    otherInfo: Record<string, any>;
  }) {
    const response = await api.post<ResearchOutput>('/research-outputs', output);
    return response.data.data;
  },

  // 用户查询自己提交的研究成果列表
  async getMySubmissions(params: {
    status?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    queryParams.append('page', params.page?.toString() || '0');
    queryParams.append('size', params.size?.toString() || '10');
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);

    const response = await api.get<PaginatedOutputs>(`/research-outputs/my-submissions?${queryParams.toString()}`);
    return response.data.data;
  }
};