# LanShare v1.2.0 发布说明

## 🎉 重要更新

这个版本主要解决了Docker部署中的IP显示问题，现在可以完美地在Docker环境中运行！

## 🐛 主要修复

### Docker IP显示问题
- **问题**: Docker容器中无法正确显示宿主机的局域网IP
- **影响**: 右侧不显示IP地址，二维码无法生成
- **解决方案**: ✅ 已完全修复

### 二维码生成
- **问题**: 由于IP识别错误导致二维码链接无效
- **解决方案**: ✅ 现在可以正确生成包含宿主机IP的二维码

## 🚀 新增功能

### 1. 一键部署脚本
- **Windows**: `start-with-ip.bat` 和 `start-with-ip.ps1`
- **Linux/macOS**: `start-with-ip.sh`
- **功能**: 自动检测局域网IP并启动服务

### 2. 简化配置
- **预设IP**: 默认使用 `192.168.1.100`
- **环境变量**: 新增 `HOST_IP` 和 `DOCKER_HOST_IP` 配置
- **开箱即用**: 下载即可运行，无需复杂配置

### 3. 多平台支持
- **跨平台脚本**: 支持Windows、Linux、macOS
- **自动检测**: 智能识别网络环境
- **用户友好**: 提供交互式IP选择

## 📦 文件更新

### Docker配置
- `docker-compose.yml` - 本地构建版本
- `docker-compose-hub.yml` - 官方镜像版本  
- `docker-compose-ready.yml` - 预配置版本

### 启动脚本
- `start-with-ip.bat` - Windows批处理脚本
- `start-with-ip.ps1` - PowerShell脚本
- `start-with-ip.sh` - Linux/macOS Shell脚本

### 文档更新
- `DEPLOYMENT.md` - 完整的部署指南
- `QUICK-START.md` - 快速开始指南
- `CHANGELOG.md` - 版本更新日志

## 🛠️ 使用方法

### 方法1：一键启动（推荐）
```bash
# Windows
docker-compose up -d

# 或使用脚本
.\start-with-ip.ps1
```

### 方法2：自定义IP
1. 编辑任意docker-compose文件
2. 修改 `HOST_IP` 和 `DOCKER_HOST_IP` 为你的局域网IP
3. 运行 `docker-compose up -d`

### 方法3：使用脚本自动检测
```bash
# Linux/macOS
./start-with-ip.sh

# Windows PowerShell
.\start-with-ip.ps1
```

## 🔍 验证部署

### 检查服务状态
```bash
docker ps | grep lanshare
curl http://localhost:7070/health
```

### 验证IP显示
1. 浏览器访问 `http://localhost:7070`
2. 检查右侧是否正确显示局域网IP
3. 验证二维码是否可以扫描访问

## 📋 环境要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **端口**: 7070 (可配置)
- **网络**: 局域网访问权限

## 🎯 兼容性

- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Docker版本**: 支持最新稳定版本
- **网络环境**: 支持家庭网络、公司网络

## 📞 支持

如果在使用过程中遇到问题：

1. 查看 `DEPLOYMENT.md` 中的故障排除
2. 检查容器日志: `docker logs lanshare`
3. 验证IP配置是否正确
4. 在GitHub提交Issue

## 🔄 升级指南

### 从v1.1.x升级
1. 停止旧容器: `docker-compose down`
2. 拉取最新配置: `git pull origin main`
3. 启动新容器: `docker-compose up -d`

### 从v1.0.x升级
1. 备份数据: `cp -r uploads uploads.backup`
2. 更新代码: `git pull origin main`
3. 使用新的docker-compose配置
4. 恢复数据: `cp -r uploads.backup/* uploads/`

## 🎊 下载地址

- **GitHub Releases**: https://github.com/Danborad/lanshare/releases
- **Docker Hub**: `zhong12138/lanshare:latest`
- **源码**: https://github.com/Danborad/lanshare

---

**祝大家使用愉快！** 🎉