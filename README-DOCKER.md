# LanShare 🚀 - Docker版本

**AI赋能的极简局域网文件共享神器**

## 🚀 30秒极速上手

### 1. 一键启动
```bash
docker run -d \
  --name lanshare \
  -p 7070:7070 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  zhong12138/lanshare:latest
```

### 2. 即刻访问
打开 http://localhost:7070 即刻开传！

### 3. Docker Compose方式（推荐）
```bash
# 创建目录
mkdir lanshare && cd lanshare

# 下载配置文件
curl -o docker-compose.yml https://raw.githubusercontent.com/Danborad/lanshare/master/docker-compose-ready.yml

# 启动
docker-compose up -d
```

## ✨ 核心特性

- 🎯 **零配置** - 打开即用
- ⚡ **极速传输** - 局域网直连
- 📱 **全平台支持** - 手机电脑平板
- 📂 **智能频道** - 文件自动分类
- 🌙 **暗黑模式** - 深夜传文件
- 🔒 **本地加密** - 安全传输

## 📋 环境要求

- **Docker**: 20.10+
- **端口**: 7070 (可自定义)
- **存储**: 100MB+ 可用空间

## 💾 数据持久化

| 数据类型 | 路径 | 说明 |
|---------|------|------|
| 上传文件 | `./uploads/` | 用户上传的所有文件 |
| 数据库 | `./data/lanshare.db` | 频道和文件索引 |

## 🔧 高级配置

### 自定义端口
```yaml
# docker-compose.yml
ports:
  - "8080:7070"  # 改为8080端口
```

### 环境变量
```yaml
environment:
  - FLASK_ENV=production
  - MAX_FILE_SIZE=100MB
```

## 🛠️ 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 更新镜像
docker-compose pull && docker-compose up -d

# 清理数据
# ⚠️ 警告：会删除所有上传的文件
docker-compose down -v
```

## 🚨 注意事项

- **仅限局域网**: 确保在受信任的网络环境使用
- **定期备份**: 重要文件建议额外备份
- **存储空间**: 监控磁盘空间使用情况
- **权限管理**: 多人使用时注意文件权限

## 📞 故障排除

| 问题 | 解决方案 |
|------|----------|
| 端口冲突 | 修改docker-compose.yml中的端口映射 |
| 权限错误 | 确保Docker用户有目录写入权限 |
| 无法访问 | 检查防火墙设置和端口开放 |
| 文件丢失 | 确认卷挂载路径正确 |

## 📱 使用场景

- 🏠 **家庭共享** - 家人间快速传文件
- 🏢 **办公室** - 同事间资料共享
- 🎓 **学校** - 课堂资料分发
- 🎉 **聚会** - 照片视频即时分享

---

**Docker Hub**: https://hub.docker.com/r/zhong12138/lanshare  
**GitHub**: https://github.com/Danborad/lanshare

*让文件传输像呼吸一样简单*