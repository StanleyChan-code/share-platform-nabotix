# 用户管理接口

所有用户管理接口都在 `/api/users` 和 `/api/manage/users` 路径下。

## 1. 获取当前用户信息

**接口地址**: `GET /api/users/profile`

**权限要求**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "realName": "测试用户",
    "phone": "13800138000",
    "email": "test@example.com"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 2. 根据ID获取当前用户信息

**接口地址**: `GET /api/users/{userId}`

**权限要求**: 任意已认证用户

**路径参数**:
- `userId`: 用户ID (UUID)

**说明**: 
- 只能获取自己的信息

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "realName": "测试用户",
    "phone": "13800138000",
    "email": "test@example.com",
    "institutionId": "550e8400-e29b-41d4-a716-446655440001"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 3. 获取当前用户权限列表

**接口地址**: `GET /api/users/authorities`

**权限要求**: 任意已认证用户

**响应示例**:
```json
{
  "success": true,
  "message": "获取当前用户权限列表成功",
  "data": [
    "registered_researcher"
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 4. 管理员创建用户

**接口地址**: `POST /api/manage/users`

**权限要求**: PLATFORM_ADMIN 或 INSTITUTION_SUPERVISOR 或 INSTITUTION_USER_MANAGER

**请求体**:
```json
{
  "username": "newuser",
  "realName": "新用户",
  "phone": "13900139000",
  "email": "newuser@example.com",
  "password": "password123",
  "institutionId": "550e8400-e29b-41d4-a716-446655440001",
  "idType": "NATIONAL_ID",
  "idNumber": "110101199003072918",
  "education": "PHD",
  "title": "研究员",
  "field": "生物医学"
}
```

**说明**: 
- 平台管理员可以指定任意机构ID，机构管理员和机构用户管理员只能创建本机构用户
- 非平台管理员不能添加平台管理员权限

**响应示例**:
```json
{
  "success": true,
  "message": "用户创建成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "username": "newuser",
    "realName": "新用户",
    "phone": "13900139000",
    "email": "newuser@example.com",
    "institutionId": "550e8400-e29b-41d4-a716-446655440001",
    "education": "PHD",
    "title": "研究员",
    "field": "生物医学",
    "idType": "NATIONAL_ID",
    "idNumber": "110101199003072918",
    "supervisorId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z",
    "authorities": []
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 5. 管理员根据用户ID获取用户信息

**接口地址**: `GET /api/manage/users/{userId}`

**权限要求**: PLATFORM_ADMIN 或 INSTITUTION_SUPERVISOR 或 INSTITUTION_USER_MANAGER

**路径参数**:
- `userId`: 用户ID (UUID)

**说明**: 
- 平台管理员可以获取任意用户信息
- 机构管理员只能获取本机构用户信息

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "realName": "测试用户",
    "phone": "13800138000",
    "email": "test@example.com",
    "institutionId": "550e8400-e29b-41d4-a716-446655440001",
    "education": "PHD",
    "title": "研究员",
    "field": "生物医学",
    "idType": "NATIONAL_ID",
    "idNumber": "110101199003072918",
    "supervisorId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z",
    "authorities": [
      "DATASET_UPLOADER"
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 6. 根据手机号精确搜索用户

**接口地址**: `GET /api/manage/users/phone/{phone}`

**权限要求**: PLATFORM_ADMIN 或 INSTITUTION_SUPERVISOR 或 INSTITUTION_USER_MANAGER

**路径参数**:
- `phone`: 用户手机号

**说明**: 
- 平台管理员可以获取任意用户信息
- 机构管理员只能获取本机构用户信息

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "realName": "测试用户",
    "phone": "13800138000",
    "email": "test@example.com",
    "institutionId": "550e8400-e29b-41d4-a716-446655440001",
    "education": "PHD",
    "title": "研究员",
    "field": "生物医学",
    "idType": "NATIONAL_ID",
    "idNumber": "110101199003072918",
    "supervisorId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z",
    "authorities": [
      "DATASET_UPLOADER"
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 7. 更新用户手机号

**接口地址**: `PUT /api/manage/users/{userId}/phone`

**权限要求**: PLATFORM_ADMIN 或 INSTITUTION_SUPERVISOR 或 INSTITUTION_USER_MANAGER

**路径参数**:
- `userId`: 用户ID (UUID)

**说明**: 
- 平台管理员可以更新任意用户手机号
- 机构管理员只能更新本机构用户手机号

**请求体**:
```json
{
  "newPhone": "13900139001"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "手机号更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "realName": "测试用户",
    "phone": "13900139001",
    "email": "test@example.com",
    "institutionId": "550e8400-e29b-41d4-a716-446655440001",
    "education": "PHD",
    "title": "研究员",
    "field": "生物医学",
    "idType": "NATIONAL_ID",
    "idNumber": "110101199003072918",
    "supervisorId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z",
    "authorities": [
      "DATASET_UPLOADER"
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 8. 更新当前用户信息

**接口地址**: `PUT /api/users/profile`

**权限要求**: 任意已认证用户

**请求体**:
```json
{
  "username": "updatedUsername",
  "email": "updated@example.com",
  "education": "博士",
  "field": "计算机科学",
  "title": "高级工程师"
}
```

**说明**: 
- 用户只能更新自己的部分基础信息
- 管理员专用字段（如真实姓名、证件类型、证件号码）无法通过此接口更新

**响应示例**:
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "updatedUsername",
    "realName": "测试用户",
    "phone": "13900139001",
    "email": "updated@example.com",
    "institutionId": "550e8400-e29b-41d4-a716-446655440001",
    "education": "博士",
    "field": "计算机科学",
    "title": "高级工程师",
    "idType": "NATIONAL_ID",
    "idNumber": "110101199003072918",
    "supervisorId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z",
    "authorities": [
      "DATASET_UPLOADER"
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 9. 更新用户密码

**接口地址**: `PUT /api/users/password`

**权限要求**: 任意用户，但需要提供有效手机号和验证码

**请求体**:
```json
{
  "phone": "13800138000",
  "verificationCode": "123456",
  "newPassword": "newPassword123"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "密码修改成功",
  "data": "密码修改成功",
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 10. 管理员更新用户信息

**接口地址**: `PUT /api/manage/users/{userId}/admin-profile`

**权限要求**: PLATFORM_ADMIN 或 INSTITUTION_SUPERVISOR 或 INSTITUTION_USER_MANAGER

**路径参数**:
- `userId`: 用户ID (UUID)

**说明**: 
- 平台管理员可以更新任意用户的所有信息
- 机构管理员只能更新本机构用户的所有信息
- 此接口接收完整的用户信息进行更新

**请求体**:
```json
{
  "username": "updatedUsername",
  "realName": "更新的真实姓名",
  "idType": "NATIONAL_ID",
  "idNumber": "110101199003072918",
  "education": "PHD",
  "title": "高级工程师",
  "field": "计算机科学",
  "email": "updated@example.com"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "updatedUsername",
    "realName": "更新的真实姓名",
    "phone": "13900139001",
    "email": "updated@example.com",
    "institutionId": "550e8400-e29b-41d4-a716-446655440001",
    "education": "PHD",
    "field": "计算机科学",
    "title": "高级工程师",
    "idType": "NATIONAL_ID",
    "idNumber": "110101199003072918",
    "supervisorId": "550e8400-e29b-41d4-a716-446655440003",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z",
    "authorities": [
      "DATASET_UPLOADER"
    ]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 11. 更新用户权限

**接口地址**: `PUT /api/manage/authorities`

**权限要求**: 平台管理员或机构管理员

**说明**: 
- 平台管理员可以为任意用户分配任意权限
- 机构管理员只能为本机构用户分配除平台管理员外的权限
- 不能移除平台管理员的平台管理员权限

**请求体**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "authorities": ["institution_supervisor", "dataset_uploader"]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "权限更新成功",
  "data": "权限更新成功",
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 12. 获取系统权限列表

**接口地址**: `GET /api/manage/authorities`

**权限要求**: 平台管理员或机构管理员

**说明**: 
- 平台管理员可以看到所有权限
- 机构管理员看不到平台管理员权限

**响应示例**:
```json
{
  "success": true,
  "message": "获取权限列表成功",
  "data": [
    "institution_supervisor",
    "dataset_uploader",
    "registered_researcher"
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 13. 获取指定用户权限列表

**接口地址**: `GET /api/manage/authorities/{userId}`

**权限要求**: PLATFORM_ADMIN 或 INSTITUTION_SUPERVISOR 或 INSTITUTION_USER_MANAGER

**路径参数**:
- `userId`: 用户ID (UUID)

**说明**: 
- 平台管理员可以获取任意用户权限列表
- 机构管理员只能获取本机构用户权限列表

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户权限列表成功",
  "data": [
    "institution_supervisor"
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 14. 分页获取机构用户列表

**接口地址**: `GET /api/manage/users`

**权限要求**: PLATFORM_ADMIN 或 INSTITUTION_SUPERVISOR 或 INSTITUTION_USER_MANAGER

**请求参数**:
- `institutionId`: 机构ID (UUID)，平台管理员必填
- `page`: 页码，默认为0
- `size`: 每页大小，默认为10

**说明**: 
- 平台管理员可查看所有机构的用户，但必须提供机构ID参数
- 机构管理员和机构用户管理员可查看本机构用户，不需要提供机构ID参数
- 如果机构管理员提供了非本机构的机构ID，则返回权限错误

**请求示例**:
```
GET /api/manage/users?institutionId=550e8400-e29b-41d4-a716-446655440001&page=0&size=10
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户列表成功",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "testuser1",
        "realName": "测试用户1",
        "phone": "13800138001",
        "email": "test1@example.com",
        "institutionId": "550e8400-e29b-41d4-a716-446655440001",
        "education": "PHD",
        "title": "研究员",
        "field": "生物医学",
        "idType": "NATIONAL_ID",
        "idNumber": "110101199003072918",
        "supervisorId": "550e8400-e29b-41d4-a716-446655440003",
        "createdAt": "2025-12-01T10:00:00Z",
        "updatedAt": "2025-12-01T10:00:00Z",
        "authorities": [
          "DATASET_UPLOADER"
        ]
      }
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```


**权限要求**: 平台管理员或机构管理员

**路径参数**:
- `userId`: 用户ID (UUID)

**说明**: 
- 平台管理员可以获取任意用户权限列表
- 机构管理员只能获取本机构用户权限列表

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户权限列表成功",
  "data": [
    "institution_supervisor"
  ],
  "timestamp": "2025-12-01T10:00:00Z"
}
```