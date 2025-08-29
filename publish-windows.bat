@echo off
setlocal enabledelayedexpansion

title LanShare Docker Publishing Tool

echo ================================================
echo    LanShare Docker Publishing Tool (Windows)
echo ================================================
echo.

:: Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://docs.docker.com/desktop/install/windows-install/
    echo.
    pause
    exit /b 1
)

echo [INFO] Docker detected successfully
echo.

:: Check if user is logged into Docker Hub
echo [INFO] Checking Docker Hub login status...
docker info | findstr /C:"Username" >nul
if %errorlevel% neq 0 (
    echo WARNING: Not logged into Docker Hub
    echo.
    echo Please login to Docker Hub first:
    echo docker login
    echo.
    echo After logging in, run this script again.
    pause
    exit /b 1
)

echo [INFO] Docker Hub login verified
echo.

:: Get Docker Hub username from user or use default
set /p DOCKER_USERNAME="Enter Docker Hub username [zhong12138]: "
if "%DOCKER_USERNAME%"=="" set DOCKER_USERNAME=zhong12138

set IMAGE_NAME=lanshare
set VERSION=latest

echo.
echo [INFO] Starting Docker build and publish process...
echo.

:: Build Docker images
echo [BUILD] Building Docker images...
docker build -t %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION% .
docker build -t %DOCKER_USERNAME%/%IMAGE_NAME%:latest .

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed
    pause
    exit /b 1
)

echo [SUCCESS] Docker images built successfully
echo.

:: Push images to Docker Hub
echo [PUSH] Pushing images to Docker Hub...
docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%
docker push %DOCKER_USERNAME%/%IMAGE_NAME%:latest

if %errorlevel% neq 0 (
    echo ERROR: Docker push failed
    pause
    exit /b 1
)

echo.
echo ================================================
echo [SUCCESS] Publishing completed successfully!
echo.
echo Image: %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%
echo Docker Hub: https://hub.docker.com/r/%DOCKER_USERNAME%/%IMAGE_NAME%
echo.
echo ================================================

:: Create updated docker-compose.yml for users
echo Creating docker-compose.yml for Docker Hub usage...
(
echo version: '3.8'
echo services:
echo   lanshare:
echo     image: %DOCKER_USERNAME%/%IMAGE_NAME%:latest
 echo     ports:
echo       - "7070:7070"
echo     volumes:
echo       - ./uploads:/app/uploads
echo       - ./data:/app/data
 echo     restart: unless-stopped
echo     environment:
echo       - FLASK_ENV=production
) > docker-compose-hub-ready.yml

echo.
echo [INFO] docker-compose-hub-ready.yml created for users
echo.
echo To deploy your published image:
echo 1. docker login
echo 2. docker-compose -f docker-compose-hub-ready.yml up -d
echo.
pause