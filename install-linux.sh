#!/bin/bash

# LanShare Linux Docker安装脚本

set -e

echo "🚀 正在启动LanShare Docker部署..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
mkdir -p uploads data

# 设置权限
chmod 755 uploads data

# 构建并启动容器
echo "📦 正在构建Docker镜像..."
docker-compose up --build -d

echo "✅ 部署完成！"
echo ""
echo "🌐 应用访问地址: http://localhost:7070"
echo "📁 上传文件目录: ./uploads/"
echo "💾 数据库文件: ./data/lanshare.db"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"