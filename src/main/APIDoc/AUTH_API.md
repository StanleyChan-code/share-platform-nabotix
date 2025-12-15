# 用户认证接口

所有用户认证接口都在 `/api/auth` 路径下。

## 1. 发送验证码

**接口地址**: `POST /api/auth/send-verification-code`

**请求参数**:

| 参数名          | 类型     | 必填 | 描述             |
|--------------|--------|----|----------------|
| phone        | String | 是  | 手机号码           |
| businessType | String | 否  | 业务类型，默认为 LOGIN |

**businessType 可选值**:
- LOGIN: 登录
- REGISTER: 注册

**响应示例**:
```json
{
  "success": true,
  "message": "验证码已发送",
  "data": "验证码已发送",
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 2. 用户登录

**接口地址**: `POST /api/auth/login`

支持两种登录方式：
1. 手机号 + 密码登录
2. 手机号 + 验证码登录

**请求体（密码登录）**:
```json
{
  "phone": "13800138000",
  "password": "password123",
  "loginType": "PASSWORD"
}
```

**请求体（验证码登录）**:
```json
{
  "phone": "13800138000",
  "verificationCode": "123456",
  "loginType": "VERIFICATION_CODE"
}
```

**请求参数**:

| 参数名              | 类型     | 必填 | 描述                                |
|------------------|--------|----|-----------------------------------|
| phone            | String | 是  | 手机号                               |
| password         | String | 否  | 密码（密码登录时必填）                       |
| verificationCode | String | 否  | 验证码（验证码登录时必填）                     |
| loginType        | String | 是  | 登录类型：PASSWORD 或 VERIFICATION_CODE |

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.xxxx",
    "phone": "13800138000",
    "authorities": ["registered_researcher"]
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 3. 用户注册

**接口地址**: `POST /api/auth/register`

**请求体**:
```json
{
  "phone": "13800138000",
  "verificationCode": "123456",
  "username": "testUser",
  "realName": "测试用户",
  "email": "test@example.com",
  "password": "password123"
}
```

**请求参数**:

| 参数名              | 类型     | 必填 | 描述   |
|------------------|--------|----|------|
| phone            | String | 是  | 手机号码 |
| verificationCode | String | 是  | 验证码  |
| username         | String | 是  | 用户名  |
| realName         | String | 是  | 真实姓名 |
| email            | String | 否  | 邮箱地址 |
| password         | String | 是  | 密码   |

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testUser",
    "realName": "测试用户",
    "phone": "13800138000",
    "email": "test@example.com",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

## 4. 用户登出

**接口地址**: `POST /api/auth/logout`

**权限要求**: 需要认证（携带有效的JWT Token）

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功",
  "data": "登出成功",
  "timestamp": "2025-12-01T10:00:00Z"
}
```