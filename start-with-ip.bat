@echo off
echo LanShare Docker 启动脚本
echo.

REM 获取本机局域网IP
for /f "tokens=2 delims=[]" %%a in ('ping -4 -n 1 %COMPUTERNAME% ^| findstr [') do set LOCAL_IP=%%a

echo 检测到本机局域网IP: %LOCAL_IP%
echo.

REM 询问用户是否使用检测到的IP
set /p USE_IP="是否使用 %LOCAL_IP% 作为宿主机IP? (Y/n): "
if "%USE_IP%"=="" set USE_IP=Y
if /i "%USE_IP%"=="y" goto use_detected
if /i "%USE_IP%"=="yes" goto use_detected

REM 手动输入IP
set /p LOCAL_IP="请输入正确的局域网IP地址: "

:use_detected
echo.
echo 正在启动LanShare，使用IP: %LOCAL_IP%
echo.

REM 设置环境变量并启动
docker-compose -f docker-compose-ready.yml up --build -e HOST_IP=%LOCAL_IP%

pause