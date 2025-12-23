# 申请管理接口

数据集申请管理分为两类接口：
- 公共申请接口（部分需认证）：`/api/applications`
- 管理申请接口（需认证）：`/api/manage/applications`

## 更新日志

- 新增数据集申请接口
- 新增申请审核接口
- 新增申请查询接口
- 新增申请管理接口

## 1. 公共申请接口

### 1.1 用户申请数据集

**接口地址**: `POST /api/applications`

**权限要求**: 需要认证

**请求体**:
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "applicantRole": "TEAM_RESEARCHER",
  "applicantType": "团队研究人员",
  "projectTitle": "研究项目标题",
  "projectDescription": "项目详细描述",
  "fundingSource": "资金来源",
  "purpose": "使用目的",
  "projectLeader": "项目负责人",
  "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**说明**: 
- 用户申请指定数据集的访问权限
- 申请提交后，状态变为SUBMITTED（已弃用，实际上会直接到待提供者审核状态）

**响应示例**:
```json
{
  "success": true,
  "message": "申请提交成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "datasetInstitutionId": "550e8400-e29b-41d4-a716-446655440003",
    "datasetTitle": "数据集标题",
    "applicantId": "550e8400-e29b-41d4-a716-446655440004",
    "applicantName": "申请人姓名",
    "supervisorId": null,
    "supervisorName": null,
    "providerId": "550e8400-e29b-41d4-a716-446655440005",
    "providerName": "提供者姓名",
    "applicantRole": "TEAM_RESEARCHER",
    "applicantType": "团队研究人员",
    "projectTitle": "研究项目标题",
    "projectDescription": "项目详细描述",
    "fundingSource": "资金来源",
    "purpose": "使用目的",
    "projectLeader": "项目负责人",
    "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "SUBMITTED",
    "adminNotes": null,
    "providerNotes": null,
    "submittedAt": "2025-12-23T10:00:00Z",
    "providerReviewedAt": null,
    "institutionReviewedAt": null,
    "approvedAt": null,
    "providerReviewResult": null,
    "institutionReviewResult": null
  },
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 1.2 用户更新自己的申请

**接口地址**: `PUT /api/applications/{id}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 申请ID |

**请求体**:
```json
{
  "applicantRole": "COLLABORATIVE_RESEARCHER",
  "applicantType": "协作研究人员",
  "projectTitle": "更新后的研究项目标题",
  "projectDescription": "更新后的项目详细描述",
  "fundingSource": "更新后的资金来源",
  "purpose": "更新后的使用目的",
  "projectLeader": "更新后的项目负责人",
  "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**说明**: 
- 用户更新自己的申请（仅在未被数据集提供者审核前允许）

**响应示例**:
```json
{
  "success": true,
  "message": "更新申请成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "applicantId": "550e8400-e29b-41d4-a716-446655440004",
    "applicantRole": "COLLABORATIVE_RESEARCHER",
    "applicantType": "协作研究人员",
    "projectTitle": "更新后的研究项目标题",
    "projectDescription": "更新后的项目详细描述",
    "fundingSource": "更新后的资金来源",
    "purpose": "更新后的使用目的",
    "projectLeader": "更新后的项目负责人",
    "approvalDocumentId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "SUBMITTED",
    "submittedAt": "2025-12-23T10:00:00Z"
  },
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 1.3 根据数据集ID获取当前用户的申请记录

**接口地址**: `GET /api/applications/by-dataset/{datasetId}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| datasetId  | UUID | 是  | 数据集ID |

**说明**: 
- 获取当前用户对指定数据集的申请记录

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "datasetId": "550e8400-e29b-41d4-a716-446655440000",
      "applicantId": "550e8400-e29b-41d4-a716-446655440004",
      "projectTitle": "研究项目标题",
      "status": "SUBMITTED",
      "submittedAt": "2025-12-23T10:00:00Z"
    }
  ],
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 1.4 检查当前用户对指定数据集是否有特定状态的申请记录

**接口地址**: `GET /api/applications/check-by-dataset/{datasetId}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|--------|--------|----|---------|
| datasetId | UUID | 是  | 数据集ID |
| status | string | 是  | 申请状态 (SUBMITTED, PENDING_PROVIDER_REVIEW, PENDING_INSTITUTION_REVIEW, APPROVED, DENIED) |

**说明**: 
- 检查当前用户对指定数据集是否有特定状态的申请记录
- （SUBMITTED已弃用，实际上会直接到待提供者审核状态）

**响应示例**:
```json
{
  "success": true,
  "message": "找到申请记录",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "datasetId": "550e8400-e29b-41d4-a716-446655440000",
      "applicantId": "550e8400-e29b-41d4-a716-446655440004",
      "projectTitle": "研究项目标题",
      "status": "APPROVED",
      "submittedAt": "2025-12-23T10:00:00Z",
      "approvedAt": "2025-12-23T11:00:00Z"
    }
  ],
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 1.5 数据集提供者审核申请

**接口地址**: `PUT /api/applications/{id}/provider-review`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 申请ID |

**请求体**:
```json
{
  "notes": "审核意见",
  "approved": true
}
```

**说明**: 
- 数据集提供者审核申请
- 这里不加入方法级权限限制是为了避免上传者的当前权限修改过导致错误
- approved为true表示批准，false表示拒绝，null表示重置审核状态

**响应示例**:
```json
{
  "success": true,
  "message": "审核完成",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "applicantId": "550e8400-e29b-41d4-a716-446655440004",
    "status": "PENDING_INSTITUTION_REVIEW",
    "providerNotes": "审核意见",
    "providerReviewedAt": "2025-12-23T11:00:00Z",
    "providerReviewResult": true
  },
  "timestamp": "2025-12-23T11:00:00Z"
}
```

### 1.6 申请者查询自己的申请记录

**接口地址**: `GET /api/applications/my-applications`

**权限要求**: 需要认证

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值        | 描述             |
|---------|--------|----|------------|----------------|
| page    | int    | 否  | 0          | 页码             |
| size    | int    | 否  | 10         | 每页大小           |
| sortBy  | string | 否  | submittedAt | 排序字段           |
| sortDir | string | 否  | desc       | 排序方向（asc/desc） |

**说明**: 
- 申请者查询自己提交的所有申请记录

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "datasetTitle": "数据集标题",
        "applicantId": "550e8400-e29b-41d4-a716-446655440004",
        "applicantName": "申请人姓名",
        "projectTitle": "研究项目标题",
        "status": "APPROVED",
        "submittedAt": "2025-12-23T10:00:00Z",
        "approvedAt": "2025-12-23T12:00:00Z"
      }
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 1.7 申请者查询自己已批准的申请对应的数据集列表

**接口地址**: `GET /api/applications/my-approved-datasets`

**权限要求**: 需要认证

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值       | 描述             |
|---------|--------|----|-----------|----------------|
| page    | int    | 否  | 0         | 页码             |
| size    | int    | 否  | 10        | 每页大小           |

**说明**: 
- 申请者查询自己已批准的申请，按批准时间倒序排列

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "datasetTitle": "数据集标题",
        "projectTitle": "研究项目标题",
        "status": "APPROVED",
        "approvedAt": "2025-12-23T12:00:00Z"
      }
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 1.8 数据集提供者查看申请记录列表

**接口地址**: `GET /api/applications/provider-applications`

**权限要求**: 需要认证

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值        | 描述             |
|---------|--------|----|------------|----------------|
| page    | int    | 否  | 0          | 页码             |
| size    | int    | 否  | 10         | 每页大小           |
| sortBy  | string | 否  | submittedAt | 排序字段           |
| sortDir | string | 否  | desc       | 排序方向（asc/desc） |

**说明**: 
- 数据集提供者查看分配给自己的申请记录列表

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "datasetTitle": "数据集标题",
        "applicantId": "550e8400-e29b-41d4-a716-446655440004",
        "applicantName": "申请人姓名",
        "projectTitle": "研究项目标题",
        "status": "PENDING_PROVIDER_REVIEW",
        "submittedAt": "2025-12-23T10:00:00Z"
      }
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 1.9 软删除申请记录

**接口地址**: `DELETE /api/applications/{id}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 申请ID |

**说明**: 
- 申请人和平台管理员都可以删除申请记录
- 执行软删除，不会真正从数据库中移除记录

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "applicantId": "550e8400-e29b-41d4-a716-446655440004",
    "status": "DENIED",
    "isDeleted": true
  },
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 1.10 下载申请中上传的审批文件

**接口地址**: `GET /api/applications/{id}/files/{fileId}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 申请ID |
| fileId  | UUID | 是  | 文件ID |

**说明**: 
- 下载申请中上传的审批文件
- 申请人、数据集提供者或管理员可以下载

## 2. 管理申请接口

### 2.1 申请审核员审核申请

**接口地址**: `PUT /api/manage/applications/{id}/approver-review`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_APPROVER

**请求参数**:

| 参数名 | 类型   | 必填 | 描述    |
|-----|------|----|-------|
| id  | UUID | 是  | 申请ID |

**请求体**:
```json
{
  "notes": "审核意见",
  "approved": true
}
```

**说明**: 
- 申请审核员进行机构级别的审核
- approved为true表示批准，false表示拒绝，null表示重置审核状态

**响应示例**:
```json
{
  "success": true,
  "message": "审核完成",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "applicantId": "550e8400-e29b-41d4-a716-446655440004",
    "status": "APPROVED",
    "institutionReviewedAt": "2025-12-23T12:00:00Z",
    "institutionReviewResult": true,
    "approvedAt": "2025-12-23T12:00:00Z"
  },
  "timestamp": "2025-12-23T12:00:00Z"
}
```

### 2.2 根据数据集ID分页获取申请记录列表

**接口地址**: `GET /api/manage/applications/by-dataset-version/{datasetId}/page`

**权限要求**: PLATFORM_ADMIN、INSTITUTION_SUPERVISOR、DATASET_APPROVER、DATASET_UPLOADER

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值        | 描述             |
|---------|--------|----|------------|----------------|
| datasetId | UUID   | 是  | -          | 数据集ID          |
| page    | int    | 否  | 0          | 页码             |
| size    | int    | 否  | 10         | 每页大小           |
| sortBy  | string | 否  | submittedAt | 排序字段           |
| sortDir | string | 否  | desc       | 排序方向（asc/desc） |

**说明**: 
- 根据数据集ID分页获取申请记录列表
- 平台管理员、机构管理员、数据集审核员和数据集上传员可以访问

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "datasetTitle": "数据集标题",
        "applicantId": "550e8400-e29b-41d4-a716-446655440004",
        "applicantName": "申请人姓名",
        "projectTitle": "研究项目标题",
        "status": "APPROVED",
        "submittedAt": "2025-12-23T10:00:00Z"
      }
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-23T10:00:00Z"
}
```

### 2.3 分页查询全部申请记录

**接口地址**: `GET /api/manage/applications`

**权限要求**: 根据用户权限自动应用筛选条件

**请求参数**:

| 参数名     | 类型     | 必填 | 默认值        | 描述             |
|---------|--------|----|------------|----------------|
| institutionId | UUID   | 否  | -          | 机构ID（平台管理员可用） |
| projectTitle | string | 否  | -          | 项目标题           |
| status | string | 否  | -          | 申请状态           |
| page    | int    | 否  | 0          | 页码             |
| size    | int    | 否  | 10         | 每页大小           |
| sortBy  | string | 否  | submittedAt | 排序字段           |
| sortDir | string | 否  | desc       | 排序方向（asc/desc） |

**说明**: 
- 平台管理员可以查询所有申请记录
- 有审核权限的用户能查询所属机构的申请记录
- 只有上传权限的用户可以查询自己上传的申请记录

**响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "datasetId": "550e8400-e29b-41d4-a716-446655440000",
        "datasetTitle": "数据集标题",
        "applicantId": "550e8400-e29b-41d4-a716-446655440004",
        "applicantName": "申请人姓名",
        "projectTitle": "研究项目标题",
        "status": "APPROVED",
        "submittedAt": "2025-12-23T10:00:00Z"
      }
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-23T10:00:00Z"
}
```

## 3. 申请状态说明

| 状态                      | 说明                 |
|---------------------------|--------------------|
| SUBMITTED                 | 已提交，等待数据提供方审核（已弃用） |
| PENDING_PROVIDER_REVIEW   | 待提供方审核             |
| PENDING_INSTITUTION_REVIEW| 待机构审核              |
| APPROVED                  | 已批准                |
| DENIED                    | 已拒绝                |

## 4. 申请角色说明

| 角色                        | 说明                 |
|---------------------------|----------------------|
| TEAM_RESEARCHER           | 团队研究人员          |
| COLLABORATIVE_RESEARCHER  | 协作研究人员          |

## 5. 申请状态流转说明

申请状态按照以下顺序流转：

1. `SUBMITTED` - 用户提交申请后，状态为已提交（已弃用）
2. `PENDING_PROVIDER_REVIEW` - 申请提交后，等待数据集提供者审核
3. `PENDING_INSTITUTION_REVIEW` - 数据集提供者批准后，等待机构审核员审核
4. `APPROVED` - 机构审核员批准后，申请最终通过
5. `DENIED` - 任一审核环节拒绝后，申请被拒绝

数据集提供者审核通过后，申请状态从SUBMITTED变为PENDING_INSTITUTION_REVIEW；
审核员审核通过后，状态变为APPROVED。如果任一环节拒绝，状态变为DENIED。