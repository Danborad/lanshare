# LanShare 🚀

一个现代化的局域网文件共享工具，支持实时传输、频道管理和移动端适配�?
## �?特�?
- 📱 **全平台支�?*：桌面端和移动端完美适配
- �?**实时传输**：WebSocket 实时文件传输
- 📂 **频道管理**：支持多频道文件分类
- 🎨 **现代UI**：深�?浅色主题切换
- 🐳 **Docker部署**：一键部署，开箱即�?- 🔒 **本地安全**：纯局域网传输，无需外网

## 🚀 一键部�?
### Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/Danborad/lanshare.git
cd lanshare

# 2. 一键启�?docker-compose up -d

# 3. 访问应用
# 桌面�? http://localhost:7070
# 移动�? http://your-ip:7070
```

### 手动部署

```bash
# 1. 下载源码
git clone https://github.com/Danborad/lanshare.git
cd lanshare

# 2. 启动服务
./start-debian.sh
```

## 📋 系统要求

- Docker & Docker Compose
- 支持的操作系统：Linux, macOS, Windows
- 网络：局域网环境

## 🔧 配置

### 环境变量

```bash
# 可选配�?PORT=7070                    # 应用端口
FLASK_ENV=production         # 运行环境
```

### Docker Compose 配置

```yaml
version: '3.8'
services:
  lanshare:
    image: your-dockerhub-username/lanshare:latest
    ports:
      - "7070:7070"
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    restart: unless-stopped
```

## 📱 使用说明

1. **访问应用**：打开浏览器访�?`http://localhost:7070`
2. **上传文件**：拖拽或点击上传区域
3. **创建频道**：点击侧边栏添加新频�?4. **移动�?*：使用手机浏览器访问同一地址

## 🛠�?开�?
```bash
# 前端开�?cd frontend
npm install
npm run dev

# 后端开�?cd backend
pip install -r requirements.txt
python app.py
```

## 📄 许可�?
MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue �?Pull Request�?
## 🆘 支持

如有问题，请通过以下方式联系�?- GitHub Issues
- 邮箱: your-email@example.com
