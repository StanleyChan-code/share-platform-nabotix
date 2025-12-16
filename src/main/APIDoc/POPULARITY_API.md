# 热度统计接口

热度统计接口用于获取平台中数据集和研究学科的热度信息，帮助用户了解最受欢迎的内容。

## 1. 热度统计接口

### 1.1 获取热门数据集列表

**接口地址**: `GET /api/popularity/datasets/popular`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名  | 类型  | 必填 | 默认值 | 描述         |
|------|-----|----|-----|------------|
| size | int | 否  | 10  | 返回数量，最大20个 |

**说明**: 
- 按照搜索次数降序排列返回最热门的数据集列表
- 热度非实时，适合快速查看，实时数据请使用 [/api/popularity/datasets/popularity](#13-获取特定数据集的热度值) 接口
- 所有用户均可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取热门数据集列表成功",
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

### 1.2 获取热门研究学科列表

**接口地址**: `GET /api/popularity/subjects/popular`

**权限要求**: 无需认证，所有用户均可访问

**说明**: 
- 按照搜索次数降序排列返回最热门的研究学科列表
- 热度非实时，适合快速查看，实时数据请使用 [/api/popularity/subjects/popularity](#14-获取特定研究学科的热度值) 接口
- 所有用户均可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取热门研究学科列表成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "医学科学",
        "description": "医学科学研究领域",
        "active": true,
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
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

### 1.3 获取特定数据集的热度值

**接口地址**: `GET /api/popularity/datasets/popularity`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名       | 类型   | 必填 | 描述    |
|-----------|------|----|-------|
| datasetId | UUID | 是  | 数据集ID |

**说明**: 
- 获取特定数据集的搜索热度值
- 所有用户均可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取数据集热度成功",
  "data": 1250,
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.4 获取特定研究学科的热度值

**接口地址**: `GET /api/popularity/subjects/popularity`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名       | 类型   | 必填 | 描述     |
|-----------|------|----|--------|
| subjectId | UUID | 是  | 研究学科ID |

**说明**: 
- 获取特定研究学科的搜索热度值
- 所有用户均可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究学科热度成功",
  "data": 860,
  "timestamp": "2025-12-01T10:00:00Z"
}
```