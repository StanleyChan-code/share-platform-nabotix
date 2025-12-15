# 数据集申请接口

数据集申请分为两类接口：
- 公共接口（需认证）：`/api/applications`
- 管理接口（需认证）：`/api/manage/applications`

## 1. 公共申请接口

### 1.1 用户申请数据集

**接口地址**: `POST /api/applications`

**权限要求**: 需要认证

**请求体**:
```json
{
  "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
  "applicantRole": "TEAM_RESEARCHER",
  "applicantType": "内部研究人员",
  "projectTitle": "研究项目标题",
  "projectDescription": "研究项目描述",
  "fundingSource": "国家自然科学基金",
  "purpose": "研究目的",
  "projectLeader": "项目负责人",
  "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**说明**: 
- 任何已认证用户都可以申请数据集

**响应示例**:
```json
{
  "success": true,
  "message": "申请提交成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
    "datasetTitle": "数据集标题",
    "applicantId": "550e8400-e29b-41d4-a716-446655440003",
    "applicantName": "申请人姓名",
    "supervisorId": null,
    "supervisorName": null,
    "applicantRole": "TEAM_RESEARCHER",
    "applicantType": "内部研究人员",
    "projectTitle": "研究项目标题",
    "projectDescription": "研究项目描述",
    "fundingSource": "国家自然科学基金",
    "purpose": "研究目的",
    "projectLeader": "项目负责人",
    "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "SUBMITTED",
    "adminNotes": null,
    "providerNotes": null,
    "submittedAt": "2025-12-01T10:00:00Z",
    "providerReviewedAt": null,
    "institutionReviewedAt": null,
    "approvedAt": null
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.2 数据集提供者审核申请

**接口地址**: `PUT /api/applications/{id}/provider-review`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述   |
|-----|------|----|------|
| id  | UUID | 是  | 申请ID |

**请求体**:
```json
{
  "notes": "审核备注",
  "approved": true
}
```

或者驳回:
```json
{
  "notes": "审核备注",
  "approved": false
}
```

**说明**: 
- 数据集提供者可以审核申请

**响应示例**:
```json
{
  "success": true,
  "message": "审核完成",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
    "datasetTitle": "数据集标题",
    "applicantId": "550e8400-e29b-41d4-a716-446655440003",
    "applicantName": "申请人姓名",
    "supervisorId": null,
    "supervisorName": null,
    "applicantRole": "TEAM_RESEARCHER",
    "applicantType": "内部研究人员",
    "projectTitle": "研究项目标题",
    "projectDescription": "研究项目描述",
    "fundingSource": "国家自然科学基金",
    "purpose": "研究目的",
    "projectLeader": "项目负责人",
    "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "PENDING_INSTITUTION_REVIEW",
    "adminNotes": null,
    "providerNotes": "审核备注",
    "submittedAt": "2025-12-01T10:00:00Z",
    "providerReviewedAt": "2025-12-01T11:00:00Z",
    "institutionReviewedAt": null,
    "approvedAt": null
  },
  "timestamp": "2025-12-01T11:00:00Z"
}
```

### 1.3 申请者查询自己的申请记录

**接口地址**: `GET /api/applications/my-applications`

**权限要求**: 需要认证

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值         | 描述             |
|---------|--------|----|-------------|----------------|
| page    | int    | 否  | 0           | 页码             |
| size    | int    | 否  | 10          | 每页大小           |
| sortBy  | string | 否  | submittedAt | 排序字段           |
| sortDir | string | 否  | desc        | 排序方向（asc/desc） |

**说明**: 
- 申请者可以查询自己的申请记录

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
        "datasetTitle": "数据集标题",
        "applicantId": "550e8400-e29b-41d4-a716-446655440003",
        "applicantName": "申请人姓名",
        "supervisorId": null,
        "supervisorName": null,
        "applicantRole": "TEAM_RESEARCHER",
        "applicantType": "内部研究人员",
        "projectTitle": "研究项目标题",
        "projectDescription": "研究项目描述",
        "fundingSource": "国家自然科学基金",
        "purpose": "研究目的",
        "projectLeader": "项目负责人",
        "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
        "status": "PENDING_INSTITUTION_REVIEW",
        "adminNotes": null,
        "providerNotes": "审核备注",
        "submittedAt": "2025-12-01T10:00:00Z",
        "providerReviewedAt": "2025-12-01T11:00:00Z",
        "institutionReviewedAt": null,
        "approvedAt": null
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

### 1.4 数据集提供者查看申请记录列表

**接口地址**: `GET /api/applications/provider-applications`

**权限要求**: 需要认证

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值         | 描述             |
|---------|--------|----|-------------|----------------|
| page    | int    | 否  | 0           | 页码             |
| size    | int    | 否  | 10          | 每页大小           |
| sortBy  | string | 否  | submittedAt | 排序字段           |
| sortDir | string | 否  | desc        | 排序方向（asc/desc） |

**说明**: 
- 数据集提供者可以查看申请记录列表

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
        "datasetTitle": "数据集标题",
        "applicantId": "550e8400-e29b-41d4-a716-446655440003",
        "applicantName": "申请人姓名",
        "supervisorId": null,
        "supervisorName": null,
        "applicantRole": "TEAM_RESEARCHER",
        "applicantType": "内部研究人员",
        "projectTitle": "研究项目标题",
        "projectDescription": "研究项目描述",
        "fundingSource": "国家自然科学基金",
        "purpose": "研究目的",
        "projectLeader": "项目负责人",
        "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
        "status": "PENDING_INSTITUTION_REVIEW",
        "adminNotes": null,
        "providerNotes": "审核备注",
        "submittedAt": "2025-12-01T10:00:00Z",
        "providerReviewedAt": "2025-12-01T11:00:00Z",
        "institutionReviewedAt": null,
        "approvedAt": null
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

### 1.5 软删除申请记录

**接口地址**: `DELETE /api/applications/{id}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述   |
|-----|------|----|------|
| id  | UUID | 是  | 申请ID |

**说明**: 
- 申请人和平台管理员都可以删除申请记录

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
    "datasetTitle": "数据集标题",
    "applicantId": "550e8400-e29b-41d4-a716-446655440003",
    "applicantName": "申请人姓名",
    "supervisorId": null,
    "supervisorName": null,
    "applicantRole": "TEAM_RESEARCHER",
    "applicantType": "内部研究人员",
    "projectTitle": "研究项目标题",
    "projectDescription": "研究项目描述",
    "fundingSource": "国家自然科学基金",
    "purpose": "研究目的",
    "projectLeader": "项目负责人",
    "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "PENDING_INSTITUTION_REVIEW",
    "adminNotes": null,
    "providerNotes": "审核备注",
    "submittedAt": "2025-12-01T10:00:00Z",
    "providerReviewedAt": "2025-12-01T11:00:00Z",
    "institutionReviewedAt": null,
    "approvedAt": null
  },
  "timestamp": "2025-12-01T12:00:00Z"
}
```

## 2. 管理申请接口

### 2.1 申请审核员审核申请

**接口地址**: `PUT /api/manage/applications/{id}/approver-review`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_APPROVER

**请求参数**:

| 参数名 | 类型   | 必填 | 描述   |
|-----|------|----|------|
| id  | UUID | 是  | 申请ID |

**请求体**:
```json
{
  "notes": "审核备注",
  "approved": true
}
```

或者驳回:
```json
{
  "notes": "审核备注",
  "approved": false
}
```

**说明**: 
- 申请审核员可以审核申请

**响应示例**:
```json
{
  "success": true,
  "message": "审核完成",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
    "datasetTitle": "数据集标题",
    "applicantId": "550e8400-e29b-41d4-a716-446655440003",
    "applicantName": "申请人姓名",
    "supervisorId": null,
    "supervisorName": null,
    "applicantRole": "TEAM_RESEARCHER",
    "applicantType": "内部研究人员",
    "projectTitle": "研究项目标题",
    "projectDescription": "研究项目描述",
    "fundingSource": "国家自然科学基金",
    "purpose": "研究目的",
    "projectLeader": "项目负责人",
    "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "APPROVED",
    "adminNotes": "审核备注",
    "providerNotes": "提供者审核备注",
    "submittedAt": "2025-12-01T10:00:00Z",
    "providerReviewedAt": "2025-12-01T11:00:00Z",
    "institutionReviewedAt": "2025-12-01T12:00:00Z",
    "approvedAt": "2025-12-01T12:00:00Z"
  },
  "timestamp": "2025-12-01T12:00:00Z"
}
```

### 2.2 申请审核员查看待审核申请记录列表

**接口地址**: `GET /api/manage/applications/pending-applications`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_APPROVER

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值         | 描述             |
|---------|--------|----|-------------|----------------|
| page    | int    | 否  | 0           | 页码             |
| size    | int    | 否  | 10          | 每页大小           |
| sortBy  | string | 否  | submittedAt | 排序字段           |
| sortDir | string | 否  | desc        | 排序方向（asc/desc） |

**说明**: 
- 申请审核员可以查看待审核申请记录列表

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
        "datasetTitle": "数据集标题",
        "applicantId": "550e8400-e29b-41d4-a716-446655440003",
        "applicantName": "申请人姓名",
        "supervisorId": null,
        "supervisorName": null,
        "applicantRole": "TEAM_RESEARCHER",
        "applicantType": "内部研究人员",
        "projectTitle": "研究项目标题",
        "projectDescription": "研究项目描述",
        "fundingSource": "国家自然科学基金",
        "purpose": "研究目的",
        "projectLeader": "项目负责人",
        "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
        "status": "PENDING_INSTITUTION_REVIEW",
        "adminNotes": null,
        "providerNotes": "提供者审核备注",
        "submittedAt": "2025-12-01T10:00:00Z",
        "providerReviewedAt": "2025-12-01T11:00:00Z",
        "institutionReviewedAt": null,
        "approvedAt": null
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

### 2.3 申请审核员查看已处理申请记录列表

**接口地址**: `GET /api/manage/applications/processed-applications`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_APPROVER

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值         | 描述             |
|---------|--------|----|-------------|----------------|
| page    | int    | 否  | 0           | 页码             |
| size    | int    | 否  | 10          | 每页大小           |
| sortBy  | string | 否  | submittedAt | 排序字段           |
| sortDir | string | 否  | desc        | 排序方向（asc/desc） |

**说明**: 
- 申请审核员可以查看已处理申请记录列表（已批准或已拒绝）

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "approvedApplications": {
      "content": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
          "datasetTitle": "数据集标题",
          "applicantId": "550e8400-e29b-41d4-a716-446655440003",
          "applicantName": "申请人姓名",
          "supervisorId": null,
          "supervisorName": null,
          "applicantRole": "TEAM_RESEARCHER",
          "applicantType": "内部研究人员",
          "projectTitle": "研究项目标题",
          "projectDescription": "研究项目描述",
          "fundingSource": "国家自然科学基金",
          "purpose": "研究目的",
          "projectLeader": "项目负责人",
          "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
          "status": "APPROVED",
          "adminNotes": "审核备注",
          "providerNotes": "提供者审核备注",
          "submittedAt": "2025-12-01T10:00:00Z",
          "providerReviewedAt": "2025-12-01T11:00:00Z",
          "institutionReviewedAt": "2025-12-01T12:00:00Z",
          "approvedAt": "2025-12-01T12:00:00Z"
        }
      ],
      "page": {
        "size": 10,
        "number": 0,
        "totalElements": 3,
        "totalPages": 1
      }
    },
    "deniedApplications": {
      "content": [],
      "page": {
        "size": 10,
        "number": 0,
        "totalElements": 3,
        "totalPages": 1
      }
    }
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```