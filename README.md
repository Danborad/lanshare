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
- 🔒 **密码保护** - 可选的访问密码保护
- 💬 **实时聊天** - 支持文本和文件消息
- 🖼️ **文件预览** - 图片、视频、音频在线预览
- 📱 **全平台通杀** - 手机电脑平板，一网打尽

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

**完成！** 现在显示的应该是你的真实局域网 IP 地址了！

### 🔧 自定义 IP（可选）

如果默认 IP 不适用，可以编辑任意 docker-compose 文件：

```yaml
# 修改环境变量为你的局域网IP
environment:
  - HOST_IP=192.168.0.100 # 改为你的实际IP
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

IP 配置已直接集成到 Docker Compose 文件中，无需额外创建.env 文件：

```yaml
# docker-compose.yml 已包含
environment:
  - HOST_IP=192.168.1.100 # 预设局域网IP
  - DOCKER_HOST_IP=192.168.1.100
```

如需修改，直接编辑 docker-compose.yml 文件即可。

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
- **Docker 镜像**: `zhong12138/lanshare:latest`

## 最近更新

- **🔒 密码保护系统**: 新增可选的访问密码保护功能，支持首次设置和密码验证
- **💬 聊天文件发送**: 在聊天页面中支持直接发送文件和图片，与文件传输列表完全独立
- **🖼️ 文件预览功能**: 支持图片、视频、音频文件的在线预览，无需下载即可查看
- **🔄 版本检查系统**: 新增自动版本检查和更新提醒功能，支持多种版本源
- **🐛 中文文件名支持**: 完美支持中文文件名显示和预览，解决文件名乱码问题

## 开发计划

- [ ] 用户认证系统
- [ ] 文件加密功能
- [ ] 批量上传支持
- [ ] 移动端 APP
- [ ] 多语言支持

## 版本历史

- **v1.3.2** (2025-09-22): 图片预览优化、聊天界面优化、密码设置优化、多窗口安全修复
- **v1.3.0** (2025-09-22): 密码保护、聊天文件发送、文件预览、版本检查
- **v1.2.0** (2025-09-22): Docker IP 显示修复，一键部署
- **v1.1.0** (2025-09-21): Docker 支持，自动清理
- **v1.0.0** (2025-09-20): 首次发布

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
