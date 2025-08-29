#!/bin/bash
# LanShare 一键安装脚本
# 适用于 Debian/Ubuntu 系统

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
 _                 ____  _                     
| |    __ _ _ __  / ___|| |__   __ _ _ __ ___  
| |   / _` | '_ \ \___ \| '_ \ / _` | '__/ _ \ 
| |__| (_| | | | | ___) | | | | (_| | | |  __/ 
|_____\__,_|_| |_|____/|_| |_|\__,_|_|  \___| 

        局域网文件传输和消息系统
           Debian/Ubuntu 一键部署
EOF
echo -e "${NC}"

# 检查系统
if [ ! -f /etc/debian_version ] && [ ! -f /etc/lsb-release ]; then
    echo "错误: 此脚本仅支持 Debian/Ubuntu 系统"
    exit 1
fi

# 给脚本添加执行权限
chmod +x start-debian.sh

echo -e "${GREEN}正在启动 LanShare...${NC}"
echo

# 运行启动脚本
./start-debian.sh