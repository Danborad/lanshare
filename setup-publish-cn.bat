@echo off
chcp 65001 > nul
REM LanShare 发布配置脚本 - Windows中文版 (UTF-8)

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

REM 使用PowerShell更新文件编码为UTF-8
powershell -Command "
$content = Get-Content docker-compose-hub.yml -Raw
$content = $content -replace 'lanshare/lanshare', '%DOCKERHUB_USERNAME%/lanshare'
$content | Set-Content docker-compose-hub.yml -Encoding UTF8

$content = Get-Content publish.sh -Raw
$content = $content -replace 'your-dockerhub-username', '%DOCKERHUB_USERNAME%'
$content | Set-Content publish.sh -Encoding UTF8

$content = Get-Content README.md -Raw
$content = $content -replace 'your-username', '%GITHUB_USERNAME%'
$content | Set-Content README.md -Encoding UTF8

$content = Get-Content DEPLOY.md -Raw
$content = $content -replace 'your-username', '%GITHUB_USERNAME%'
$content | Set-Content DEPLOY.md -Encoding UTF8

$content = Get-Content PUBLISH.md -Raw
$content = $content -replace 'your-username', '%GITHUB_USERNAME%'
$content | Set-Content PUBLISH.md -Encoding UTF8
"

echo ✅ 配置文件已更新！
echo.

REM 创建发布命令文件
echo 正在创建发布命令...
echo @echo off > publish-commands.bat
echo chcp 65001 > nul >> publish-commands.bat
echo. >> publish-commands.bat
echo === 发布命令汇总 === >> publish-commands.bat
echo. >> publish-commands.bat
echo 1. 登录Docker Hub: >> publish-commands.bat
echo    docker login >> publish-commands.bat
echo. >> publish-commands.bat
echo 2. 创建GitHub仓库: >> publish-commands.bat
echo    访问: https://github.com/new >> publish-commands.bat
echo    仓库名: %GITHUB_REPO% >> publish-commands.bat
echo. >> publish-commands.bat
echo 3. 推送代码到GitHub: >> publish-commands.bat
echo    git remote add origin https://github.com/%GITHUB_USERNAME%/%GITHUB_REPO%.git >> publish-commands.bat
echo    git push -u origin master >> publish-commands.bat
echo. >> publish-commands.bat
echo 4. 发布Docker镜像: >> publish-commands.bat
echo    先运行: docker login >> publish-commands.bat
echo    然后运行: publish.sh v1.0.0 >> publish-commands.bat
echo. >> publish-commands.bat
echo 5. 一键部署命令（用户使用）: >> publish-commands.bat
echo    mkdir lanshare ^& cd lanshare >> publish-commands.bat
echo    curl -o docker-compose.yml https://raw.githubusercontent.com/%GITHUB_USERNAME%/%GITHUB_REPO%/main/docker-compose-hub.yml >> publish-commands.bat
echo    docker-compose up -d >> publish-commands.bat
echo. >> publish-commands.bat
echo === 完成！ === >> publish-commands.bat

echo ✅ 所有配置脚本已创建！
echo.
echo === 下一步操作 ===
echo.
echo 1. 登录Docker Hub:
echo    docker login
echo.
echo 2. 创建GitHub仓库:
echo    访问: https://github.com/new
echo    仓库名: %GITHUB_REPO%
echo.
echo 3. 推送代码到GitHub:
echo    git remote add origin https://github.com/%GITHUB_USERNAME%/%GITHUB_REPO%.git
echo    git push -u origin master
echo.
echo 4. 发布Docker镜像:
echo    先运行: docker login
echo    然后运行: publish.sh v1.0.0
echo.
echo 5. 一键部署命令（用户使用）:
echo    mkdir lanshare ^& cd lanshare
echo    curl -o docker-compose.yml https://raw.githubusercontent.com/%GITHUB_USERNAME%/%GITHUB_REPO%/main/docker-compose-hub.yml
echo    docker-compose up -d
echo.
echo 配置文件已准备就绪！
echo 已创建以下文件:
echo - setup-publish-cn.bat (本脚本)
echo - setup-publish.ps1 (PowerShell版本)
echo - publish-commands.bat (发布命令汇总)
echo.
pause