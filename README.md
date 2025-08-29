# LanShare 🚀

简洁的局域网文件共享工具

## ✨ 特性
- 📱 全平台支持
- ⚡ 实时传输  
- 📂 频道管理
- 🎨 主题切换
- 🐳 Docker一键部署
- 🔒 本地安全传输

## 🚀 快速开始

### Docker部署
```bash
git clone https://github.com/zhong12138/lanshare-v1.git
cd lanshare-v1
docker-compose up -d
```

访问: http://localhost:7070

### 手动部署
**Windows**: `start-single.bat`  
**Linux/Mac**: `./start-debian.sh`

## 📋 配置

### Docker Compose
```yaml
version: '3.8'
services:
  lanshare:
    image: zhong12138/lanshare:latest
    ports:
      - "7070:7070"
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    restart: unless-stopped
```

## 📱 使用
1. 打开 http://localhost:7070
2. 拖拽上传文件
3. 创建频道分类
4. 手机扫码即用

## 🔗 链接
- Docker镜像: https://hub.docker.com/r/zhong12138/lanshare
- 项目地址: https://github.com/zhong12138/lanshare-v1
