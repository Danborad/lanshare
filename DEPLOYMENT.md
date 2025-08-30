# LanShare Docker 部署指南

## 快速开始

### 1. 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/zhong12138/lanshare.git
cd lanshare

# 启动服务（自动使用预设IP 192.168.1.100）
docker-compose up -d

# 访问应用
# 浏览器打开: http://192.168.1.100:7070
```

### 2. 使用预构建镜像

```bash
# 直接运行（需要先设置正确的IP）
docker run -d \
  --name lanshare \
  -p 7070:7070 \
  -e HOST_IP=你的局域网IP \
  -e DOCKER_HOST_IP=你的局域网IP \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  zhong12138/lanshare:latest
```

## IP 地址配置

### 获取本机局域网IP

#### Windows
```cmd
ipconfig | findstr /R /C:"IPv4.*192\.168\." /C:"IPv4.*10\." /C:"IPv4.*172\.1[6-9]\." /C:"IPv4.*172\.2[0-9]\." /C:"IPv4.*172\.3[01]\."
```

#### Linux/macOS
```bash
ip route get 1 | awk '{print $7}' | head -1
# 或
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

### 修改IP地址

IP配置已直接集成到Docker Compose文件中，开箱即用！如需修改，直接编辑对应文件：

**方法1：编辑docker-compose.yml（推荐）**
```yaml
environment:
  - HOST_IP=192.168.1.150  # 改为你的实际局域网IP
  - DOCKER_HOST_IP=192.168.1.150
```

**方法2：使用一键启动脚本（自动检测）**
```bash
# Windows
.\start-with-ip.ps1

# Linux/macOS
./start-with-ip.sh
```

## 部署方式

### 方式1：使用预配置模板

```bash
# 使用预配置版本（包含IP设置）
docker-compose -f docker-compose-ready.yml up -d
```

### 方式2：使用官方镜像

```bash
# 下载docker-compose配置
curl -o docker-compose.yml https://raw.githubusercontent.com/zhong12138/lanshare/main/docker-compose-hub.yml

# 编辑IP地址
# 修改 HOST_IP 和 DOCKER_HOST_IP 为你自己的局域网IP

# 启动
docker-compose up -d
```

### 方式3：一键启动脚本

#### Windows
```cmd
# 运行PowerShell脚本（自动检测IP）
.\start-with-ip.ps1

# 或运行批处理脚本
start-with-ip.bat
```

#### Linux/macOS
```bash
# 运行Shell脚本
chmod +x start-with-ip.sh
./start-with-ip.sh
```

## 验证部署

### 1. 检查容器状态
```bash
docker ps | grep lanshare
docker logs lanshare
```

### 2. 测试服务
```bash
# 测试健康检查
curl http://localhost:7070/health

# 测试API
curl http://localhost:7070/api/system/info
```

### 3. 浏览器访问
- 本机访问: http://localhost:7070
- 局域网访问: http://你的IP:7070

## 目录结构

```
lanshare/
├── docker-compose.yml          # 本地构建版本
├── docker-compose-hub.yml      # 官方镜像版本
├── docker-compose-ready.yml    # 预配置版本
├── start-with-ip.bat         # Windows启动脚本
├── start-with-ip.ps1         # PowerShell启动脚本
├── start-with-ip.sh          # Linux/macOS启动脚本
├── .env.example              # 环境变量模板
├── DEPLOYMENT.md             # 部署指南
└── QUICK-START.md            # 快速开始
```

## 常见问题

### Q: 为什么右侧不显示IP和二维码？
A: 这是Docker环境的常见问题。容器无法自动识别宿主机的局域网IP。解决方案：

1. 确保设置了正确的 `HOST_IP` 和 `DOCKER_HOST_IP` 环境变量
2. 使用提供的启动脚本自动检测IP
3. 手动检查IP配置是否正确

### Q: 如何修改上传目录？
A: 修改 docker-compose.yml 中的 volumes 配置：

```yaml
volumes:
  - ./my-uploads:/app/uploads      # 自定义上传目录
  - ./my-data:/app/data           # 自定义数据目录
```

### Q: 如何修改端口？
A: 修改 docker-compose.yml 中的 ports 配置：

```yaml
ports:
  - "8080:7070"  # 将外部端口改为8080
```

### Q: 如何查看日志？
```bash
# 查看实时日志
docker logs -f lanshare

# 查看最近100行日志
docker logs --tail 100 lanshare
```

### Q: 如何更新到最新版本？
```bash
# 停止并删除旧容器
docker-compose down

# 拉取最新镜像
docker-compose pull

# 重新启动
docker-compose up -d
```

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| HOST_IP | 宿主机局域网IP | 192.168.1.100 |
| DOCKER_HOST_IP | Docker宿主机IP（与HOST_IP相同） | 192.168.1.100 |
| PORT | 服务端口 | 7070 |
| FLASK_ENV | 运行环境 | production |
| UPLOAD_FOLDER | 上传目录 | ./uploads |
| DATABASE_PATH | 数据库路径 | ./data/lanshare.db |
| AUTO_CLEAN_DAYS | 自动清理天数 | 7 |

## 网络要求

- 确保防火墙允许端口7070
- 确保局域网内其他设备可以访问宿主机的7070端口
- 如果使用路由器，确保端口转发设置正确（如需外网访问）

## 支持

如有问题，请：
1. 检查容器日志
2. 验证IP地址配置
3. 查看GitHub Issues
4. 提交新的Issue