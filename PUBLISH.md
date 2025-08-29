# 🚀 LanShare 发布指南

## 📦 项目已准备就�?
### �?已完成的配置

1. **GitHub 仓库**
   - �?项目已初始化为Git仓库
   - �?所有代码已提交�?次提交）
   - �?包含完整�?gitignore
   - �?GitHub Actions工作流已配置

2. **Docker Hub 配置**
   - �?Dockerfile已优化用于生产环�?   - �?多阶段构建减小镜像体�?   - �?publish.sh脚本用于发布
   - �?docker-compose-hub.yml用于一键部�?
3. **文档完善**
   - �?README.md 项目介绍
   - �?DEPLOY.md 一键部署指�?   - �?PUBLISH.md 发布说明

## 🚀 发布步骤

### 1. 创建GitHub仓库

访问：https://github.com/new
- 仓库名：`lanshare`
- 描述：`Modern LAN file sharing tool with Docker support`
- 设置为公开仓库

### 2. 推送代码到GitHub

```bash
# 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/Danborad/lanshare.git

# 推送代�?git push -u origin master
```

### 3. 发布到Docker Hub

```bash
# 登录Docker Hub
docker login

# 设置用户�?export DOCKERHUB_USERNAME=zhong12138

# 运行发布脚本
./publish.sh v1.0.0
```

### 4. 一键部署命�?
用户可以直接使用以下命令部署�?
```bash
# 方案1：使用Docker Hub镜像
mkdir lanshare && cd lanshare
curl -o docker-compose.yml https://raw.githubusercontent.com/Danborad/lanshare/main/docker-compose-hub.yml
docker-compose up -d

# 方案2：克隆仓库部�?git clone https://github.com/Danborad/lanshare.git
cd lanshare
docker-compose up -d
```

## 📋 文件结构

```
lanshare/
├── .github/workflows/docker-publish.yml  # GitHub Actions自动构建
├── backend/                              # 后端Flask应用
├── frontend/                           # 前端React应用
├── uploads/                           # 文件上传目录
├── data/                              # 数据库目�?├── Dockerfile                         # Docker镜像构建文件
├── docker-compose.yml                 # 本地开发配�?├── docker-compose-hub.yml             # Docker Hub生产配置
├── publish.sh                         # Docker Hub发布脚本
├── README.md                          # 项目文档
├── DEPLOY.md                          # 部署指南
└── PUBLISH.md                         # 发布说明
```

## 🔗 访问地址

- **GitHub**: https://github.com/Danborad/lanshare
- **Docker Hub**: https://hub.docker.com/r/Danborad/lanshare
- **演示地址**: http://localhost:7070

## 🎯 下一�?
1. **创建GitHub仓库**并推送代�?2. **注册Docker Hub账号**并发布镜�?3. **更新文档中的用户�?*为你的实际用户名
4. **测试一键部�?*确保所有功能正�?
## 📞 技术支�?
- **GitHub Issues**: 提交bug报告和功能请�?- **Docker Hub**: 镜像更新和问题反�?- **文档**: 完整的部署和使用指南
