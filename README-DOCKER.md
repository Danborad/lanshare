# LanShare 🚀 - Docker版本

**AI赋能的极简局域网文件共享神器**

## 🚀 30秒极速上手

### 1. 一键启动（基础版）
```bash
docker run -d \
  --name lanshare \
  -p 7070:7070 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  -e DOCKER_CONTAINER=true \
  -e HOST_IP=192.168.1.100 \
  -e DOCKER_HOST_IP=192.168.1.100 \
  --restart unless-stopped \
  zhong12138/lanshare:latest
```

### 2. Docker Compose方式（推荐）
```bash
# 创建目录
mkdir lanshare && cd lanshare

# 下载配置文件和IP设置模板
curl -o docker-compose.yml https://raw.githubusercontent.com/zhong12138/lanshare-v1/main/docker-compose.yml

# 一键启动服务（已预设IP为192.168.1.100）
docker-compose up -d

# 访问应用
# 本地: http://localhost:7070
# 局域网: http://192.168.1.100:7070
```

### 3. 配置宿主机IP（已集成）
IP配置已直接集成到Docker配置中，开箱即用！

#### 一键启动（推荐）
```bash
# 项目已预设IP为192.168.1.100，直接启动
docker-compose up -d

# 访问应用
# 本地: http://localhost:7070
# 局域网: http://192.168.1.100:7070
```

#### 如需自定义IP
```bash
# 方法1: 直接编辑docker-compose.yml
# 修改 environment 中的 HOST_IP 和 DOCKER_HOST_IP

# 方法2: Docker Run时设置
docker run -d \
  --name lanshare \
  -p 7070:7070 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  -e HOST_IP=192.168.0.100 \
  -e DOCKER_HOST_IP=192.168.0.100 \
  --restart unless-stopped \
  zhong12138/lanshare:latest
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

### 环境变量配置
```yaml
environment:
  - FLASK_ENV=production
  - HOST_IP=192.168.1.100          # 你的局域网IP地址
  - DOCKER_HOST_IP=192.168.1.100   # Docker宿主机IP
  - MAX_FILE_SIZE=100MB
```

### 环境变量配置（已集成）
IP配置已直接集成到Docker Compose文件中：
```yaml
environment:
  - HOST_IP=192.168.1.100  # 预设局域网IP
  - DOCKER_HOST_IP=192.168.1.100
```
如需修改，直接编辑docker-compose.yml文件即可。

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
| IP显示为Docker容器IP | 设置HOST_IP环境变量为真实局域网IP |
| 其他设备无法访问 | 检查局域网IP设置是否正确 |

## 📱 使用场景

- 🏠 **家庭共享** - 家人间快速传文件
- 🏢 **办公室** - 同事间资料共享
- 🎓 **学校** - 课堂资料分发
- 🎉 **聚会** - 照片视频即时分享

---

**Docker Hub**: https://hub.docker.com/r/zhong12138/lanshare  
**GitHub**: https://github.com/Danborad/lanshare

*让文件传输像呼吸一样简单*