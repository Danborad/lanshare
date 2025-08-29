# LanShare Docker Publishing Tool
# PowerShell Version for Windows

Write-Host "===============================================" -ForegroundColor Green
Write-Host "    LanShare Docker Publishing Tool (Windows)" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "docker")) {
    Write-Host "ERROR: Docker is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Check Docker Hub login
Write-Host "[INFO] Checking Docker Hub login status..." -ForegroundColor Cyan
try {
    $dockerInfo = docker info 2>$null
    if ($dockerInfo -notmatch "Username") {
        Write-Host "WARNING: Not logged into Docker Hub" -ForegroundColor Yellow
        Write-Host "Please run: docker login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: Docker is not running or not accessible" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Docker Hub login verified" -ForegroundColor Green
Write-Host ""

# Get configuration
$dockerUsername = Read-Host "Enter Docker Hub username [zhong12138]"
if ([string]::IsNullOrWhiteSpace($dockerUsername)) {
    $dockerUsername = "zhong12138"
}

$imageName = "lanshare"
$version = "latest"

Write-Host ""
Write-Host "[INFO] Starting build and publish process..." -ForegroundColor Cyan

# Build images
Write-Host "[BUILD] Building Docker images..." -ForegroundColor Yellow
docker build -t "${dockerUsername}/${imageName}:${version}" .
docker build -t "${dockerUsername}/${imageName}:latest" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Images built successfully" -ForegroundColor Green

# Push images
Write-Host "[PUSH] Pushing images to Docker Hub..." -ForegroundColor Yellow
docker push "${dockerUsername}/${imageName}:${version}"
docker push "${dockerUsername}/${imageName}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "[SUCCESS] Publishing completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Image: ${dockerUsername}/${imageName}:${version}" -ForegroundColor Cyan
Write-Host "Docker Hub: https://hub.docker.com/r/${dockerUsername}/${imageName}" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green

# Create deployment file
$composeContent = @"
version: '3.8'
services:
  lanshare:
    image: ${dockerUsername}/${imageName}:latest
    ports:
      - "7070:7070"
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
"@

Set-Content -Path "docker-compose-ready.yml" -Value $composeContent
Write-Host ""
Write-Host "[CREATED] docker-compose-ready.yml for deployment" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy your published image:" -ForegroundColor Yellow
Write-Host "docker-compose -f docker-compose-ready.yml up -d" -ForegroundColor White