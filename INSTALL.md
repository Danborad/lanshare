# LanShare Debian 部署指南

## 快速开�?

```bash
# 1. 解压文件
tar -xzf lanshare-v*-debian.tar.gz
cd lanshare-v*-debian

# 2. 一键安装启�?
chmod +x install.sh
./install.sh
```

## 手动安装

```bash
# 1. 给脚本执行权�?
chmod +x start-debian.sh

# 2. 运行启动脚本
./start-debian.sh
```

## 访问应用

- 本地访问: http://localhost:7070
- 局域网访问: http://你的IP:7070  
- 手机访问: 扫描页面二维�?

## 管理命令

```bash
# 查看状�?
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务  
docker-compose restart
```

## 系统要求

- Debian 9+ �?Ubuntu 18.04+
- 2GB+ RAM
- 10GB+ 磁盘空间
- Docker 20.10+
