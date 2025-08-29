#!/bin/bash
# Linux打包脚本

echo "🎁 正在创建LanShare Linux打包..."

# 创建临时目录
mkdir -p /tmp/lanshare-package

# 复制必要文件
cp -r lanshare-v1 /tmp/lanshare-package/

# 进入临时目录
cd /tmp/lanshare-package

# 清理不必要的文件
find lanshare-v1 -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find lanshare-v1 -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find lanshare-v1 -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
find lanshare-v1 -name ".vscode" -type d -exec rm -rf {} + 2>/dev/null || true
find lanshare-v1 -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find lanshare-v1 -name "*.pyc" -delete 2>/dev/null || true
find lanshare-v1 -name "*.log" -delete 2>/dev/null || true

# 创建Linux兼容的tar.gz
tar -czf /tmp/lanshare-complete-linux.tar.gz lanshare-v1

echo "✅ 打包完成！"
echo "📦 文件位置: /tmp/lanshare-complete-linux.tar.gz"
echo "📊 文件大小: $(du -h /tmp/lanshare-complete-linux.tar.gz | cut -f1)"