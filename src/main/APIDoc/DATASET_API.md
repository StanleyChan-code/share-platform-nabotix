# 数据集管理接口

数据集管理分为两类接口：
- 公共接口（部分需认证）：`/api/datasets`
- 管理接口（需认证）：`/api/manage/datasets`

## 1. 公共数据集接口

### 1.1 通用数据集查询接口

**接口地址**: `GET /api/datasets/query`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名                  | 类型      | 必填 | 默认值                 | 描述                               |
|-----------------------|---------|----|---------------------|----------------------------------|
| subjectAreaId         | UUID    | 否  | -                   | 学科领域ID                           |
| titleCnOrKey          | string  | 否  | -                   | 中文标题或关键词                         |
| providerId            | UUID    | 否  | -                   | 提供者ID                            |
| isTopLevel            | Boolean | 否  | true                | 是否只显示顶级数据集                       |
| currentVersionDateFrom| Instant | 否  | -                   | 当前版本日期起始时间                       |
| currentVersionDateTo  | Instant | 否  | -                   | 当前版本日期结束时间                       |
| page                  | int     | 否  | 0                   | 页码                               |
| size                  | int     | 否  | 10                  | 每页大小                             |
| sortBy                | string  | 否  | currentVersionDate  | 排序字段                             |
| sortDir               | string  | 否  | desc                | 排序方向（asc/desc）                   |

**说明**: 
- 支持多种查询条件组合
- 匿名用户：只能看到已批准且已发布的数据集
- 已登录用户：能看到已批准且已发布的数据集 + 已批准但未公开的用户所属机构能够申请的数据集



**响应示例**:
```json
{
  "success": true,
  "message": "获取公开数据集列表成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "titleCn": "某研究数据集",
        "description": "这是数据集的描述",
        "type": "COHORT",
        "datasetLeader": "张三",
        "principalInvestigator": "李四",
        "dataCollectionUnit": "某某医院",
        "startDate": "2020-01-01T00:00:00Z",
        "endDate": "2022-12-31T00:00:00Z",
        "keywords": ["关键词1", "关键词2"],
        "subjectArea": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "医学科学"
        },
        "category": "临床数据",
        "samplingMethod": "随机抽样",
        "published": true,
        "shareAllData": true,
        "contactPerson": "王五",
        "contactInfo": "wangwu@example.com",
        "demographicFields": ["年龄", "性别"],
        "outcomeFields": ["结果1", "结果2"],
        "firstPublishedDate": "2023-01-01T00:00:00Z",
        "currentVersionDate": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z",
        "versions": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "datasetId": "550e8400-e29b-41d4-a716-446655440000",
            "versionNumber": "1.0",
            "createdAt": "2023-01-01T00:00:00Z",
            "publishedDate": "2023-01-01T00:00:00Z",
            "description": "初始版本",
            "recordCount": 1000,
            "variableCount": 50,
            "approved": true,
            "approvedAt": "2023-01-02T00:00:00Z"
          }
        ]
      }
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 3,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.2 获取指定数据集的所有随访数据集（时间轴视图）

**接口地址**: `GET /api/datasets/{id}/timeline`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 数据集ID |

**说明**: 
- 获取指定id数据集的所有随访数据集，（parentDatasetId = id，时间轴视图）
- 匿名用户：只能看到已批准且已发布的数据集
- 已登录用户：能看到已批准且已发布的数据集 + 已批准但未公开的用户所属机构能够申请的数据集
- 用户需要具有访问父数据集的权限

**响应示例**:
```json
{
  "success": true,
  "message": "获取时间轴式公开数据集列表成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "titleCn": "某研究随访数据集",
      "description": "这是随访数据集的描述",
      "type": "COHORT",
      "datasetLeader": "张三",
      "principalInvestigator": "李四",
      "dataCollectionUnit": "某某医院",
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-12-31T00:00:00Z",
      "keywords": ["关键词1", "关键词3"],
      "subjectArea": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "医学科学"
      },
      "category": "临床数据",
      "samplingMethod": "定期随访",
      "published": true,
      "shareAllData": true,
      "contactPerson": "王五",
      "contactInfo": "wangwu@example.com",
      "demographicFields": {"年龄": "数值型", "性别": "分类型"},
      "outcomeFields": {"结果1": "数值型", "结果2": "分类型"},
      "firstPublishedDate": "2023-06-01T00:00:00Z",
      "currentVersionDate": "2023-06-01T00:00:00Z",
      "updatedAt": "2023-06-01T00:00:00Z",
      "versions": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440003",
          "datasetId": "550e8400-e29b-41d4-a716-446655440001",
          "versionNumber": "1.0",
          "createdAt": "2023-06-01T00:00:00Z",
          "publishedDate": "2023-06-01T00:00:00Z",
          "description": "初始版本",
          "recordCount": 500,
          "variableCount": 30,
          "approved": true,
          "approvedAt": "2023-06-02T00:00:00Z"
        }
      ]
    }
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.3 根据ID获取特定公开数据集

**接口地址**: `GET /api/datasets/{id}`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名        | 类型     | 必填 | 默认值   | 描述              |
|------------|--------|----|-------|-----------------|
| id         | UUID   | 是  | -     | 数据集ID          |
| loadTimeline | boolean | 否  | false | 是否加载随访数据集信息 |

**说明**: 
- 匿名用户：只能访问已批准且已发布的数据集
- 已登录用户：能看到已批准且已发布的数据集 + 已批准但未公开的用户所属机构能够申请的数据集

**响应示例**:
```json
{
  "success": true,
  "message": "获取公开数据集成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titleCn": "某研究数据集",
    "description": "这是数据集的描述",
    "type": "COHORT",
    "datasetLeader": "张三",
    "principalInvestigator": "李四",
    "dataCollectionUnit": "某某医院",
    "startDate": "2020-01-01T00:00:00Z",
    "endDate": "2022-12-31T00:00:00Z",
    "keywords": ["关键词1", "关键词2"],
    "subjectArea": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "医学科学"
    },
    "category": "临床数据",
    "samplingMethod": "随机抽样",
    "published": true,
    "shareAllData": true,
    "contactPerson": "王五",
    "contactInfo": "wangwu@example.com",
    "demographicFields": {"年龄": "数值型", "性别": "分类型"},
    "outcomeFields": {"结果1": "数值型", "结果2": "分类型"},
    "firstPublishedDate": "2023-01-01T00:00:00Z",
    "currentVersionDate": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "followUpDatasets": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "titleCn": "某研究随访数据集",
        "description": "这是随访数据集的描述",
        "type": "COHORT",
        "datasetLeader": "张三",
        "principalInvestigator": "李四",
        "dataCollectionUnit": "某某医院",
        "startDate": "2023-01-01T00:00:00Z",
        "endDate": "2023-12-31T00:00:00Z",
        "keywords": ["关键词1", "关键词3"],
        "subjectArea": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "医学科学"
        },
        "category": "临床数据",
        "samplingMethod": "定期随访",
        "published": true,
        "shareAllData": true,
        "contactPerson": "王五",
        "contactInfo": "wangwu@example.com",
        "demographicFields": {"年龄": "数值型", "性别": "分类型"},
        "outcomeFields": {"结果1": "数值型", "结果2": "分类型"},
        "firstPublishedDate": "2023-06-01T00:00:00Z",
        "currentVersionDate": "2023-06-01T00:00:00Z",
        "updatedAt": "2023-06-01T00:00:00Z",
        "versions": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "datasetId": "550e8400-e29b-41d4-a716-446655440001",
            "versionNumber": "1.0",
            "createdAt": "2023-06-01T00:00:00Z",
            "publishedDate": "2023-06-01T00:00:00Z",
            "description": "初始版本",
            "recordCount": 500,
            "variableCount": 30,
            "approved": true,
            "approvedAt": "2023-06-02T00:00:00Z"
          }
        ]
      }
    ],
    "versions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "versionNumber": "1.0",
        "createdAt": "2023-01-01T00:00:00Z",
        "publishedDate": "2023-01-01T00:00:00Z",
        "description": "初始版本",
        "recordCount": 1000,
        "variableCount": 50,
        "approved": true,
        "approvedAt": "2023-01-02T00:00:00Z"
      }
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.5 根据数据集ID获取所有版本信息

**接口地址**: `GET /api/datasets/{id}/versions`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 数据集ID |

**说明**: 
- 匿名用户：只能看到已批准且已发布的数据集版本
- 已登录用户：能看到已批准且已发布的数据集版本 + 已批准但未公开的用户所属机构能够申请的数据集版本

**响应示例**:
```json
{
  "success": true,
  "message": "获取数据集版本信息成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "datasetId": "550e8400-e29b-41d4-a716-446655440000",
      "versionNumber": "1.0",
      "createdAt": "2023-01-01T00:00:00Z",
      "publishedDate": "2023-01-01T00:00:00Z",
      "description": "初始版本",
      "fileRecordId": "550e8400-e29b-41d4-a716-446655440004",
      "dataDictRecordId": "550e8400-e29b-41d4-a716-446655440005",
      "termsAgreementRecordId": "550e8400-e29b-41d4-a716-446655440006",
      "dataSharingRecordId": "550e8400-e29b-41d4-a716-446655440007",
      "approved": true,
      "approvedAt": "2023-01-02T00:00:00Z",
      "rejectReason": null,
      "recordCount": 1000,
      "variableCount": 50,
      "supervisor": {
        "id": "550e8400-e29b-41d4-a716-446655440008",
        "username": "admin",
        "realName": "管理员"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440009",
      "datasetId": "550e8400-e29b-41d4-a716-446655440000",
      "versionNumber": "2.0",
      "createdAt": "2023-06-01T00:00:00Z",
      "publishedDate": "2023-06-01T00:00:00Z",
      "description": "更新版本",
      "fileRecordId": "550e8400-e29b-41d4-a716-446655440010",
      "dataDictRecordId": "550e8400-e29b-41d4-a716-446655440011",
      "termsAgreementRecordId": "550e8400-e29b-41d4-a716-446655440012",
      "dataSharingRecordId": "550e8400-e29b-41d4-a716-446655440013",
      "approved": true,
      "approvedAt": "2023-06-02T00:00:00Z",
      "rejectReason": null,
      "recordCount": 1200,
      "variableCount": 55,
      "supervisor": {
        "id": "550e8400-e29b-41d4-a716-446655440008",
        "username": "admin",
        "realName": "管理员"
      }
    }
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.5 下载数据集版本的数据字典文件

**接口地址**: `GET /api/datasets/{datasetId}/versions/{versionId}/data-dictionary`

**权限要求**: 需要认证

**请求参数**:

| 参数名      | 类型   | 必填 | 描述      |
|----------|------|----|---------|
| datasetId | UUID | 是  | 数据集ID   |
| versionId | UUID | 是  | 数据集版本ID |

**说明**: 
- 需要用户登录才能下载
- 返回的是文件下载流

### 1.6 下载数据集版本的使用协议文件

**接口地址**: `GET /api/datasets/{datasetId}/versions/{versionId}/terms-agreement`

**权限要求**: 需要认证

**请求参数**:

| 参数名      | 类型   | 必填 | 描述      |
|----------|------|----|---------|
| datasetId | UUID | 是  | 数据集ID   |
| versionId | UUID | 是  | 数据集版本ID |

**说明**: 
- 需要用户登录才能下载
- 返回的是文件下载流

### 1.7 下载数据集版本的数据分享文件

**接口地址**: `GET /api/datasets/{datasetId}/versions/{versionId}/data-sharing`

**权限要求**: 需要认证

**请求参数**:

| 参数名      | 类型   | 必填 | 描述      |
|----------|------|----|---------|
| datasetId | UUID | 是  | 数据集ID   |
| versionId | UUID | 是  | 数据集版本ID |

**说明**: 
- 需要用户登录并且有相应的申请审批通过记录，或者自己是提供者
- 需要经过申请数据集的下载权限
- 返回的是文件下载流

### 1.8 软删除数据集

**接口地址**: `DELETE /api/datasets/{id}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 数据集ID |

**说明**: 
- 平台管理员可删除任意数据集，数据集上传员只能删除自己上传的数据集
- 需要用户已认证

**响应示例**:
```json
{
  "success": true,
  "message": "数据集删除成功",
  "data": null,
  "timestamp": "2025-12-01T10:00:00Z"
}
```



## 2. 管理数据集接口

### 2.1 根据标题模糊搜索数据集列表

**接口地址**: `GET /api/manage/datasets/search`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_UPLOADER

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值       | 描述             |
|---------|--------|----|-----------|----------------|
| title   | string | 是  | -         | 搜索关键词          |
| page    | int    | 否  | 0         | 页码             |
| size    | int    | 否  | 10        | 每页大小           |
| sortBy  | string | 否  | updatedAt | 排序字段           |
| sortDir | string | 否  | desc      | 排序方向（asc/desc） |

**说明**: 
- 平台管理员和机构管理员可访问所有数据集，数据集上传员只能看到自己上传的数据集

### 2.2 获取所有管理的数据集列表

**接口地址**: `GET /api/manage/datasets`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_UPLOADER

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值       | 描述             |
|---------|--------|----|-----------|----------------|
| page    | int    | 否  | 0         | 页码             |
| size    | int    | 否  | 10        | 每页大小           |
| sortBy  | string | 否  | updatedAt | 排序字段           |
| sortDir | string | 否  | desc      | 排序方向（asc/desc） |

**说明**: 
- 平台管理员和机构管理员可访问所有数据集，数据集上传员只能看到自己上传的数据集

**响应示例**:
```json
{
  "success": true,
  "message": "获取数据集列表成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "titleCn": "某研究数据集",
        "description": "这是数据集的描述",
        "type": "COHORT",
        "datasetLeader": "张三",
        "principalInvestigator": "李四",
        "dataCollectionUnit": "某某医院",
        "startDate": "2020-01-01T00:00:00Z",
        "endDate": "2022-12-31T00:00:00Z",
        "keywords": ["关键词1", "关键词2"],
        "subjectArea": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "医学科学"
        },
        "category": "临床数据",
        "samplingMethod": "随机抽样",
        "published": true,
        "shareAllData": true,
        "contactPerson": "王五",
        "contactInfo": "wangwu@example.com",
        "demographicFields": ["年龄", "性别"],
        "outcomeFields": ["结果1", "结果2"],
        "firstPublishedDate": "2023-01-01T00:00:00Z",
        "currentVersionDate": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z",
        "versions": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "datasetId": "550e8400-e29b-41d4-a716-446655440000",
            "versionNumber": "1.0",
            "createdAt": "2023-01-01T00:00:00Z",
            "publishedDate": "2023-01-01T00:00:00Z",
            "description": "初始版本",
            "recordCount": 1000,
            "variableCount": 50,
            "approved": true,
            "approvedAt": "2023-01-02T00:00:00Z"
          }
        ]
      }
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 3,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.3 根据ID获取特定管理的数据集

**接口地址**: `GET /api/manage/datasets/{id}`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_UPLOADER

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 数据集ID |

**说明**: 
- 平台管理员和机构管理员可访问所有数据集
- 数据集上传员只能看到自己上传数据集

**响应示例**:
```json
{
  "success": true,
  "message": "获取数据集成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titleCn": "某研究数据集",
    "description": "这是数据集的描述",
    "type": "COHORT",
    "datasetLeader": "张三",
    "principalInvestigator": "李四",
    "dataCollectionUnit": "某某医院",
    "startDate": "2020-01-01T00:00:00Z",
    "endDate": "2022-12-31T00:00:00Z",
    "keywords": ["关键词1", "关键词2"],
    "subjectArea": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "医学科学"
    },
    "category": "临床数据",
    "samplingMethod": "随机抽样",
    "published": true,
    "shareAllData": true,
    "contactPerson": "王五",
    "contactInfo": "wangwu@example.com",
    "demographicFields": ["年龄", "性别"],
    "outcomeFields": ["结果1", "结果2"],
    "firstPublishedDate": "2023-01-01T00:00:00Z",
    "currentVersionDate": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "versions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "versionNumber": "1.0",
        "createdAt": "2023-01-01T00:00:00Z",
        "publishedDate": "2023-01-01T00:00:00Z",
        "description": "初始版本",
        "recordCount": 1000,
        "variableCount": 50,
        "approved": true,
        "approvedAt": "2023-01-02T00:00:00Z"
      }
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.4 创建新的数据集

**接口地址**: `POST /api/manage/datasets`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_UPLOADER

**请求体**:
```json
{
  "titleCn": "新数据集",
  "description": "这是一个新数据集的描述",
  "type": "COHORT",
  "datasetLeader": "张三",
  "principalInvestigator": "李四",
  "dataCollectionUnit": "某某医院",
  "startDate": "2020-01-01",
  "endDate": "2022-12-31",
  "keywords": ["关键词1", "关键词2"],
  "subjectAreaId": "550e8400-e29b-41d4-a716-446655440001",
  "category": "临床数据",
  "samplingMethod": "随机抽样",
  "published": true,
  "shareAllData": true,
  "contactPerson": "王五",
  "contactInfo": "wangwu@example.com",
  "demographicFields": ["年龄", "性别"],
  "outcomeFields": ["结果1", "结果2"],
  "parentDatasetId": "550e8400-e29b-41d4-a716-446655440002",
  "applicationInstitutionIds": ["550e8400-e29b-41d4-a716-446655440003"],
  "versionNumber": "1.0",
  "versionDescription": "初始版本",
  "fileRecordId": "550e8400-e29b-41d4-a716-446655440004",
  "dataDictRecordId": "550e8400-e29b-41d4-a716-446655440005",
  "termsAgreementRecordId": "550e8400-e29b-41d4-a716-446655440006",
  "dataSharingRecordId": "550e8400-e29b-41d4-a716-446655440007",
  "recordCount": 1000,
  "variableCount": 50
}
```

**说明**: 
- 平台管理员可创建任意机构的数据集，机构管理员和数据集上传员只能创建自己机构的数据集

**响应示例**:
```json
{
  "success": true,
  "message": "创建数据集成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titleCn": "新数据集",
    "description": "这是一个新数据集的描述",
    "type": "COHORT",
    "datasetLeader": "张三",
    "principalInvestigator": "李四",
    "dataCollectionUnit": "某某医院",
    "startDate": "2020-01-01T00:00:00Z",
    "endDate": "2022-12-31T00:00:00Z",
    "keywords": ["关键词1", "关键词2"],
    "subjectArea": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "医学科学"
    },
    "category": "临床数据",
    "samplingMethod": "随机抽样",
    "published": true,
    "shareAllData": true,
    "contactPerson": "王五",
    "contactInfo": "wangwu@example.com",
    "demographicFields": ["年龄", "性别"],
    "outcomeFields": ["结果1", "结果2"],
    "firstPublishedDate": "2025-12-01T10:00:00Z",
    "currentVersionDate": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z",
    "versions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440008",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "versionNumber": "1.0",
        "createdAt": "2025-12-01T10:00:00Z",
        "publishedDate": null,
        "description": "初始版本",
        "recordCount": 1000,
        "variableCount": 50,
        "approved": null,
        "approvedAt": null
      }
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.5 更新现有数据集基本信息

**接口地址**: `PUT /api/manage/datasets/{id}/basic-info`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_UPLOADER

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 数据集ID |

**请求体**:
```json
{
  "description": "更新后的数据集描述",
  "keywords": ["关键词1", "关键词3"],
  "published": false,
  "shareAllData": false,
  "contactPerson": "赵六",
  "contactInfo": "zhaoliu@example.com",
  "demographicFields": ["年龄", "性别", "职业"],
  "outcomeFields": ["结果1", "结果2", "结果3"],
  "samplingMethod": "分层抽样",
  "applicationInstitutionIds": ["550e8400-e29b-41d4-a716-446655440003", "550e8400-e29b-41d4-a716-446655440004"]
}
```

**说明**: 
- 平台管理员可更新任意数据集，机构管理员只能更新自己机构，数据集上传员只能更新自己的数据集

**响应示例**:
```json
{
  "success": true,
  "message": "更新数据集基本信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titleCn": "新数据集",
    "description": "更新后的数据集描述",
    "type": "COHORT",
    "datasetLeader": "张三",
    "principalInvestigator": "李四",
    "dataCollectionUnit": "某某医院",
    "startDate": "2020-01-01T00:00:00Z",
    "endDate": "2022-12-31T00:00:00Z",
    "keywords": ["关键词1", "关键词3"],
    "subjectArea": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "医学科学"
    },
    "category": "临床数据",
    "samplingMethod": "分层抽样",
    "published": false,
    "shareAllData": false,
    "contactPerson": "赵六",
    "contactInfo": "zhaoliu@example.com",
    "demographicFields": ["年龄", "性别", "职业"],
    "outcomeFields": ["结果1", "结果2", "结果3"],
    "firstPublishedDate": "2025-12-01T10:00:00Z",
    "currentVersionDate": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T11:00:00Z",
    "versions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440008",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "versionNumber": "1.0",
        "createdAt": "2025-12-01T10:00:00Z",
        "publishedDate": null,
        "description": "初始版本",
        "recordCount": 1000,
        "variableCount": 50,
        "approved": null,
        "approvedAt": null
      }
    ]
  },
  "timestamp": "2025-12-01T11:00:00Z"
}
```

### 2.6 为现有数据集添加新版本

**接口地址**: `POST /api/manage/datasets/{id}/versions`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_UPLOADER

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 数据集ID |

**请求体**:
```json
{
  "versionNumber": "2.0",
  "versionDescription": "第二版",
  "fileRecordId": "550e8400-e29b-41d4-a716-446655440009",
  "dataDictRecordId": "550e8400-e29b-41d4-a716-446655440010",
  "termsAgreementRecordId": "550e8400-e29b-41d4-a716-446655440011",
  "dataSharingRecordId": "550e8400-e29b-41d4-a716-446655440012",
  "recordCount": 1200,
  "variableCount": 55
}
```

**说明**: 
- 平台管理员可为任意数据集添加版本，机构管理员只能为自己机构的数据集添加版本，数据集上传员只能为自己的数据集添加版本

**响应示例**:
```json
{
  "success": true,
  "message": "添加数据集新版本成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440013",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "versionNumber": "2.0",
    "createdAt": "2025-12-01T11:00:00Z",
    "publishedDate": null,
    "description": "第二版",
    "recordCount": 1200,
    "variableCount": 55,
    "approved": null,
    "approvedAt": null,
    "rejectReason": null,
    "supervisor": null
  },
  "timestamp": "2025-12-01T11:00:00Z"
}
```

### 2.7 更新数据集版本审核状态

**接口地址**: `PUT /api/manage/datasets/{id}/{datasetVersionId}/approval`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_APPROVER

**请求参数**:

| 参数名            | 类型   | 必填 | 描述        |
|----------------|------|----|-----------|
| id             | UUID | 是  | 数据集ID     |
| datasetVersionId | UUID | 是  | 数据集版本ID   |

**请求体**:
```json
{
  "approved": true,
  "rejectionReason": null
}
```

或者驳回:
```json
{
  "approved": false,
  "rejectionReason": "数据质量不符合要求"
}
```

**说明**: 
- 平台管理员、机构管理员和数据集审核员可修改任意数据集的审核状态

**响应示例**:
```json
{
  "success": true,
  "message": "数据集审核通过",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440013",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "versionNumber": "2.0",
    "createdAt": "2025-12-01T11:00:00Z",
    "publishedDate": "2025-12-01T12:00:00Z",
    "description": "第二版",
    "recordCount": 1200,
    "variableCount": 55,
    "approved": true,
    "approvedAt": "2025-12-01T12:00:00Z",
    "rejectReason": null,
    "supervisor": {
      "id": "550e8400-e29b-41d4-a716-446655440014",
      "username": "admin",
      "realName": "管理员"
    }
  },
  "timestamp": "2025-12-01T12:00:00Z"
}
```