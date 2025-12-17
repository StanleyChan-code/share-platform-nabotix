# 研究成果管理接口

研究成果管理分为两类接口：
- 公共接口（部分需认证）：`/api/research-outputs`
- 管理接口（需认证）：`/api/manage/research-outputs`

## 1. 公共研究成果接口

### 1.1 获取研究成果统计信息

**接口地址**: `GET /api/research-outputs/statistics`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**: 无

**说明**: 
- 获取已审批通过的研究成果总数、学术论文数、专利成果数和总引用次数

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究成果统计信息成功",
  "data": {
    "totalApprovedOutputs": 125,
    "academicPapers": 80,
    "patentOutputs": 35,
    "totalCitations": 1250
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.2 分页获取已审核通过的研究成果列表

**接口地址**: `GET /api/research-outputs/public`

**权限要求**: 无需认证，所有用户均可访问

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值       | 描述             |
|---------|--------|----|-----------|----------------|
| page    | int    | 否  | 0         | 页码             |
| size    | int    | 否  | 10        | 每页大小           |
| sortBy  | string | 否  | createdAt | 排序字段           |
| sortDir | string | 否  | desc      | 排序方向（asc/desc） |
| type    | string | 否  | -         | 成果类型筛选         |

**说明**: 
- 任何人都可以查看已审核通过的研究成果
- 可通过[type](file://D:\Code\web\share-platform\src\main\java\cn\com\nabotix\shareplatform\dataset\entity\Dataset.java#L45-L46)参数筛选特定类型的研究成果，类型值参考枚举[OutputType](file:///D:/Code/web/share-platform/src/main/java/cn/com/nabotix/shareplatform/researchoutput/entity/OutputType.java#L10-L15)

**响应示例**:
```json
{
  "success": true,
  "message": "获取公开研究成果列表成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "dataset": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "titleCn": "某研究数据集"
        },
        "submitter": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "username": "researcher",
          "realName": "研究员"
        },
        "type": "PAPER",
        "otherType": null,
        "title": "研究成果标题",
        "abstractText": "研究成果摘要",
        "outputNumber": "RP-2025-001",
        "citationCount": 10,
        "publicationUrl": "https://example.com/paper",
        "fileId": "550e8400-e29b-41d4-a716-446655440003",
        "createdAt": "2025-12-01T10:00:00Z",
        "approved": true,
        "approver": {
          "id": "550e8400-e29b-41d4-a716-446655440004",
          "username": "admin",
          "realName": "管理员"
        },
        "approvedAt": "2025-12-01T11:00:00Z",
        "rejectionReason": null,
        "otherInfo": {}
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

### 1.3 用户提交新的研究成果

**接口地址**: `POST /api/research-outputs`

**权限要求**: 需要认证

**请求体**:
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440001",
  "type": "PAPER",
  "otherType": null,
  "title": "研究成果标题",
  "abstractText": "研究成果摘要",
  "outputNumber": "RP-2025-001",
  "citationCount": 10,
  "publicationUrl": "https://example.com/paper",
  "fileId": "550e8400-e29b-41d4-a716-446655440003",
  "otherInfo": {}
}
```

**说明**: 
- 已登录用户可以提交研究成果

**响应示例**:
```json
{
  "success": true,
  "message": "提交研究成果成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "dataset": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "titleCn": "某研究数据集"
    },
    "submitter": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "researcher",
      "realName": "研究员"
    },
    "type": "PAPER",
    "otherType": null,
    "title": "研究成果标题",
    "abstractText": "研究成果摘要",
    "outputNumber": "RP-2025-001",
    "citationCount": 10,
    "publicationUrl": "https://example.com/paper",
    "fileId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "approved": null,
    "approver": null,
    "approvedAt": null,
    "rejectionReason": null,
    "otherInfo": {}
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.4 用户查询自己提交的研究成果列表

**接口地址**: `GET /api/research-outputs/my-submissions`

**权限要求**: 需要认证

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值       | 描述                                 |
|---------|--------|----|-----------|------------------------------------|
| status  | string | 否  | -         | 状态筛选（all/pending/processed/denied） |
| page    | int    | 否  | 0         | 页码                                 |
| size    | int    | 否  | 10        | 每页大小                               |
| sortBy  | string | 否  | createdAt | 排序字段                               |
| sortDir | string | 否  | desc      | 排序方向（asc/desc）                     |

**说明**: 
- 已登录用户可以查看自己提交的所有研究成果

**响应示例**:
```json
{
  "success": true,
  "message": "获取我的研究成果列表成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "dataset": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "titleCn": "某研究数据集"
        },
        "submitter": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "username": "researcher",
          "realName": "研究员"
        },
        "type": "PAPER",
        "otherType": null,
        "title": "研究成果标题",
        "abstractText": "研究成果摘要",
        "outputNumber": "RP-2025-001",
        "citationCount": 10,
        "publicationUrl": "https://example.com/paper",
        "fileId": "550e8400-e29b-41d4-a716-446655440003",
        "createdAt": "2025-12-01T10:00:00Z",
        "approved": true,
        "approver": {
          "id": "550e8400-e29b-41d4-a716-446655440004",
          "username": "admin",
          "realName": "管理员"
        },
        "approvedAt": "2025-12-01T11:00:00Z",
        "rejectionReason": null,
        "otherInfo": {}
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

### 1.5 用户查询自己提交的特定研究成果

**接口地址**: `GET /api/research-outputs/my-submissions/{id}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述     |
|-----|------|----|--------|
| id  | UUID | 是  | 研究成果ID |

**说明**: 
- 已登录用户可以查看自己提交的特定研究成果

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究成果成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "dataset": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "titleCn": "某研究数据集"
    },
    "submitter": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "researcher",
      "realName": "研究员"
    },
    "type": "PAPER",
    "otherType": null,
    "title": "研究成果标题",
    "abstractText": "研究成果摘要",
    "outputNumber": "RP-2025-001",
    "citationCount": 10,
    "publicationUrl": "https://example.com/paper",
    "fileId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "approved": true,
    "approver": {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "username": "admin",
      "realName": "管理员"
    },
    "approvedAt": "2025-12-01T11:00:00Z",
    "rejectionReason": null,
    "otherInfo": {}
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.6 根据PubMed ID获取文章信息

**接口地址**: `GET /api/research-outputs/pubmed/{pubMedId}`

**权限要求**: 需要认证

**请求参数**:

| 参数名      | 类型     | 必填 | 描述        |
|----------|--------|----|-----------|
| pubMedId | string | 是  | PubMed ID |

**说明**: 
- 已登录用户可以查询PubMed文章信息

**响应示例**:
```json
{
  "success": true,
  "message": "通过PubMed ID拉取研究成果成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "dataset": null,
    "submitter": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "researcher",
      "realName": "研究员"
    },
    "type": "PAPER",
    "otherType": null,
    "title": "从PubMed获取的文章标题",
    "abstractText": "从PubMed获取的文章摘要",
    "outputNumber": "PMID:12345678",
    "citationCount": 25,
    "publicationUrl": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
    "fileId": null,
    "createdAt": "2025-12-01T10:00:00Z",
    "approved": null,
    "approver": null,
    "approvedAt": null,
    "rejectionReason": null,
    "otherInfo": {
      "journal": "Nature",
      "authors": ["Author1", "Author2"],
      "publicationDate": "2025-01-01",
      "doi": "10.1000/xyz123"
    }
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.7 用户删除自己提交的研究成果

**接口地址**: `DELETE /api/research-outputs/{id}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述     |
|-----|------|----|--------|
| id  | UUID | 是  | 研究成果ID |

**说明**: 
- 已登录用户可以删除自己提交的研究成果
- 平台管理员也可以删除任何研究成果

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功",
  "data": null,
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 2. 管理研究成果接口

### 2.1 获取所有管理的研究成果列表

**接口地址**: `GET /api/manage/research-outputs`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、RESEARCH_OUTPUT_APPROVER

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值       | 描述                                 |
|---------|--------|----|-----------|------------------------------------|
| status  | string | 否  | -         | 状态筛选（all/pending/processed/denied） |
| page    | int    | 否  | 0         | 页码                                 |
| size    | int    | 否  | 10        | 每页大小                               |
| sortBy  | string | 否  | createdAt | 排序字段                               |
| sortDir | string | 否  | desc      | 排序方向（asc/desc）                     |

**说明**: 
- 平台管理员可以查看所有研究成果
- 机构管理员和研究成果审核员可以查看本机构成员提交的研究成果

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究成果列表成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "dataset": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "titleCn": "某研究数据集"
        },
        "submitter": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "username": "researcher",
          "realName": "研究员"
        },
        "type": "PAPER",
        "otherType": null,
        "title": "研究成果标题",
        "abstractText": "研究成果摘要",
        "outputNumber": "RP-2025-001",
        "citationCount": 10,
        "publicationUrl": "https://example.com/paper",
        "fileId": "550e8400-e29b-41d4-a716-446655440003",
        "createdAt": "2025-12-01T10:00:00Z",
        "approved": true,
        "approver": {
          "id": "550e8400-e29b-41d4-a716-446655440004",
          "username": "admin",
          "realName": "管理员"
        },
        "approvedAt": "2025-12-01T11:00:00Z",
        "rejectionReason": null,
        "otherInfo": {}
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

### 2.2 根据ID获取特定管理的研究成果

**接口地址**: `GET /api/manage/research-outputs/{id}`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、RESEARCH_OUTPUT_APPROVER

**请求参数**:

| 参数名 | 类型   | 必填 | 描述     |
|-----|------|----|--------|
| id  | UUID | 是  | 研究成果ID |

**说明**: 
- 平台管理员可以查看所有研究成果
- 机构管理员和研究成果审核员可以查看本机构成员提交的研究成果

**响应示例**:
```json
{
  "success": true,
  "message": "获取研究成果成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "dataset": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "titleCn": "某研究数据集"
    },
    "submitter": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "researcher",
      "realName": "研究员"
    },
    "type": "PAPER",
    "otherType": null,
    "title": "研究成果标题",
    "abstractText": "研究成果摘要",
    "outputNumber": "RP-2025-001",
    "citationCount": 10,
    "publicationUrl": "https://example.com/paper",
    "fileId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "approved": true,
    "approver": {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "username": "admin",
      "realName": "管理员"
    },
    "approvedAt": "2025-12-01T11:00:00Z",
    "rejectionReason": null,
    "otherInfo": {}
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.3 修改研究成果审核状态

**接口地址**: `PUT /api/manage/research-outputs/{id}/approval`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、RESEARCH_OUTPUT_APPROVER

**请求参数**:

| 参数名 | 类型   | 必填 | 描述     |
|-----|------|----|--------|
| id  | UUID | 是  | 研究成果ID |

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
  "rejectionReason": "内容不符合要求"
}
```

**说明**: 
- 平台管理员、机构管理员和研究成果审核员可修改任意研究成果的审核状态

**响应示例**:
```json
{
  "success": true,
  "message": "研究成果审核通过",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "dataset": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "titleCn": "某研究数据集"
    },
    "submitter": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "researcher",
      "realName": "研究员"
    },
    "type": "PAPER",
    "otherType": null,
    "title": "研究成果标题",
    "abstractText": "研究成果摘要",
    "outputNumber": "RP-2025-001",
    "citationCount": 10,
    "publicationUrl": "https://example.com/paper",
    "fileId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "approved": true,
    "approver": {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "username": "admin",
      "realName": "管理员"
    },
    "approvedAt": "2025-12-01T12:00:00Z",
    "rejectionReason": null,
    "otherInfo": {}
  },
  "timestamp": "2025-12-01T12:00:00Z"
}
```