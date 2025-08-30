# Docker 部署指南

## 🚀 快速部署

### 1. 获取你的宿主机IP地址
在部署前，你需要知道宿主机的局域网IP地址：

**Windows:**
```bash
ipconfig
```

**Linux/Mac:**
```bash
ip addr show  # 或 ifconfig
```

找到类似 `192.168.x.x` 的地址，这就是你的宿主机IP。

### 2. 使用 Docker Compose 部署

#### 方法一：使用预构建镜像（推荐）

1. 下载 `docker-compose-hub.yml`：
```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/Danborad/lanshare/master/docker-compose-hub.yml
```

2. 修改IP地址：
编辑 `docker-compose.yml`，将 `HOST_IP` 和 `DOCKER_HOST_IP` 改为你实际的宿主机IP：
```yaml
environment:
  - HOST_IP=192.168.1.100  # 改为你的IP
  - DOCKER_HOST_IP=192.168.1.100  # 改为你的IP
```

3. 启动服务：
```bash
docker-compose up -d
```

#### 方法二：本地构建

1. 克隆项目：
```bash
git clone https://github.com/Danborad/lanshare.git
cd lanshare
```

2. 修改 `docker-compose.yml` 中的IP地址

3. 构建并启动：
```bash
docker-compose up -d --build
```

### 3. 访问应用

部署完成后，通过以下方式访问：
- 本地访问：http://localhost:7070
- 局域网访问：http://[你的宿主机IP]:7070

## 🔧 IP地址配置详解

### 环境变量说明

| 变量名 | 作用 | 示例 |
|--------|------|------|
| `HOST_IP` | 宿主机真实IP，用于二维码生成 | `192.168.1.100` |
| `DOCKER_HOST_IP` | 局域网访问IP | `192.168.1.100` |
| `DOCKER_CONTAINER` | 标记为Docker环境 | `true` |

### 如何找到正确的IP

**示例输出：**
```bash
# Windows ipconfig
IPv4 地址 . . . . . . . . . . . . : 192.168.1.100

# Linux ip addr
inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic noprefixroute
```

## 📱 局域网访问测试

部署完成后，用手机或其他电脑测试：
1. 确保所有设备在同一局域网
2. 浏览器访问：http://[你的宿主机IP]:7070
3. 应该能看到正确的IP地址和二维码

## 🐛 常见问题解决

### 问题1：二维码显示localhost
**原因**：IP地址配置错误
**解决**：检查并修改 `HOST_IP` 环境变量

### 问题2：无法局域网访问
**原因**：防火墙阻止端口7070
**解决**：
- **Windows**: 允许7070端口通过防火墙
- **Linux**: `sudo ufw allow 7070`

### 问题3：ARM设备无法运行
**解决**：镜像已支持ARM64，直接使用即可

## 📊 验证部署成功

1. 访问调试页面：http://[你的IP]:7070/debug-test.html
2. 检查系统信息API：http://[你的IP]:7070/api/system/info
3. 确认返回的IP地址是正确的宿主机IP

## 🔄 更新版本

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose restart
```