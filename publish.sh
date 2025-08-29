#!/bin/bash

# LanShare Docker Hub 发布脚本

set -e

# 配置变量
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-your-dockerhub-username}"
IMAGE_NAME="lanshare"
VERSION="${1:-latest}"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查是否已登录Docker Hub
if ! docker info | grep -q "Username"; then
    echo "❌ 请先登录 Docker Hub:"
    echo "   docker login"
    exit 1
fi

echo "🚀 开始构建 LanShare Docker 镜像..."

# 构建镜像
echo "📦 构建 Docker 镜像..."
docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION} .
docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest .

# 推送镜像
echo "🚀 推送镜像到 Docker Hub..."
docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}
docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest

echo "✅ 发布完成！"
echo "📋 镜像地址: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "🔗 Docker Hub: https://hub.docker.com/r/${DOCKERHUB_USERNAME}/${IMAGE_NAME}"

# 生成docker-compose.yml示例
cat > docker-compose.yml << EOF
version: '3.8'
services:
  lanshare:
    image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
    ports:
      - "7070:7070"
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
EOF

echo "📝 docker-compose.yml 已更新为使用 Docker Hub 镜像"