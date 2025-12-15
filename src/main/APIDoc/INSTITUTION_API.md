# 机构管理接口

机构管理分为两类接口：
- 公共接口（无需认证）：`/api/institutions`
- 管理接口（需认证）：`/api/manage/institutions`

## 1. 公共机构接口

### 1.1 获取所有机构列表（公共接口）

**接口地址**: `GET /api/institutions`

**权限要求**: 无需认证，所有用户均可访问

**说明**: 此接口只返回已验证通过的机构

**响应示例**:
```json
{
  "success": true,
  "message": "获取机构列表成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "某某医院",
      "shortName": "某医",
      "type": "hospital",
      "contactPerson": "张三",
      "contactIdType": "NATIONAL_ID",
      "contactIdNumber": "11010119900307XXXX",
      "contactPhone": "13800138000",
      "contactEmail": "contact@example.com",
      "verified": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 1.2 根据ID获取特定机构（公共接口）

**接口地址**: `GET /api/institutions/{id}`

**权限要求**: 无需认证，所有用户均可访问

**说明**: 此接口只能获取已验证通过的机构

**响应示例**:
```json
{
  "success": true,
  "message": "获取机构成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "某某医院",
    "shortName": "某医",
    "type": "hospital",
    "contactPerson": "张三",
    "contactIdType": "NATIONAL_ID",
    "contactIdNumber": "11010119900307XXXX",
    "contactPhone": "13800138000",
    "contactEmail": "contact@example.com",
    "verified": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 2. 管理机构接口

### 2.1 获取所有机构列表（管理接口）

**接口地址**: `GET /api/manage/institutions`

**权限要求**: 仅平台管理员可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取机构列表成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "某某医院",
      "shortName": "某医",
      "type": "hospital",
      "contactPerson": "张三",
      "contactIdType": "NATIONAL_ID",
      "contactIdNumber": "11010119900307XXXX",
      "contactPhone": "13800138000",
      "contactEmail": "contact@example.com",
      "verified": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.2 根据ID获取特定机构（管理接口）

**接口地址**: `GET /api/manage/institutions/{id}`

**权限要求**: 仅平台管理员可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取机构成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "某某医院",
    "shortName": "某医",
    "type": "hospital",
    "contactPerson": "张三",
    "contactIdType": "NATIONAL_ID",
    "contactIdNumber": "11010119900307XXXX",
    "contactPhone": "13800138000",
    "contactEmail": "contact@example.com",
    "verified": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.3 创建新机构

**接口地址**: `POST /api/manage/institutions`

**权限要求**: 仅平台管理员可访问

**请求体**:
```json
{
  "fullName": "某某研究中心",
  "shortName": "某研",
  "type": "research_center",
  "contactPerson": "李四",
  "contactIdType": "NATIONAL_ID",
  "contactIdNumber": "11010119900307XXXX",
  "contactPhone": "13900139000",
  "contactEmail": "contact@example.org"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "创建机构成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "fullName": "某某研究中心",
    "shortName": "某研",
    "type": "research_center",
    "contactPerson": "李四",
    "contactIdType": "NATIONAL_ID",
    "contactIdNumber": "11010119900307XXXX",
    "contactPhone": "13900139000",
    "contactEmail": "contact@example.org",
    "verified": false,
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.4 更新机构信息

**接口地址**: `PUT /api/manage/institutions/{id}`

**权限要求**: 平台管理员可更新任意机构，机构管理员只能更新自己所属的机构

**请求体**:
```json
{
  "fullName": "某某研究中心（更新后）",
  "shortName": "某研中",
  "type": "research_center",
  "contactPerson": "王五",
  "contactIdType": "NATIONAL_ID",
  "contactIdNumber": "11010119900307XXXX",
  "contactPhone": "13700137000",
  "contactEmail": "contact_updated@example.org"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "更新机构成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "fullName": "某某研究中心（更新后）",
    "shortName": "某研中",
    "type": "research_center",
    "contactPerson": "王五",
    "contactIdType": "NATIONAL_ID",
    "contactIdNumber": "11010119900307XXXX",
    "contactPhone": "13700137000",
    "contactEmail": "contact_updated@example.org",
    "verified": false,
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T11:00:00Z"
  },
  "timestamp": "2025-12-01T11:00:00Z"
}
```

### 2.5 删除机构

**接口地址**: `DELETE /api/manage/institutions/{id}`

**权限要求**: 仅平台管理员可访问

**响应示例**:
```json
{
  "success": true,
  "message": "删除机构成功",
  "data": null,
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.6 获取当前机构管理员所属机构信息

**接口地址**: `GET /api/manage/institutions/own`

**权限要求**: 仅机构管理员可访问

**响应示例**:
```json
{
  "success": true,
  "message": "获取机构信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "某某医院",
    "shortName": "某医",
    "type": "hospital",
    "contactPerson": "张三",
    "contactIdType": "NATIONAL_ID",
    "contactIdNumber": "11010119900307XXXX",
    "contactPhone": "13800138000",
    "contactEmail": "contact@example.com",
    "verified": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### 2.7 更新当前机构管理员所属机构信息

**接口地址**: `PUT /api/manage/institutions/own`

**权限要求**: 仅机构管理员可访问

**请求体**:
```json
{
  "fullName": "某某医院（更新后）",
  "shortName": "某医新",
  "type": "hospital",
  "contactPerson": "赵六",
  "contactIdType": "NATIONAL_ID",
  "contactIdNumber": "11010119900307XXXX",
  "contactPhone": "13600136000",
  "contactEmail": "contact_new@example.com"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "更新机构信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "某某医院（更新后）",
    "shortName": "某医新",
    "type": "hospital",
    "contactPerson": "赵六",
    "contactIdType": "NATIONAL_ID",
    "contactIdNumber": "11010119900307XXXX",
    "contactPhone": "13600136000",
    "contactEmail": "contact_new@example.com",
    "verified": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-12-01T11:00:00Z"
  },
  "timestamp": "2025-12-01T11:00:00Z"
}
```

### 2.8 验证通过机构

**接口地址**: `POST /api/manage/institutions/{id}/verify`

**权限要求**: 平台管理员可验证任意机构，机构管理员只能验证自己所属的机构

**响应示例**:
```json
{
  "success": true,
  "message": "机构验证通过成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "某某医院",
    "shortName": "某医",
    "type": "hospital",
    "contactPerson": "张三",
    "contactIdType": "NATIONAL_ID",
    "contactIdNumber": "11010119900307XXXX",
    "contactPhone": "13800138000",
    "contactEmail": "contact@example.com",
    "verified": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-12-01T11:00:00Z"
  },
  "timestamp": "2025-12-01T11:00:00Z"
}
```