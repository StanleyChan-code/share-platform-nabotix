// 教育程度枚举
export const EducationLevels = {
  BACHELOR: "学士",
  MASTER: "硕士",
  PHD: "博士",
  POSTDOC: "博士后",
  // PROFESSOR: "教授",
  OTHER: "其他"
} as const;

// 机构类型枚举
export const InstitutionTypes = {
  HOSPITAL: "医院",
  UNIVERSITY: "大学",
  RESEARCH_CENTER: "研究中心",
  LAB: "实验室",
  GOVERNMENT: "政府机构",
  ENTERPRISE: "企业",
  OTHER: "其他"
} as const;

// 数据集类型枚举
export const DatasetTypes = {
  COHORT: '队列研究',
  CASE_CONTROL: '病例对照研究',
  CROSS_SECTIONAL: '横断面研究',
  RCT: '随机对照试验',
  REGISTRY: '登记研究',
  BIOBANK: '生物样本库',
  OMICS: '组学数据',
  WEARABLE: '可穿戴设备'
} as const;

// 申请状态枚举
export const ApplicationStatuses = {
  SUBMITTED: "已提交",
  PENDING_PROVIDER_REVIEW: "待提供方审核",
  PENDING_INSTITUTION_REVIEW: "待机构审核",
  APPROVED: "已批准",
  DENIED: "已拒绝"
} as const;

// 成果类型枚举
export const OutputTypes = {
  PAPER: "论文",
  PUBLICATION: "出版物",
  PROJECT: "项目",
  INVENTION_PATENT: "发明专利",
  UTILITY_PATENT: "实用新型专利",
  SOFTWARE_COPYRIGHT: "软件著作权",
  OTHER_AWARD: "其他奖项"
} as const;

// 证件类型枚举
export const ID_TYPES = {
  NATIONAL_ID: "身份证",
  PASSPORT: "护照",
  OTHER: "其他证件"
} as const;

// 教育程度枚举
export const EDUCATION_LEVELS = {
  BACHELOR: "本科",
  MASTER: "硕士",
  PHD: "博士",
  POSTDOC: "博士后",
  PROFESSOR: "教授",
  OTHER: "其他"
} as const;

