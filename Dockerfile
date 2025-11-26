FROM nginx:alpine-slim

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
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]