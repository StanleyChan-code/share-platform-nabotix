import {api, Page} from './client';

// 定义平台统计数据结构
interface PlatformStatistics {
  approvedDatasetCount: number;
  registeredUserCount: number;
  approvedResearchOutputCount: number;
  recentApplicationCount: number;
  datasetCountByType: Record<string, number>;
}

// 定义数据集统计信息结构
interface DatasetStatistics {
  id: string;
  datasetVersionId: string;
  version: string;
  metadata: {
    variableCount: number;
    recordCount: number;
  };
  variables: Array<{
    type: string;
    name: string;
    label: string;
    description: string;
    otherInfo: any;
  }>;
  statisticalFile: string;
  createdAt: string;
  variableCount: number;
  recordCount: number;
}

// 定义年度数据集统计结构
interface AnnualDatasetStatistics {
  year: number;
  count: number;
}

// 获取平台统计数据
export const getPlatformStatistics = async () => {
  return api.get<PlatformStatistics>('/platform/statistics');
};

// 获取热门研究主题
export const getPopularSubjects = async () => {
  return api.get<Page<ResearchSubject>>('/popularity/subjects/popular');
};

// 获取特定研究主题的热度
export const getSubjectPopularity = async (subjectId: string) => {
  return api.get<number>(`/popularity/subjects/popularity?subjectId=${subjectId}`);
};

// 获取年度数据集统计
export const getAnnualDatasetStatistics = async () => {
  return api.get<AnnualDatasetStatistics[]>('/datasets/annual');
};

// 根据数据集版本ID获取数据集统计信息
export const getDatasetStatisticsByVersionId = async (datasetVersionId: string) => {
  return api.get<DatasetStatistics>(`/datasets/statistics/dataset-statistics/by-dataset-version/${datasetVersionId}`);
};