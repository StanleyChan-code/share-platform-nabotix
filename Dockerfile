# 使用官方 nginx 镜像作为基础镜像
FROM nginx:alpine-slim

# 设置工作目录
WORKDIR /app

# 删除默认的 nginx 静态页面
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