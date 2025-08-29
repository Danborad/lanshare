# LanShare - 局域网文件传输系统

🚀 一个现代化的局域网文件传输和消息系统，支持快速文件共享、实时聊天，无需依赖外网。

## ✨ 功能特性

### 📁 文件传输
- ✅ 支持拖拽上传、点击选择多种上传方式
- ✅ 文件列表展示（文件名、大小、上传时间、发送方）
- ✅ 一键下载，支持多种文件格式
- ✅ 文件删除功能（带确认提示）
- ✅ 支持常见文件类型（文档、图片、视频、音频、压缩包等）
- ✅ 单文件最大支持 1GB

### 💬 实时消息
- ✅ 文本消息发送和接收
- ✅ 实时聊天界面（类似现代聊天应用）
- ✅ 支持回车发送、Shift+Enter 换行
- ✅ 复制粘贴支持
- 🔲 图片消息（开发中）

### 🌐 网络分享
- ✅ 自动获取局域网IP地址
- ✅ 生成访问链接和二维码
- ✅ 一键复制分享链接
- ✅ 支持手机扫码访问

### 🎨 现代化UI
- ✅ 大厂风格设计（参考飞书、Notion风格）
- ✅ 支持深色/浅色主题切换
- ✅ 响应式设计，支持PC和移动端
- ✅ 流畅的动画效果
- ✅ 卡片式布局，留白舒适

### ⚡ 技术特性
- ✅ 实时更新（WebSocket）
- ✅ Docker一键部署
- ✅ 跨平台支持
- ✅ 轻量级SQLite数据库
- ✅ 文件本地存储

## 🛠️ 技术栈

### 后端
- **框架**: Python Flask + Flask-SocketIO
- **数据库**: SQLite
- **实时通信**: WebSocket
- **文件处理**: Werkzeug + Pillow
- **二维码**: qrcode

### 前端
- **框架**: React 18
- **构建工具**: Vite
- **样式**: TailwindCSS
- **组件库**: 自定义组件 + Lucide Icons
- **动画**: Framer Motion
- **文件上传**: React Dropzone
- **实时通信**: Socket.IO Client

### 部署
- **容器化**: Docker + Docker Compose
- **代理**: Nginx
- **存储**: 本地文件系统

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd lanshare
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

3. **访问应用**
   - 打开浏览器访问: `http://localhost:7070`
   - 或者访问局域网地址: `http://你的IP:7070`

### 方式二：本地开发

1. **后端启动**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

2. **前端启动**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📱 使用指南

### 文件传输
1. 打开应用，切换到"文件传输"标签
2. 拖拽文件到上传区域，或点击选择文件
3. 点击"开始上传"等待上传完成
4. 其他用户可以在文件列表中看到并下载文件
5. 点击垃圾桶图标可以删除文件

### 消息聊天
1. 切换到"消息聊天"标签
2. 设置您的用户名
3. 在输入框中输入消息，按Enter发送
4. 支持Shift+Enter换行
5. 所有用户可以实时看到消息

### 分享访问
1. 在右侧连接信息区域查看访问地址
2. 点击复制按钮复制链接分享给同事
3. 点击二维码按钮显示二维码，手机扫码访问

## 🔧 配置说明

### 环境变量
- `UPLOAD_FOLDER`: 文件上传目录（默认：./uploads）
- `DATABASE_PATH`: 数据库文件路径（默认：./data/lanshare.db）
- `AUTO_CLEAN_DAYS`: 自动清理天数（默认：7天）

### 端口配置
- 后端API: `5000`
- 前端服务: `7070`

### 文件类型支持
支持的文件扩展名：
- 文档: txt, pdf, doc, docx, xls, xlsx, ppt, pptx
- 图片: png, jpg, jpeg, gif, bmp, webp
- 视频: mp4, avi, mov, mkv, wmv, flv
- 音频: mp3, wav, flac, aac, m4a
- 压缩: zip, rar, 7z, tar, gz

## 📋 项目结构

```
lanshare/
├── docker-compose.yml      # Docker编排配置
├── backend/               # 后端Flask应用
│   ├── app.py            # 主应用文件
│   ├── models.py         # 数据模型
│   ├── config.py         # 配置文件
│   ├── requirements.txt  # Python依赖
│   └── Dockerfile       # 后端Docker配置
├── frontend/             # 前端React应用
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── contexts/    # React上下文
│   │   ├── utils/       # 工具函数
│   │   ├── App.jsx     # 主应用
│   │   └── main.jsx    # 入口文件
│   ├── package.json     # Node.js依赖
│   ├── vite.config.js   # Vite配置
│   └── Dockerfile       # 前端Docker配置
└── uploads/              # 文件上传目录
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 代码规范
- 后端: 遵循PEP8规范
- 前端: 使用ESLint + Prettier
- 提交信息: 使用常规提交格式

## 📄 许可证

MIT License

## 🙏 致谢

- React团队提供优秀的前端框架
- Flask团队提供简洁的后端框架
- TailwindCSS提供现代化的样式系统
- 所有开源贡献者

---

🎉 **享受在局域网内的高效文件传输体验！**