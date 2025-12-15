# 研究学科管理接口

研究学科管理分为两类接口：
- 公共接口（无需认证）：`/api/research-subjects`
- 管理接口（需认证）：`/api/manage/research-subjects`

## 1. 公共研究学科接口

### 1.1 获取所有激活的研究学科列表

**接口地址**: `GET /api/research-subjects`

**权限要求**: 无需认证，所有用户均可访问

**说明**: 
- 所有用户均可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究学科列表成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "医学科学",
      "description": "医学科学研究领域",
      "active": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.2 根据ID获取特定研究学科

**接口地址**: `GET /api/research-subjects/{id}`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名 | 类型   | 必填 | 描述     |
|-----|------|----|--------|
| id  | UUID | 是  | 研究学科ID |

**说明**: 
- 所有用户均可访问（无论是否激活）

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究学科成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "医学科学",
    "description": "医学科学研究领域",
    "active": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.3 根据研究学科ID分页获取相关的数据集列表

**接口地址**: `GET /api/research-subjects/{subjectAreaId}/datasets`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名           | 类型     | 必填 | 默认值       | 描述             |
|---------------|--------|----|-----------|----------------|
| subjectAreaId | UUID   | 是  | -         | 研究学科ID         |
| page          | int    | 否  | 0         | 页码             |
| size          | int    | 否  | 10        | 每页大小           |
| sortBy        | string | 否  | createdAt | 排序字段           |
| sortDir       | string | 否  | desc      | 排序方向（asc/desc） |

**说明**: 
- 所有用户均可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取数据集列表成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "titleCn": "某医学研究数据集",
        "description": "这是医学研究数据集的描述",
        "type": "COHORT",
        "datasetLeader": "张三",
        "principalInvestigator": "李四",
        "dataCollectionUnit": "某某医院",
        "startDate": "2020-01-01T00:00:00Z",
        "endDate": "2022-12-31T00:00:00Z",
        "keywords": ["医学", "研究"],
        "subjectArea": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
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
            "datasetId": "550e8400-e29b-41d4-a716-446655440001",
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

## 2. 管理研究学科接口

### 2.1 获取所有研究学科列表

**接口地址**: `GET /api/manage/research-subjects`

**权限要求**: 仅平台管理员可访问

**说明**: 
- 仅平台管理员可访问（包括激活和非激活的）

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究学科列表成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "医学科学",
      "description": "医学科学研究领域",
      "active": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "物理学",
      "description": "物理学研究领域",
      "active": false,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.2 根据ID获取特定研究学科

**接口地址**: `GET /api/manage/research-subjects/{id}`

**权限要求**: 仅平台管理员可访问

**请求参数**:

| 参数名 | 类型   | 必填 | 描述     |
|-----|------|----|--------|
| id  | UUID | 是  | 研究学科ID |

**说明**: 
- 仅平台管理员可访问（无论是否激活）

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究学科成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "医学科学",
    "description": "医学科学研究领域",
    "active": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.3 创建新的研究学科

**接口地址**: `POST /api/manage/research-subjects`

**权限要求**: 仅平台管理员可访问

**请求体**:
```json
{
  "name": "新研究学科",
  "description": "新研究学科的描述",
  "active": true
}
```

**说明**: 
- 仅平台管理员可访问

**响应示例**:
```json
{
  "success": true,
  "message": "创建研究学科成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "新研究学科",
    "description": "新研究学科的描述",
    "active": true,
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.4 更新现有研究学科

**接口地址**: `PUT /api/manage/research-subjects/{id}`

**权限要求**: 仅平台管理员可访问

**请求参数**:

| 参数名 | 类型   | 必填 | 描述     |
|-----|------|----|--------|
| id  | UUID | 是  | 研究学科ID |

**请求体**:
```json
{
  "name": "更新后的研究学科",
  "description": "更新后的研究学科描述",
  "active": false
}
```

**说明**: 
- 仅平台管理员可访问

**响应示例**:
```json
{
  "success": true,
  "message": "更新研究学科成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "更新后的研究学科",
    "description": "更新后的研究学科描述",
    "active": false,
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T11:00:00Z"
  },
  "timestamp": "2025-12-01T11:00:00Z"
}
```

### 2.5 删除研究学科

**接口地址**: `DELETE /api/manage/research-subjects/{id}`

**权限要求**: 仅平台管理员可访问

**请求参数**:

| 参数名 | 类型   | 必填 | 描述     |
|-----|------|----|--------|
| id  | UUID | 是  | 研究学科ID |

**说明**: 
- 仅平台管理员可访问

**响应示例**:
```json
{
  "success": true,
  "message": "删除研究学科成功",
  "data": null,
  "timestamp": "2025-12-01T10:00:00Z"
}
```