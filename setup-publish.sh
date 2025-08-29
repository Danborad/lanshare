#!/bin/bash

# LanShare 发布配置脚本 - Linux/Mac版本

echo "=== LanShare GitHub & Docker Hub 发布配置 ==="
echo

# 检查依赖
command -v git >/dev/null 2>&1 || { echo "❌ Git 未安装"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker 未安装"; exit 1; }

echo "✅ 环境检查完成！"
echo

# 获取用户信息
read -p "请输入你的GitHub用户名: " GITHUB_USERNAME
read -p "请输入你的Docker Hub用户名: " DOCKERHUB_USERNAME
read -p "请输入GitHub仓库名(默认为lanshare): " GITHUB_REPO
GITHUB_REPO=${GITHUB_REPO:-lanshare}

echo
echo "=== 配置信息 ==="
echo "GitHub用户名: $GITHUB_USERNAME"
echo "Docker Hub用户名: $DOCKERHUB_USERNAME"
echo "仓库名: $GITHUB_REPO"
echo

# 更新配置文件
echo "正在更新配置文件..."

# 更新docker-compose-hub.yml
sed -i "s/lanshare\/lanshare/$DOCKERHUB_USERNAME\/lanshare/g" docker-compose-hub.yml

# 更新publish.sh
sed -i "s/your-dockerhub-username/$DOCKERHUB_USERNAME/g" publish.sh

# 更新文档文件
sed -i "s/your-username/$GITHUB_USERNAME/g" README.md
sed -i "s/your-username/$GITHUB_USERNAME/g" DEPLOY.md
sed -i "s/your-username/$GITHUB_USERNAME/g" PUBLISH.md

echo "✅ 配置文件已更新！"
echo

# 创建发布命令
cat > publish-commands.txt << EOF
=== 发布命令汇总 ===

1. 登录Docker Hub:
   docker login

2. 创建GitHub仓库:
   访问: https://github.com/new
   仓库名: $GITHUB_REPO

3. 推送代码到GitHub:
   git remote add origin https://github.com/$GITHUB_USERNAME/$GITHUB_REPO.git
   git push -u origin master

4. 发布Docker镜像:
   chmod +x publish.sh
   ./publish.sh v1.0.0

5. 一键部署命令（用户使用）:
   mkdir lanshare && cd lanshare
   curl -o docker-compose.yml https://raw.githubusercontent.com/$GITHUB_USERNAME/$GITHUB_REPO/main/docker-compose-hub.yml
   docker-compose up -d

=== 完成！ ===
EOF

echo "发布命令已保存到: publish-commands.txt"
echo
echo "配置文件已准备就绪！"
echo "请按照以下步骤操作："
echo
echo "1. 登录Docker Hub: docker login"
echo "2. 创建GitHub仓库: https://github.com/new"
echo "3. 运行: cat publish-commands.txt"
echo