# LanShare Publishing Setup Script
# PowerShell Version - Simple and Clean

Write-Host "===============================================" -ForegroundColor Green
Write-Host "    LanShare Publishing Configuration Tool" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "git")) {
    Write-Host "ERROR: Git is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Command "docker")) {
    Write-Host "ERROR: Docker is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Git and Docker are ready!" -ForegroundColor Green
Write-Host ""

# Get user input
$githubUsername = Read-Host "Enter your GitHub username"
$dockerUsername = Read-Host "Enter your Docker Hub username"
$repoName = Read-Host "Enter repository name [lanshare-v1]"

if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "lanshare-v1"
}

Write-Host ""
Write-Host "[INFO] Updating configuration files..." -ForegroundColor Cyan

# Update files
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
        $content = $content -replace "your-dockerhub-username", $dockerUsername
        $content = $content -replace "your-github-username", $githubUsername
        Set-Content $file $content -NoNewline
        Write-Host "[UPDATED] $file" -ForegroundColor Green
    }
}

# Create deployment commands
$commands = @"
@echo off
echo Publishing LanShare...
echo.
echo STEP 1: Docker Login
docker login
echo.
echo STEP 2: Build and Push Image
docker build -t $dockerUsername/lanshare .
docker push $dockerUsername/lanshare
echo.
echo STEP 3: Push to GitHub
git remote add origin https://github.com/$githubUsername/$repoName.git
git branch -M master
git push -u origin master
echo.
echo All done! Check your repositories:
echo GitHub: https://github.com/$githubUsername/$repoName
echo Docker Hub: https://hub.docker.com/r/$dockerUsername/lanshare
pause
"@

Set-Content "publish-commands.bat" $commands
Write-Host ""
Write-Host "[CREATED] publish-commands.bat" -ForegroundColor Green

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\publish-commands.bat" -ForegroundColor White
Write-Host "2. Follow the prompts" -ForegroundColor White
Write-Host ""
Write-Host "Repository: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
Write-Host "Docker Hub: $dockerUsername/lanshare" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green