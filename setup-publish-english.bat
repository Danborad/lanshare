@echo off
setlocal enabledelayedexpansion

:: LanShare Publishing Configuration Script
:: Windows Version - English (No Chinese characters)

title LanShare Publishing Setup

echo ================================================
echo    LanShare Publishing Configuration Tool
echo ================================================
echo.

:: Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

:: Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://docs.docker.com/desktop/install/windows-install/
    echo.
    pause
    exit /b 1
)

echo [INFO] Git and Docker detected successfully
echo.

:: Get user inputs
set /p GITHUB_USERNAME="Enter your GitHub username: "
set /p DOCKER_USERNAME="Enter your Docker Hub username: "
set /p REPO_NAME="Enter repository name (default: lanshare-v1): "

if "%REPO_NAME%"=="" set REPO_NAME=lanshare-v1

echo.
echo [INFO] Configuring files with your settings...
echo.

:: Update docker-compose-hub.yml
powershell -Command "(Get-Content docker-compose-hub.yml) -replace 'your-dockerhub-username', '%DOCKER_USERNAME%' | Set-Content docker-compose-hub.yml"

:: Update publish.sh
powershell -Command "(Get-Content publish.sh) -replace 'your-dockerhub-username', '%DOCKER_USERNAME%' | Set-Content publish.sh"

:: Update README.md
powershell -Command "(Get-Content README.md) -replace 'your-dockerhub-username', '%DOCKER_USERNAME%' | Set-Content README.md"
powershell -Command "(Get-Content README.md) -replace 'your-github-username', '%GITHUB_USERNAME%' | Set-Content README.md"

:: Update DEPLOY.md
powershell -Command "(Get-Content DEPLOY.md) -replace 'your-dockerhub-username', '%DOCKER_USERNAME%' | Set-Content DEPLOY.md"

:: Update PUBLISH.md
powershell -Command "(Get-Content PUBLISH.md) -replace 'your-dockerhub-username', '%DOCKER_USERNAME%' | Set-Content PUBLISH.md"
powershell -Command "(Get-Content PUBLISH.md) -replace 'your-github-username', '%GITHUB_USERNAME%' | Set-Content PUBLISH.md"

:: Create publish commands file
echo @echo off > publish-commands.bat
echo. >> publish-commands.bat
echo :: Publishing Commands for LanShare >> publish-commands.bat
echo :: GitHub: %GITHUB_USERNAME%/%REPO_NAME% >> publish-commands.bat
echo :: Docker Hub: %DOCKER_USERNAME%/lanshare >> publish-commands.bat
echo. >> publish-commands.bat
echo echo Starting publishing process... >> publish-commands.bat
echo. >> publish-commands.bat
echo echo 1. Login to Docker Hub... >> publish-commands.bat
echo docker login >> publish-commands.bat
echo. >> publish-commands.bat
echo echo 2. Building and pushing Docker image... >> publish-commands.bat
echo docker build -t %DOCKER_USERNAME%/lanshare . >> publish-commands.bat
echo docker push %DOCKER_USERNAME%/lanshare >> publish-commands.bat
echo. >> publish-commands.bat
echo echo 3. Pushing to GitHub... >> publish-commands.bat
echo git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git >> publish-commands.bat
echo git branch -M master >> publish-commands.bat
echo git push -u origin master >> publish-commands.bat
echo. >> publish-commands.bat
echo echo Publishing complete! >> publish-commands.bat
echo pause >> publish-commands.bat

echo ================================================
echo Configuration completed successfully!
echo.
echo Next steps:
echo 1. Run: publish-commands.bat
echo 2. Follow the prompts to login and publish
echo.
echo Files updated:
echo - docker-compose-hub.yml
echo - publish.sh
echo - README.md
echo - DEPLOY.md
echo - PUBLISH.md
echo.
echo Repository: https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo Docker Hub: %DOCKER_USERNAME%/lanshare
echo.
echo ================================================
pause