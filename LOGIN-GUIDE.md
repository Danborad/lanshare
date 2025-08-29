# 🔐 GitHub & Docker Hub 登录指南

## 🚀 快速开始

### 1. 获取你的用户名

#### GitHub用户名
- 登录：https://github.com
- 点击右上角头像 → Settings
- 用户名显示在左侧（如：your-username）

#### Docker Hub用户名
- 登录：https://hub.docker.com
- 点击右上角头像 → Account Settings
- 用户名显示在Profile页面

### 2. 运行配置脚本

#### Windows用户
```cmd
# 双击运行或命令行执行
setup-publish.bat
```

#### Linux/Mac用户
```bash
# 运行配置脚本
chmod +x setup-publish.sh
./setup-publish.sh
```

### 3. 手动配置（如果脚本不适用）

#### 替换用户名

1. **编辑配置文件**（用你的实际用户名替换）

```bash
# 用你的用户名替换以下文件中的占位符
# 例如：your-username → johndoe

# 文件列表：
docker-compose-hub.yml
publish.sh
README.md
DEPLOY.md
PUBLISH.md
```

2. **一键替换命令**

```bash
# Linux/Mac
sed -i 's/your-username/你的实际用户名/g' *.yml *.sh *.md

# Windows (PowerShell)
(Get-Content docker-compose-hub.yml) -replace 'your-username', '你的实际用户名' | Set-Content docker-compose-hub.yml
```

### 4. 登录步骤

#### Docker Hub登录
```bash
# 命令行登录
docker login
# 输入用户名和密码
```

#### GitHub登录（推送代码）
```bash
# 1. 创建仓库：https://github.com/new
# 2. 仓库名：lanshare（或你喜欢的名字）
# 3. 执行以下命令：
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin master
```

### 5. 发布Docker镜像

```bash
# 登录Docker Hub后
./publish.sh v1.0.0
```

## 📋 验证配置

### 检查Docker登录状态
```bash
docker info | findstr Username
```

### 检查Git配置
```bash
git remote -v
```

## 🎯 完成后用户部署命令

```bash
# 用户一键部署（替换为你的实际用户名）
mkdir lanshare && cd lanshare
curl -o docker-compose.yml https://raw.githubusercontent.com/你的用户名/lanshare/main/docker-compose-hub.yml
docker-compose up -d
```

## ❗ 常见问题

### Docker登录失败
- 确保Docker Desktop正在运行
- 检查网络连接
- 重置密码：https://hub.docker.com/reset-password

### Git推送失败
- 检查仓库是否已创建
- 确认用户名和密码正确
- 使用token：https://github.com/settings/tokens

### 用户名错误
- 重新运行配置脚本
- 或手动编辑配置文件

## 📞 支持

如有问题，请检查：
1. Docker Hub：https://hub.docker.com/support
2. GitHub：https://docs.github.com/en
3. 项目文档：查看PUBLISH.md