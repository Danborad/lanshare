# LanShare 快速启动指南

## 🚀 一键启动（已配置好IP）

现在所有docker-compose文件都已配置好局域网IP，可以直接启动：

```bash
# 使用默认配置
docker-compose up

# 或者使用生产配置
docker-compose -f docker-compose-ready.yml up
```

## 📍 当前配置

- **IP地址**: 192.168.1.100
- **端口**: 7070
- **访问地址**: http://192.168.1.100:7070

## 🔄 修改IP地址

### 方法1：直接编辑文件（简单）
编辑任意docker-compose文件，修改IP地址：

```yaml
environment:
  - HOST_IP=192.168.0.123  # 改为你的实际IP
  - DOCKER_HOST_IP=192.168.0.123
```

### 方法2：使用一键脚本（自动检测）
```bash
# Windows
.\start-with-ip.ps1

# Linux/macOS
./start-with-ip.sh
```

### 方法3：获取本机IP后手动设置
```bash
# Windows
ipconfig | findstr IPv4

# Linux/macOS
ip route get 1 | awk '{print $7}'
```

## 🎯 验证启动成功

1. 打开浏览器访问：http://localhost:7070
2. 检查右侧IP显示是否为 192.168.1.100
3. 二维码应该显示正确的局域网地址

## 📝 查看日志

```bash
docker-compose logs -f lanshare
```