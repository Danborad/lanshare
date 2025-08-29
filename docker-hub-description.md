# LanShare 🚀 - 极简局域网文件共享

**AI赋能的零配置文件传输神器**

## 🚀 一键启动
```bash
docker run -d -p 7070:7070 -e HOST_IP=192.168.1.100 zhong12138/lanshare:latest
```

打开 http://localhost:7070 即刻使用！

**注意**: 将 `192.168.1.100` 替换为你的局域网IP地址，确保其他设备能正确访问。

## ✨ 核心特性
- 🎯 **零配置** - 打开即用，无需设置
- ⚡ **极速传输** - 局域网直连，速度爆表
- 📱 **全平台** - 手机、电脑、平板全支持
- 📂 **智能分类** - 文件自动整理到频道
- 🌙 **暗黑模式** - 深夜传文件不刺眼
- 🔒 **本地安全** - 数据不上传云端

## 📋 快速部署
### Docker Compose（推荐）
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
    environment:
      - HOST_IP=192.168.1.100  # 替换为你的局域网IP
    restart: unless-stopped
```

### 查找局域网IP
- **Windows**: `ipconfig` 查看IPv4地址
- **Mac/Linux**: `ifconfig` 或 `ip addr` 查看局域网IP

## 💾 数据存储
- **上传文件**: `./uploads/` 目录
- **数据库**: `./data/lanshare.db`
- **持久化**: 重启不丢失数据

## 🔧 使用场景
- 🏠 家庭文件共享
- 🏢 办公室资料传输
- 🎓 学校教学分享
- 🎉 聚会照片视频

**GitHub**: https://github.com/Danborad/lanshare

*让文件传输像呼吸一样简单*