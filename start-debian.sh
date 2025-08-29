#!/bin/bash
# LanShare - Debian/Ubuntu 启动脚本
# 支持自动安装Docker和启动服务

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_warning "检测到以root用户运行，建议使用普通用户"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 检测系统类型
detect_system() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
        log_info "检测到系统: $OS $VERSION"
    else
        log_error "无法检测系统类型"
        exit 1
    fi
}

# 检查Docker是否安装
check_docker() {
    if command -v docker &> /dev/null; then
        log_success "Docker 已安装: $(docker --version)"
        return 0
    else
        log_warning "Docker 未安装"
        return 1
    fi
}

# 检查Docker Compose是否安装
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose 已安装: $(docker-compose --version)"
        return 0
    elif docker compose version &> /dev/null; then
        log_success "Docker Compose (插件) 已安装: $(docker compose version)"
        return 0
    else
        log_warning "Docker Compose 未安装"
        return 1
    fi
}

# 安装Docker
install_docker() {
    log_info "开始安装Docker..."
    
    # 更新包索引
    sudo apt-get update
    
    # 安装必要的包
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # 添加Docker官方GPG密钥
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null || \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # 添加Docker仓库
    if [[ "$OS" == *"Ubuntu"* ]]; then
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    else
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    fi
    
    # 安装Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # 将用户添加到docker组
    sudo usermod -aG docker $USER
    
    log_success "Docker 安装完成"
    log_warning "请重新登录或运行 'newgrp docker' 以使用户组更改生效"
}

# 启动Docker服务
start_docker_service() {
    if ! sudo systemctl is-active --quiet docker; then
        log_info "启动Docker服务..."
        sudo systemctl start docker
        sudo systemctl enable docker
        log_success "Docker服务已启动"
    else
        log_success "Docker服务已运行"
    fi
}

# 获取本机IP地址
get_host_ip() {
    # 尝试多种方法获取IP
    HOST_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}' 2>/dev/null) || \
    HOST_IP=$(hostname -I | awk '{print $1}' 2>/dev/null) || \
    HOST_IP=$(ip addr show | grep 'inet ' | grep -v '127.0.0.1' | head -n1 | awk '{print $2}' | cut -d/ -f1 2>/dev/null) || \
    HOST_IP="localhost"
    
    log_info "检测到主机IP: $HOST_IP"
}

# 停止现有服务
stop_existing_service() {
    log_info "停止现有服务..."
    if command -v docker-compose &> /dev/null; then
        docker-compose down 2>/dev/null || true
    else
        docker compose down 2>/dev/null || true
    fi
}

# 启动服务
start_service() {
    log_info "启动LanShare服务..."
    
    # 导出环境变量
    export HOST_IP=$HOST_IP
    
    # 选择docker-compose命令
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    # 构建并启动服务
    $COMPOSE_CMD up --build -d
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    if $COMPOSE_CMD ps | grep -q "Up"; then
        log_success "LanShare 启动成功!"
        echo
        echo "🌐 访问地址:"
        echo "   本地访问: http://localhost:7070"
        echo "   局域网访问: http://$HOST_IP:7070"
        echo "📱 手机访问: 扫描页面上的二维码"
        echo
        echo "📋 管理命令:"
        echo "   查看状态: $COMPOSE_CMD ps"
        echo "   查看日志: $COMPOSE_CMD logs -f"
        echo "   停止服务: $COMPOSE_CMD down"
        echo "   重启服务: $COMPOSE_CMD restart"
        echo
    else
        log_error "服务启动失败，请查看日志:"
        $COMPOSE_CMD logs
        exit 1
    fi
}

# 主函数
main() {
    echo "=================================================="
    echo "    LanShare - 局域网文件传输和消息系统"
    echo "         Debian/Ubuntu 自动部署脚本"
    echo "=================================================="
    echo
    
    # 检查是否在正确目录
    if [ ! -f "docker-compose.yml" ]; then
        log_error "未找到 docker-compose.yml 文件"
        log_error "请确保在 LanShare 项目根目录运行此脚本"
        exit 1
    fi
    
    # 系统检查
    detect_system
    check_root
    
    # Docker检查和安装
    if ! check_docker; then
        log_info "需要安装Docker，这需要管理员权限"
        read -p "是否自动安装Docker？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_docker
            log_warning "Docker安装完成，请重新运行脚本"
            log_info "或者运行: newgrp docker && $0"
            exit 0
        else
            log_error "请手动安装Docker后重新运行脚本"
            exit 1
        fi
    fi
    
    # 检查Docker Compose
    if ! check_docker_compose; then
        log_error "Docker Compose 未安装"
        log_info "请运行: sudo apt-get install docker-compose"
        exit 1
    fi
    
    # 启动Docker服务
    start_docker_service
    
    # 获取IP地址
    get_host_ip
    
    # 停止现有服务
    stop_existing_service
    
    # 启动服务
    start_service
}

# 脚本入口
main "$@"