# LanShare 🚀

**AI 赋能的极简局域网文件共享神器**  
零配置、零依赖、零门槛，让文件飞起来！
哈哈哈，其实就是我一个小白用 AI 编程软件写的，免费试用各种写出来的，所以说就不说用哪个软件了。

## ✨ 三大核心优势

- 🎯 **极简主义** - 打开即用，无需配置
- ⚡ **极速传输** - 局域网直连，速度爆表
- 📱 **全平台通杀** - 手机电脑平板，一网打尽

## 🎨 贴心小功能

- 📂 **智能频道** - 文件自动分类不混乱
- 🌙 **暗黑模式** - 深夜传文件不刺眼
- 🐳 **Docker 秒启** - 一行命令部署完成
- 🔒 **本地加密** - 你的文件永远属于你

## 🚀 30 秒极速上手

### 🐳 懒人专用（推荐）

```bash
git clone https://github.com/Danborad/lanshare.git
cd lanshare

# 配置宿主机IP（重要！解决Docker IP显示问题）
# 复制环境变量模板
cp .env.example .env  # Windows 用 copy .env.example .env
# 编辑 .env 文件，将 HOST_IP 设置为你的局域网IP
# Windows: 运行 ipconfig 查看你的局域网IP（通常是192.168.x.x）
# macOS/Linux: 运行 ifconfig 或 ip addr 查看

docker-compose up -d
```

**完成！** 打开 http://localhost:7070 即刻开传！现在显示的应该是你的真实局域网IP地址了！

### 🔧 极客玩法

**Windows**: 双击 `start-single.bat`  
**Linux/Mac**: `./start-debian.sh`

> 💡 无需配置，无需安装，就像呼吸一样自然

## 📋 配置

### Docker Compose

```yaml
version: "3.8"
services:
  lanshare:
    image: zhong12138/lanshare:latest
    ports:
      - "7070:7070"
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    restart: unless-stopped
    environment:
      - DOCKER_CONTAINER=true
      - HOST_IP=${HOST_IP:-}
      - DOCKER_HOST_IP=${DOCKER_HOST_IP:-}
```

### 环境变量配置
创建 `.env` 文件：
```bash
# 设置你的局域网IP地址
HOST_IP=192.168.1.100
DOCKER_HOST_IP=192.168.1.100
```

## 📱 使用

1. 打开 http://localhost:7070
2. 拖拽上传文件
3. 创建频道分类
4. 手机扫码即用

## 🔗 链接

- Docker 镜像: https://hub.docker.com/r/zhong12138/lanshare
- 项目地址: https://github.com/Danborad/lanshare

---

## ⚠️ 免责声明

**本程序由 AI 编写，仅供学习交流使用**

- 🚫 请勿用于生产环境
- 🔒 文件传输仅限本地网络
- 📊 不保证数据完整性
- 🛡️ 建议定期备份重要文件
- 👥 多人使用时请注意隐私安全

**使用本程序即视为同意：**  
开发者不对任何数据丢失、隐私泄露或其他使用后果承担责任。请理性使用，快乐分享！

_Made with ❤️ by AI & Human_
