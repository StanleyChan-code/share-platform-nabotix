# Docker 部署与集成指南

本文档详细说明了如何将 share-platform-nabotix 项目打包为 Docker 镜像、推送到镜像仓库，并将其集成到更大的 Docker Compose 环境中与其他服务协同工作。

> 注：当前环境已成功构建并推送镜像到本地仓库，镜像名为 `share-platform-nabotix-web:latest`，大小为 17.4MB。

## 目录

1. [项目概述](#项目概述)
2. [构建 Docker 镜像](#构建-docker-镜像)
3. [推送镜像到仓库](#推送镜像到仓库)
4. [集成到多服务环境](#集成到多服务环境)
5. [环境变量配置](#环境变量配置)
6. [健康检查](#健康检查)
7. [故障排除](#故障排除)

## 项目概述

share-platform-nabotix 是一个基于 React、Vite 和 TypeScript 的前端应用程序，使用 nginx 作为生产环境的 Web 服务器。该项目被打包为 Docker 镜像并通过 Docker Compose 进行部署。

主要技术栈：
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui 组件库

## 构建 Docker 镜像

### 1. 构建生产版本

在构建 Docker 镜像之前，首先需要构建前端项目的生产版本：

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

这将在项目根目录下生成 `dist/` 文件夹，其中包含所有编译后的静态资源。

### 2. 构建 Docker 镜像

使用提供的 Dockerfile 构建镜像：

```bash
# 构建镜像
docker build -t share-platform-nabotix-web:latest .

# 或者指定版本号构建
docker build -t share-platform-nabotix-web:1.0.0 .
```

> 注：当前环境已完成此步骤，成功构建了名为 `share-platform-nabotix-web:latest` 的镜像，大小为 17.4MB。

### Dockerfile 详解

```dockerfile
# 使用官方 nginx 镜像作为基础镜像
FROM nginx:alpine-slim

# 设置工作目录
WORKDIR /app

# 删除默认的 nginx 靻态页面
RUN rm -rf /usr/share/nginx/html/*

# 复制构建好的文件到 nginx
COPY ./dist/ /usr/share/nginx/html/

# 复制 nginx 配置
COPY ./nginx.conf /etc/nginx/nginx.conf

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
```

## 推送镜像到仓库

当前环境已成功构建镜像并存储于本地仓库。如需推送到远程仓库，请按以下步骤操作：

### 推送到 Docker Hub

```bash
# 登录到 Docker Hub
docker login

# 重新标记镜像
docker tag share-platform-nabotix-web:latest yourusername/share-platform-nabotix-web:latest
docker tag share-platform-nabotix-web:1.0.0 yourusername/share-platform-nabotix-web:1.0.0

# 推送镜像
docker push yourusername/share-platform-nabotix-web:latest
docker push yourusername/share-platform-nabotix-web:1.0.0
```

### 推送到私有仓库

```bash
# 登录到私有仓库
docker login your-private-registry.com

# 重新标记镜像
docker tag share-platform-nabotix-web:latest your-private-registry.com/share-platform-nabotix-web:latest

# 推送镜像
docker push your-private-registry.com/share-platform-nabotix-web:latest
```

## 集成到多服务环境

### Docker Compose 配置

当前项目已经包含了基本的 docker-compose.yml 文件。要将此服务集成到更大的环境中，请参考以下示例：

```yaml
version: '3.8'

services:
  # share-platform-nabotix 前端服务
  share-platform-nabotix-web:
    image: yourusername/share-platform-nabotix-web:latest
    container_name: share-platform-nabotix-web
    ports:
      - "10025:80"
    restart: unless-stopped
    environment:
      - NGINX_HOST=0.0.0.0
      - NGINX_PORT=80
    labels:
      - "project=share-platform"
      - "component=nabotix-web"
    networks:
      - share-platform-network

  # 示例：反向代理（如 Nginx）
  reverse-proxy:
    image: nginx:alpine
    container_name: reverse-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./certs:/etc/nginx/certs
    depends_on:
      - share-platform-nabotix-web
    networks:
      - share-platform-network

networks:
  share-platform-network:
    driver: bridge
```

### 与后端服务集成

前端应用需要与后端服务通信，可通过环境变量配置后端服务地址：

```yaml
version: '3.8'

services:
  share-platform-nabotix-web:
    image: yourusername/share-platform-nabotix-web:latest
    container_name: share-platform-nabotix-web
    ports:
      - "10025:80"
    restart: unless-stopped
    environment:
      - NGINX_HOST=0.0.0.0
      - NGINX_PORT=80
      # 如果需要运行时配置后端 API 地址
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
    labels:
      - "project=share-platform"
      - "component=nabotix-web"
    networks:
      - share-platform-network

networks:
  share-platform-network:
    driver: bridge
```

## 环境变量配置

前端应用可能需要以下环境变量：

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| VITE_API_BASE_URL | 后端 API 基础 URL | https://api.your-backend.com |

注意：这些变量应在构建时设置，因为这是一个静态前端应用。如果后端服务地址在不同环境中不同，可以使用环境变量进行配置。

## 健康检查

应用提供了内置的健康检查端点：

- `/health` - 返回简单的健康状态信息
- `/version` - 返回应用版本信息

可以通过以下方式测试：

```bash
# 测试健康检查
curl http://localhost:10025/health

# 获取版本信息
curl http://localhost:10025/version
```

Docker 镜像也配置了 HEALTHCHECK 指令，会自动定期检查服务健康状态。

## 故障排除

### 常见问题

1. **构建失败**
   - 确保所有依赖项都已正确安装
   - 检查 Node.js 版本是否兼容（建议使用 LTS 版本）

2. **容器无法启动**
   - 检查端口是否被占用
   - 查看容器日志：`docker logs share-platform-nabotix-web`

3. **应用无法连接到后端**
   - 检查网络配置
   - 确认环境变量设置正确
   - 验证后端服务是否正常运行

### 查看日志

```bash
# 查看容器日志
docker logs share-platform-nabotix-web

# 实时查看日志
docker logs -f share-platform-nabotix-web
```

### 管理脚本

项目中包含 PowerShell 管理脚本，可用于日常操作：

```bash
# 部署应用
.\deploy.ps1

# 管理应用
.\manage.ps1 status  # 查看状态
.\manage.ps1 logs    # 查看日志
.\manage.ps1 restart # 重启服务
.\manage.ps1 stop    # 停止服务
```

## 更新与维护

### 更新应用

1. 拉取最新代码
2. 重新构建镜像：
   ```bash
   docker build -t share-platform-nabotix-web:latest .
   ```
3. 停止并移除旧容器：
   ```bash
   docker-compose down
   ```
4. 启动新容器：
   ```bash
   docker-compose up -d
   ```

### 版本管理

建议使用语义化版本控制：
- 主版本号：重大更新
- 次版本号：功能更新
- 补丁版本号：bug修复

例如：
```bash
docker build -t share-platform-nabotix-web:2.1.0 .
```

## 结论

通过以上步骤，您可以成功将 share-platform-nabotix 项目打包为 Docker 镜像，并将其集成到更复杂的多服务架构中。该应用使用 nginx 作为 Web 服务器，具有良好的性能和安全性，并提供健康检查机制以确保服务稳定性。

> 注：当前环境已完成镜像构建并存储于本地仓库，可随时进行部署或推送至远程仓库。