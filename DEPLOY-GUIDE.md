# LanShare Debian Docker部署指南

## 🚀 快速部署

### 1. 解压文件
```bash
unzip lanshare-complete-linux.zip
cd lanshare-v1
```

### 2. 运行安装
```bash
chmod +x install-linux.sh
./install-linux.sh
```

### 3. 访问应用
打开浏览器访问: http://localhost:7070

## ✅ 已完成配置

- **Logo**: 使用你提供的黑白logo，支持深色/浅色模式反色
- **主题**: 完整的深色/浅色模式支持
- **文件分享**: 拖拽上传、过期时间设置
- **响应式设计**: 支持移动端和桌面端
- **数据持久化**: 上传文件和数据库自动持久化

## 📋 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 端口7070

## 🛠️ 常用命令
```bash
docker-compose up -d      # 启动
docker-compose down       # 停止
docker-compose logs -f    # 查看日志
docker-compose restart    # 重启
```

## 🎯 部署完成！