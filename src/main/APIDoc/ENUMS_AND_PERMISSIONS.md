# 枚举类型和权限说明

## 1. 概述

本文档详细描述了系统中使用的枚举类型和用户权限角色。

## 2. 用户权限角色

| 角色                       | 说明      |
|--------------------------|---------|
| PLATFORM_ADMIN           | 平台管理员   |
| INSTITUTION_SUPERVISOR   | 机构管理员   |
| INSTITUTION_USER_MANAGER | 机构用户管理员 |
| DATASET_UPLOADER         | 数据集上传员  |
| DATASET_APPROVER         | 数据集审核员  |
| RESEARCH_OUTPUT_APPROVER | 研究成果审核员 |

## 3. 数据集相关枚举

### 3.1 数据集类型 (DatasetType)

| 值               | 说明      |
|-----------------|---------|
| COHORT          | 队列研究    |
| CASE_CONTROL    | 病例对照研究  |
| CROSS_SECTIONAL | 横断面研究   |
| RCT             | 随机对照试验  |
| REGISTRY        | 登记研究    |
| BIOBANK         | 生物样本库   |
| OMICS           | 组学研究    |
| WEARABLE        | 可穿戴设备研究 |

### 3.2 申请状态 (ApplicationStatus)

| 值                          | 说明     |
|----------------------------|--------|
| SUBMITTED                  | 已提交    |
| PENDING_PROVIDER_REVIEW    | 待提供方审核 |
| PENDING_INSTITUTION_REVIEW | 待机构审核  |
| APPROVED                   | 已批准    |
| DENIED                     | 已拒绝    |

### 3.3 申请角色 (ApplicantRole)


| 值                        | 说明     |
|--------------------------|--------|
| TEAM_RESEARCHER          | 团队研究人员 |
| COLLABORATIVE_RESEARCHER | 协作研究人员 |

## 4. 机构相关枚举

### 4.1 机构类型 (InstitutionType)

| 值               | 说明   |
|-----------------|------|
| HOSPITAL        | 医院   |
| UNIVERSITY      | 大学   |
| RESEARCH_CENTER | 研究中心 |
| LAB             | 实验室  |
| GOVERNMENT      | 政府机构 |
| ENTERPRISE      | 企业   |
| OTHER           | 其他   |

## 5. 用户相关枚举

### 5.1 教育程度 (EducationLevel)

| 值         | 说明  |
|-----------|-----|
| BACHELOR  | 学士  |
| MASTER    | 硕士  |
| PHD       | 博士  |
| POSTDOC   | 博士后 |
| PROFESSOR | 教授  |
| OTHER     | 其他  |

### 5.2 证件类型 (IdType)

| 值           | 说明  |
|-------------|-----|
| NATIONAL_ID | 身份证 |
| PASSPORT    | 护照  |
| OTHER       | 其他  |

## 6. 研究成果相关枚举

### 6.1 成果类型 (OutputType)

| 值                  | 说明     |
|--------------------|--------|
| PAPER              | 论文     |
| PUBLICATION        | 出版物    |
| PROJECT            | 项目     |
| INVENTION_PATENT   | 发明专利   |
| UTILITY_PATENT     | 实用新型专利 |
| SOFTWARE_COPYRIGHT | 软件著作权  |
| OTHER_AWARD        | 其他奖项   |