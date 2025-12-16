import {api, Page, ResearchSubject} from './client';

// 定义平台统计数据结构
interface PlatformStatistics {
  approvedDatasetCount: number;
  registeredUserCount: number;
  approvedResearchOutputCount: number;
  recentApplicationCount: number;
  datasetCountByType: Record<string, number>;
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