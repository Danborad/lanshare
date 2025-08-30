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
# 1. 克隆项目
git clone https://github.com/Danborad/lanshare.git
cd lanshare

# 2. 一键启动（已预设IP，开箱即用）
docker-compose up -d

# 3. 访问应用
# 打开浏览器访问 http://localhost:7070
# 或者使用局域网IP访问：http://192.168.1.100:7070
```

**完成！** 现在显示的应该是你的真实局域网IP地址了！

### 🔧 自定义IP（可选）
如果默认IP不适用，可以编辑任意docker-compose文件：
```yaml
# 修改环境变量为你的局域网IP
environment:
  - HOST_IP=192.168.0.100  # 改为你的实际IP
  - DOCKER_HOST_IP=192.168.0.100
```

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

### 环境变量配置（已集成）
IP配置已直接集成到Docker Compose文件中，无需额外创建.env文件：

```yaml
# docker-compose.yml 已包含
environment:
  - HOST_IP=192.168.1.100  # 预设局域网IP
  - DOCKER_HOST_IP=192.168.1.100
```

如需修改，直接编辑docker-compose.yml文件即可。

## 📱 使用

1. 打开 http://localhost:7070
2. 拖拽上传文件
3. 创建频道分类
4. 手机扫码即用

## 🔗 链接

- Docker 镜像: https://hub.docker.com/r/zhong12138/lanshare
- 项目地址: https://github.com/Danborad/lanshare

## 🏷️ 版本发布

- **GitHub Releases**: [查看最新版本](https://github.com/Danborad/lanshare/releases)
- **Docker镜像**: `zhong12138/lanshare:latest`

## 最近更新

- **🐛 Docker IP显示修复**: 解决Docker容器中IP和二维码显示问题
- **🚀 一键部署**: 提供自动IP检测的启动脚本
- **📱 多平台支持**: Windows、Linux、macOS启动脚本
- **⚡ 简化配置**: 预设IP地址，开箱即用

## 开发计划

- [ ] 用户认证系统
- [ ] 文件加密功能
- [ ] 批量上传支持
- [ ] 移动端APP
- [ ] 多语言支持

## 版本历史

- **v1.2.0** (2024-12-19): Docker IP显示修复，一键部署
- **v1.1.0** (2024-12-18): Docker支持，自动清理
- **v1.0.0** (2024-12-17): 首次发布

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
