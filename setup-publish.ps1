# LanShare 发布配置脚本 - PowerShell版本
# 支持中文显示，无乱码问题

Write-Host "=== LanShare GitHub & Docker Hub 发布配置 ===" -ForegroundColor Green
Write-Host

# 检查依赖
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

if (-not (Test-Command git)) {
    Write-Host "❌ Git 未安装，请先安装 Git" -ForegroundColor Red
    Write-Host "📥 下载地址: https://git-scm.com/download/win" -ForegroundColor Yellow
    pause
    exit
}

if (-not (Test-Command docker)) {
    Write-Host "❌ Docker 未安装，请先安装 Docker Desktop" -ForegroundColor Red
    Write-Host "📥 下载地址: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "✅ 环境检查完成！" -ForegroundColor Green
Write-Host

# 获取用户信息
$GITHUB_USERNAME = Read-Host "请输入你的GitHub用户名"
$DOCKERHUB_USERNAME = Read-Host "请输入你的Docker Hub用户名"
$GITHUB_REPO = Read-Host "请输入GitHub仓库名(默认为lanshare)"
if ([string]::IsNullOrEmpty($GITHUB_REPO)) {
    $GITHUB_REPO = "lanshare"
}

Write-Host
Write-Host "=== 配置信息 ===" -ForegroundColor Cyan
Write-Host "GitHub用户名: $GITHUB_USERNAME"
Write-Host "Docker Hub用户名: $DOCKERHUB_USERNAME"
Write-Host "仓库名: $GITHUB_REPO"
Write-Host

# 更新配置文件
Write-Host "正在更新配置文件..." -ForegroundColor Yellow

# 定义需要更新的文件列表
$filesToUpdate = @(
    "docker-compose-hub.yml",
    "publish.sh",
    "README.md",
    "DEPLOY.md",
    "PUBLISH.md"
)

foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace 'lanshare/lanshare', "$DOCKERHUB_USERNAME/lanshare"
        $content = $content -replace 'your-dockerhub-username', $DOCKERHUB_USERNAME
        $content = $content -replace 'your-username', $GITHUB_USERNAME
        $content | Set-Content $file -Encoding UTF8
        Write-Host "✅ 已更新: $file" -ForegroundColor Green
    }
}

# 创建发布命令文件
$publishCommands = @"
@echo off
title LanShare 发布命令
echo === LanShare 发布命令汇总 ===
echo.
echo 1. 登录Docker Hub:
echo    docker login
echo.
echo 2. 创建GitHub仓库:
echo    访问: https://github.com/new
echo    仓库名: $GITHUB_REPO
echo.
echo 3. 推送代码到GitHub:
echo    git remote add origin https://github.com/$GITHUB_USERNAME/$GITHUB_REPO.git
echo    git push -u origin master
echo.
echo 4. 发布Docker镜像:
echo    先运行: docker login
echo    然后运行: publish.sh v1.0.0
echo.
echo 5. 一键部署命令（用户使用）:
echo    mkdir lanshare ^& cd lanshare
echo    curl -o docker-compose.yml https://raw.githubusercontent.com/$GITHUB_USERNAME/$GITHUB_REPO/main/docker-compose-hub.yml
echo    docker-compose up -d
echo.
echo === 完成！ ===
pause
"@

$publishCommands | Set-Content "publish-commands.bat" -Encoding UTF8

# 创建Docker构建脚本
$buildScript = @"
#!/bin/bash
# Docker镜像构建脚本

echo "=== 构建 LanShare Docker 镜像 ==="
docker build -t $DOCKERHUB_USERNAME/lanshare:latest .
docker build -t $DOCKERHUB_USERNAME/lanshare:v1.0.0 .

echo "=== 推送镜像到Docker Hub ==="
docker push $DOCKERHUB_USERNAME/lanshare:latest
docker push $DOCKERHUB_USERNAME/lanshare:v1.0.0

echo "✅ 发布完成！"
echo "镜像地址: $DOCKERHUB_USERNAME/lanshare:latest"
"@

$buildScript | Set-Content "build-and-push.sh" -Encoding UTF8

# 创建GitHub推送脚本
$gitScript = @"
git remote add origin https://github.com/$GITHUB_USERNAME/$GITHUB_REPO.git
git push -u origin master
"@

$gitScript | Set-Content "push-to-github.sh" -Encoding UTF8

Write-Host
Write-Host "✅ 所有配置脚本已创建！" -ForegroundColor Green
Write-Host
Write-Host "=== 下一步操作 ===" -ForegroundColor Cyan
Write-Host "1. 登录Docker Hub: docker login" -ForegroundColor Yellow
Write-Host "2. 创建GitHub仓库: https://github.com/new" -ForegroundColor Yellow
Write-Host "3. 推送代码: ./push-to-github.sh" -ForegroundColor Yellow
Write-Host "4. 发布镜像: ./build-and-push.sh" -ForegroundColor Yellow
Write-Host
Write-Host "已创建文件:" -ForegroundColor Green
Write-Host "- setup-publish.ps1 (本脚本)" -ForegroundColor White
Write-Host "- publish-commands.bat (Windows命令汇总)" -ForegroundColor White
Write-Host "- build-and-push.sh (Docker发布)" -ForegroundColor White
Write-Host "- push-to-github.sh (GitHub推送)" -ForegroundColor White
Write-Host
Write-Host "用户一键部署命令:" -ForegroundColor Cyan
Write-Host "mkdir lanshare && cd lanshare" -ForegroundColor White
Write-Host "curl -o docker-compose.yml https://raw.githubusercontent.com/$GITHUB_USERNAME/$GITHUB_REPO/main/docker-compose-hub.yml" -ForegroundColor White
Write-Host "docker-compose up -d" -ForegroundColor White
Write-Host

pause