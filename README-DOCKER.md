# LanShare Docker部署指南

## 快速开始

### 1. 解压文件
```bash
tar -xzf lanshare-complete.tar.gz
cd lanshare-v1
```

### 2. 运行应用
```bash
docker-compose up -d
```

### 3. 访问应用
打开浏览器访问: http://localhost:7070

## 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 端口7070未被占用

## 文件结构
```
lanshare-v1/
├── docker-compose.yml      # Docker Compose配置
├── Dockerfile             # Docker构建文件
├── backend/               # 后端代码
├── frontend/              # 前端代码
├── uploads/               # 上传文件目录
├── data/                  # 数据库目录
└── README.md             # 此文件
```

## 数据持久化
- 上传文件: ./uploads/
- 数据库: ./data/lanshare.db

## 常用命令
```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看日志
docker-compose logs -f

# 重新构建
docker-compose up --build -d
```

## 故障排除
1. 端口冲突: 修改docker-compose.yml中的端口映射
2. 权限问题: 确保当前用户有Docker权限
3. 磁盘空间: 确保有足够的磁盘空间