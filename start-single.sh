#!/bin/bash
# 单容器模式启动脚本

echo "=== LanShare 单容器部署脚本 ==="
echo "正在启动单容器服务..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装"
    exit 1
fi

# 停止现有服务
echo "停止现有服务..."
docker-compose down

# 获取本机IP
HOST_IP=$(hostname -I | awk '{print $1}')
if [ -z "$HOST_IP" ]; then
    HOST_IP="localhost"
fi

echo "检测到的主机IP: $HOST_IP"

# 设置环境变量并启动服务
export HOST_IP=$HOST_IP
echo "构建并启动单容器服务..."
docker-compose up --build -d

# 检查服务状态
sleep 5
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ 服务启动成功!"
    echo "🌐 访问地址: http://$HOST_IP:7070"
    echo "📱 扫描二维码可在手机上访问"
    echo ""
    echo "查看日志: docker-compose logs -f"
    echo "停止服务: docker-compose down"
else
    echo ""
    echo "❌ 服务启动失败，请查看日志:"
    docker-compose logs
fi