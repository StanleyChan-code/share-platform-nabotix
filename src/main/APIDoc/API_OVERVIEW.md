# Share Platform API 文档

## 1. 概述

本文档详细描述了Share Platform平台提供的RESTful API接口，包括用户认证、用户管理、数据集管理、机构管理、研究学科管理、研究成果管理、数据集申请、文件管理等模块。

## 2. 公共响应格式

所有API接口均使用统一的响应格式：

```json
{
  "success": true,
  "message": "响应消息",
  "data": {},
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 3. 错误处理

当发生错误时，API会返回相应的HTTP状态码和错误信息：
- 400: 请求参数错误
- 401: 未认证
- 403: 权限不足
- 404: 资源未找到
- 500: 服务器内部错误

错误响应示例:
```json
{
  "success": false,
  "message": "验证码无效或已过期",
  "data": null,
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 4. 注意事项

1. 所有时间字段均采用ISO 8601格式（UTC时间）
2. 所有ID字段均为UUID格式
3. 验证码具有时效性，过期后无法使用
4. 登录成功后，客户端需在后续请求的Authorization头部中携带JWT Token：`Bearer <token>`

## 5. API模块列表

以下是各模块API的详细说明：

### 5.1 用户认证接口
- [用户认证接口](AUTH_API.md)

### 5.2 用户管理接口
- [用户管理接口](USER_MANAGE_API.md)

### 5.3 机构管理接口
- [机构管理接口](INSTITUTION_API.md)

### 5.4 数据集管理接口
- [数据集管理接口](DATASET_API.md)

### 5.5 研究成果管理接口
- [研究成果管理接口](RESEARCH_OUTPUT_API.md)

### 5.6 研究学科管理接口
- [研究学科管理接口](RESEARCH_SUBJECT_API.md)

### 5.7 数据集申请接口
- [数据集申请接口](APPLICATION_API.md)

### 5.8 文件管理接口
- [文件管理接口](FILE_MANAGEMENT_API.md)

### 5.9 数据集统计接口
- [数据集统计接口](DATASET_STATISTIC_API.md)

### 5.10 热度统计接口
- [热度统计接口](POPULARITY_API.md)

## 6. 枚举类型和权限说明

- [枚举类型和权限说明](ENUMS_AND_PERMISSIONS.md)