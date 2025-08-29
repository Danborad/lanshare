@echo off
REM LanShare 发布配置脚本 - Windows版本

echo === LanShare GitHub & Docker Hub 发布配置 ===
echo.

REM 设置窗口标题
title LanShare 发布配置

REM 检查是否已安装Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git 未安装，请先安装 Git
    echo 📥 下载地址: https://git-scm.com/download/win
    pause
    exit /b
)

REM 检查是否已安装Docker
docker --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker 未安装，请先安装 Docker Desktop
    echo 📥 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b
)

echo ✅ 环境检查完成！
echo.

REM 获取用户信息
set /p GITHUB_USERNAME=请输入你的GitHub用户名: 
set /p DOCKERHUB_USERNAME=请输入你的Docker Hub用户名: 
set /p GITHUB_REPO=请输入GitHub仓库名(默认为lanshare): 
if "%GITHUB_REPO%"=="" set GITHUB_REPO=lanshare

echo.
echo === 配置信息 ===
echo GitHub用户名: %GITHUB_USERNAME%
echo Docker Hub用户名: %DOCKERHUB_USERNAME%
echo 仓库名: %GITHUB_REPO%
echo.

REM 更新配置文件
echo 正在更新配置文件...

REM 更新docker-compose-hub.yml
powershell -Command "(Get-Content docker-compose-hub.yml) -replace 'lanshare/lanshare', '%DOCKERHUB_USERNAME%/lanshare' | Set-Content docker-compose-hub.yml"

REM 更新publish.sh
powershell -Command "(Get-Content publish.sh) -replace 'your-dockerhub-username', '%DOCKERHUB_USERNAME%' | Set-Content publish.sh"

REM 更新README.md
powershell -Command "(Get-Content README.md) -replace 'your-username', '%GITHUB_USERNAME%' | Set-Content README.md"

REM 更新DEPLOY.md
powershell -Command "(Get-Content DEPLOY.md) -replace 'your-username', '%GITHUB_USERNAME%' | Set-Content DEPLOY.md"

REM 更新PUBLISH.md
powershell -Command "(Get-Content PUBLISH.md) -replace 'your-username', '%GITHUB_USERNAME%' | Set-Content PUBLISH.md"

echo ✅ 配置文件已更新！
echo.

REM 显示下一步操作
echo === 下一步操作 ===
echo.
echo 1. 登录Docker Hub:
echo    docker login
echo.
echo 2. 登录GitHub (创建仓库):
echo    访问: https://github.com/new
echo    仓库名: %GITHUB_REPO%
echo.
echo 3. 推送代码到GitHub:
echo    git remote add origin https://github.com/%GITHUB_USERNAME%/%GITHUB_REPO%.git
echo    git push -u origin master
echo.
echo 4. 发布Docker镜像:
echo    ./publish.sh v1.0.0

echo.
echo 配置文件已准备就绪！
pause