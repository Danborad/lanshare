# 🚀 LanShare 一键部署指南

## 方案一：Docker Hub 一键部署（推荐）

### 1. 直接运行（无需克隆仓库）

```bash
# 创建目录并下载配置文件
mkdir lanshare && cd lanshare
curl -o docker-compose.yml https://raw.githubusercontent.com/your-username/lanshare/main/docker-compose-hub.yml

# 一键启动
docker-compose up -d

# 访问应用
# 桌面端: http://localhost:7070
# 移动端: http://your-ip:7070
```

### 2. 使用预构建镜像

```bash
# 直接拉取镜像运行
docker run -d \
  --name lanshare \
  -p 7070:7070 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  lanshare/lanshare:latest
```

## 方案二：GitHub + Docker Compose

### 1. 克隆并运行

```bash
# 克隆仓库
git clone https://github.com/your-username/lanshare.git
cd lanshare

# 一键启动
docker-compose up -d
```

### 2. 本地构建（如需修改源码）

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

## 方案三：Linux 服务器部署

### 1. 一键安装脚本

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/your-username/lanshare/main/install-linux.sh | bash
```

### 2. 手动安装步骤

```bash
# 安装 Docker（如未安装）
curl -fsSL https://get.docker.com | bash

# 创建项目目录
mkdir -p /opt/lanshare && cd /opt/lanshare

# 下载配置文件
curl -o docker-compose.yml https://raw.githubusercontent.com/your-username/lanshare/main/docker-compose-hub.yml

# 启动服务
docker-compose up -d

# 设置开机启动
systemctl enable docker
```

## 网络配置

### 1. 局域网访问

```bash
# 获取本机IP
ip addr show | grep inet

# 其他设备访问
http://你的IP:7070
```

### 2. 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 7070/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=7070/tcp
sudo firewall-cmd --reload
```

## 数据持久化

### 1. 备份数据

```bash
# 停止服务
docker-compose down

# 备份数据目录
tar -czf lanshare-backup-$(date +%Y%m%d).tar.gz uploads/ data/

# 重启服务
docker-compose up -d
```

### 2. 恢复数据

```bash
# 解压备份
tar -xzf lanshare-backup-YYYYMMDD.tar.gz

# 启动服务
docker-compose up -d
```

## 高级配置

### 1. 自定义端口

```yaml
# 修改 docker-compose.yml
services:
  lanshare:
    ports:
      - "8080:7070"  # 改为8080端口
```

### 2. 环境变量

```yaml
# 添加环境变量
services:
  lanshare:
    environment:
      - PORT=7070
      - FLASK_ENV=production
      - MAX_FILE_SIZE=1048576000  # 1GB
```

### 3. 反向代理（Nginx）

```nginx
# /etc/nginx/conf.d/lanshare.conf
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:7070;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 监控与维护

### 1. 查看日志

```bash
# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs lanshare
```

### 2. 更新应用

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d
```

### 3. 健康检查

```bash
# 检查服务状态
docker-compose ps

# 测试服务健康
curl http://localhost:7070/health
```

## 故障排除

### 1. 端口占用

```bash
# 检查端口占用
sudo netstat -tulnp | grep 7070

# 修改端口或停止占用进程
```

### 2. 权限问题

```bash
# 修复权限
sudo chown -R $USER:$USER uploads/ data/
```

### 3. 重启服务

```bash
# 完全重启
docker-compose down
docker-compose up -d
```

## 一键部署命令汇总

```bash
# 最简部署（推荐）
mkdir lanshare && cd lanshare && curl -o docker-compose.yml https://raw.githubusercontent.com/your-username/lanshare/main/docker-compose-hub.yml && docker-compose up -d

# 或者一行命令
curl -fsSL https://raw.githubusercontent.com/your-username/lanshare/main/deploy.sh | bash
```