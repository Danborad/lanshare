# LanShare 快速启动指南

## 🚀 一键启动（已配置好IP）

现在所有docker-compose文件都已配置好局域网IP，可以直接启动：

```bash
# 使用默认配置
docker-compose up

# 或者使用生产配置
docker-compose -f docker-compose-ready.yml up
```

## 📍 当前配置

- **IP地址**: 192.168.1.100
- **端口**: 7070
- **访问地址**: http://192.168.1.100:7070

## 🔄 修改IP地址

如果需要使用不同的IP地址，只需修改以下文件中的 `192.168.1.100`：

1. `docker-compose.yml`
2. `docker-compose-hub.yml` 
3. `docker-compose-ready.yml`

例如，改为 192.168.0.123：

```yaml
environment:
  - HOST_IP=192.168.0.123
  - DOCKER_HOST_IP=192.168.0.123
```

## 🎯 验证启动成功

1. 打开浏览器访问：http://localhost:7070
2. 检查右侧IP显示是否为 192.168.1.100
3. 二维码应该显示正确的局域网地址

## 📝 查看日志

```bash
docker-compose logs -f lanshare
```