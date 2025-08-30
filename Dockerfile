# 多阶段构建：先构建前端，再设置后端环境
FROM --platform=$BUILDPLATFORM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# 复制前端源码并构建
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# 第二阶段：设置Python后端环境
FROM --platform=$TARGETPLATFORM python:3.11-slim

WORKDIR /app

# 安装Python依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端源码
COPY backend/ ./

# 从前端构建阶段复制静态文件到后端目录
COPY --from=frontend-builder /app/frontend/dist ./static

# 复制版本文件
COPY VERSION ./

# 创建必要的目录
RUN mkdir -p /app/uploads /app/data

# 暴露端口
EXPOSE 7070

# 启动Flask应用
CMD ["python", "app.py"]