# 数据集统计接口

数据集统计信息管理接口，用于管理数据集的各种统计数据。

## 1. 数据集统计信息接口

### 1.1 创建或更新数据集统计信息

**接口地址**: `POST /api/datasets/statistics/dataset-statistics`

**权限要求**: 需要认证

**请求体**:
```json
{
  "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
  "version": "1.0",
  "variables": [
    {
      "type": "categorical",
      "variables": ["性别", "具体情况"],
      "fileIndex": 0
    }
  ],
  "statisticalFiles": [
    "姓名,性别,年龄\n张三,男,25\n李四,女,30"
  ],
  "createdAt": "2025-12-01T10:00:00Z"
}
```

**说明**: 
- 用于创建或更新特定数据集版本的统计信息
- statisticalFiles中的字符串数据会被压缩后存储

**响应示例**:
```json
{
  "success": true,
  "message": "数据集统计信息保存成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0",
    "variables": [
      {
        "type": "categorical",
        "variables": ["性别", "具体情况"],
        "fileIndex": 0
      }
    ],
    "statisticalFiles": [],
    "createdAt": "2025-12-01T10:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.2 根据ID获取数据集统计信息

**接口地址**: `GET /api/datasets/statistics/dataset-statistics/{id}`

**权限要求**: 需要认证

**请求参数**:

| 参数名 | 类型   | 必填 | 描述        |
|-----|------|----|-----------|
| id  | UUID | 是  | 数据集统计信息ID |

**说明**: 
- 根据唯一标识符获取特定的数据集统计信息

**响应示例**:
```json
{
  "success": true,
  "message": "获取数据集统计信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0",
    "variables": [
      {
        "type": "categorical",
        "variables": ["性别", "具体情况"],
        "fileIndex": 0
      }
    ],
    "statisticalFiles": [],
    "createdAt": "2025-12-01T10:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.3 根据数据集版本ID获取数据集统计信息

**接口地址**: `GET /api/datasets/statistics/dataset-statistics/by-dataset-version/{datasetVersionId}`

**权限要求**: 需要认证

**请求参数**:

| 参数名              | 类型   | 必填 | 描述      |
|------------------|------|----|---------|
| datasetVersionId | UUID | 是  | 数据集版本ID |

**说明**: 
- 根据数据集版本ID获取对应的统计信息

**响应示例**:
```json
{
  "success": true,
  "message": "获取数据集版本统计信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "datasetVersionId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0",
    "variables": [
      {
        "type": "categorical",
        "variables": ["性别", "具体情况"],
        "fileIndex": 0
      }
    ],
    "statisticalFiles": [],
    "createdAt": "2025-12-01T10:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.4 调用数据分析服务进行数据处理

**接口地址**: `POST /api/datasets/statistics/dataset-statistics/analyze`

**权限要求**: 需要认证

**请求体**:
```json
{
  "dataFileId": "550e8400-e29b-41d4-a716-446655440002",
  "dictionaryFileId": "550e8400-e29b-41d4-a716-446655440003"
}
```

**说明**: 
- 调用后端数据分析服务处理指定的数据文件和数据字典文件
- 后端会获取文件的绝对路径并发送给本地数据分析服务

**响应示例**:
```json
{
  "success": true,
  "message": "数据分析成功",
  "data": {
    "variables": [
      {
        "type": "categorical",
        "variables": ["性别", "具体情况"],
        "fileIndex": 0
      }
    ],
    "version": "1.0",
    "statisticalFiles": [
      "姓名,性别,年龄\n张三,男,25\n李四,女,30"
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 2. 数据分析服务接口

数据分析服务运行在本地服务器上，地址为 `http://localhost:10021`。

### 2.1 数据分析接口

**接口地址**: `POST http://localhost:10021/analyze`

**权限要求**: 仅允许本地访问

**请求体**:
```json
{
  "dataFile": "/home/user/.clinical-research-data-sharing-platform/tmp/550e8400-e29b-41d4-a716-446655440002.csv",
  "dictionaryFile": "/home/user/.clinical-research-data-sharing-platform/tmp/550e8400-e29b-41d4-a716-446655440003.dict"
}
```

**说明**: 
- dataFile: 数据文件的绝对路径
- dictionaryFile: 数据字典文件的绝对路径

**响应示例**:
```json
{
  "variables": [
    {
      "type": "categorical",
      "variables": ["性别", "具体情况"],
      "fileIndex": 0
    },
    {
      "type": "numeric",
      "variables": ["年龄", "收入"],
      "fileIndex": 1
    }
  ],
  "version": "1.0",
  "statisticalFiles": [
    "姓名,性别,年龄\n张三,男,25\n李四,女,30",
    "统计项,平均值,中位数\n年龄,27.5,27.5\n收入,8000,7500"
  ]
}
```