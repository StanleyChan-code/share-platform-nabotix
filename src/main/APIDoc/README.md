# Share Platform

临床研究数据共享平台是一个专门用于医疗和科研机构之间安全共享临床研究数据的平台。该平台提供了完整的数据管理、权限控制、申请审批等功能，确保数据在合规的前提下得到充分利用。

## 功能特性

- **多级权限控制**: 支持平台管理员、机构管理员、数据提供者、注册研究员等多种角色
- **数据集管理**: 完整的数据集生命周期管理，包括创建、审核、发布、更新等
- **机构管理**: 支持医疗机构、科研院所等各类机构的注册和管理
- **研究学科分类**: 支持多种医学研究领域的分类管理
- **安全认证**: 基于JWT的安全认证机制，支持手机号+密码和手机号+验证码双重登录方式
- **申请审批流程**: 完善的数据访问申请和审批流程

## 文档

- [API接口文档总览](API_OVERVIEW.md) - API总览和通用信息
- [用户认证接口](AUTH_API.md) - 用户注册、登录等相关接口
- [用户管理接口](USER_MANAGE_API.md) - 用户信息查询和管理接口
- [数据集管理接口](DATASET_API.md) - 数据集的查询、创建和管理接口
- [数据集统计接口](DATASET_STATISTIC_API.md) - 数据集统计信息管理接口
- [机构管理接口](INSTITUTION_API.md) - 机构信息的查询和管理接口
- [研究学科接口](RESEARCH_SUBJECT_API.md) - 研究学科的查询和管理接口
- [热度统计接口](POPULARITY_API.md) - 数据集和研究学科的热度统计接口
- [研究成果接口](RESEARCH_OUTPUT_API.md) - 研究成果的提交、查询和管理接口
- [数据集申请接口](APPLICATION_API.md) - 数据集申请和审批相关接口
- [枚举类型和权限说明](ENUMS_AND_PERMISSIONS.md) - 系统使用的枚举类型和权限角色说明

## 技术栈

- Spring Boot 3.x
- PostgreSQL 数据库
- Redis 缓存
- JWT 认证
- Maven 构建工具

## 快速开始

### 环境要求

- JDK 17+
- PostgreSQL 13+
- Redis 6+

### 构建和运行

```bash
# 克隆项目
git clone <repository-url>

# 进入项目目录
cd share-platform

# 构建项目
./mvnw clean package

# 运行应用
./mvnw spring-boot:run
```

### 配置

部署Redis时必须设定每天持久化到本地，以保证热度数据不丢失。

修改 `src/main/resources/application.properties` 文件来配置数据库连接、JWT密钥等参数。