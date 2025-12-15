# 文件管理接口

文件管理接口提供了文件上传和分片上传相关的功能，路径为：`/api/files`

## 1. 文件上传接口

### 1.1 上传文件

**接口地址**: `POST /api/files/upload`

**权限要求**: 需要认证

**请求参数**:

| 参数名  | 类型            | 必填 | 描述    |
|------|---------------|----|-------|
| file | MultipartFile | 是  | 上传的文件 |

**说明**: 
- 用户上传单个文件

**响应示例**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "example.pdf",
  "fileSize": 102400,
  "fileType": "application/pdf",
  "uploaderId": "550e8400-e29b-41d4-a716-446655440001"
}
```

## 2. 分片上传接口

### 2.1 初始化分片上传

**接口地址**: `POST /api/files/chunked-upload/init`

**权限要求**: 需要认证

**请求体**:
```json
{
  "fileName": "large_file.zip",
  "fileSize": 104857600,
  "totalChunks": 100
}
```

**说明**: 
- 初始化一个分片上传任务

**响应示例**:
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440002",
  "fileName": "large_file.zip",
  "fileSize": 104857600,
  "totalChunks": 100
}
```

### 2.2 上传文件分片

**接口地址**: `POST /api/files/chunked-upload/chunk`

**权限要求**: 需要认证

**请求参数**:

| 参数名         | 类型            | 必填 | 描述      |
|-------------|---------------|----|---------|
| file        | MultipartFile | 是  | 上传的文件分片 |
| uploadId    | UUID          | 是  | 上传ID    |
| chunkNumber | Integer       | 是  | 分片编号    |
| totalChunks | Integer       | 是  | 总分片数    |
| fileName    | String        | 是  | 原始文件名   |

**说明**: 
- 上传一个文件分片

**响应示例**:
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440002",
  "chunkNumber": 1,
  "success": true,
  "message": "分片上传成功"
}
```

### 2.3 查询分片上传状态

**接口地址**: `GET /api/files/chunked-upload/status`

**权限要求**: 需要认证

**请求参数**:

| 参数名      | 类型   | 必填 | 描述   |
|----------|------|----|------|
| uploadId | UUID | 是  | 上传ID |

**说明**: 
- 查询分片上传的状态

**响应示例**:
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440002",
  "fileName": "large_file.zip",
  "fileSize": 104857600,
  "totalChunks": 100,
  "uploadedChunks": [1, 2, 3, 5],
  "missingChunks": [4, 6, 7, 8]
}
```

### 2.4 合并分片

**接口地址**: `POST /api/files/chunked-upload/merge`

**权限要求**: 需要认证

**请求参数**:

| 参数名      | 类型   | 必填 | 描述   |
|----------|------|----|------|
| uploadId | UUID | 是  | 上传ID |

**说明**: 
- 当所有分片上传完成后，调用此接口合并分片为完整文件

**响应示例**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "fileName": "large_file.zip",
  "fileSize": 104857600,
  "fileType": "application/zip",
  "uploaderId": "550e8400-e29b-41d4-a716-446655440001"
}
```