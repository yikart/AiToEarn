# AiToEarn Docker 部署指南

本指南将帮助您使用 Docker Compose 快速部署完整的 AiToEarn 应用栈。

## 📋 前置要求

在开始之前，请确保您的系统已安装：

- **Docker**: 版本 20.10 或更高
- **Docker Compose**: 版本 2.0 或更高

验证安装：
```bash
docker --version
docker compose version
```

## 🚀 快速启动

### 1. 克隆仓库

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
```

### 2. 配置环境变量

复制环境变量模板文件并根据您的需求修改：

```bash
cp env.example .env
```

编辑 `.env` 文件，至少需要修改以下关键配置：

```bash
# 必须修改的安全配置
MONGODB_PASSWORD=your-secure-mongodb-password
REDIS_PASSWORD=your-secure-redis-password
JWT_SECRET=your-jwt-secret-key
INTERNAL_TOKEN=your-internal-token

# 如果需要外部访问，修改 API 地址
NEXT_PUBLIC_API_URL=http://your-domain.com:3002/api
APP_DOMAIN=your-domain.com
```

> ⚠️ **安全提示**: 请务必修改默认密码和密钥，不要在生产环境使用默认值！

### 3. 启动服务

使用 Docker Compose 启动所有服务：

```bash
docker compose up -d
```

首次启动会拉取镜像，可能需要几分钟时间。

### 4. 查看服务状态

```bash
docker compose ps
```

所有服务的状态应该显示为 `healthy` 或 `running`。

### 5. 查看日志

查看所有服务日志：
```bash
docker compose logs -f
```

查看特定服务的日志：
```bash
docker compose logs -f aitoearn-web
docker compose logs -f aitoearn-server
docker compose logs -f aitoearn-channel
```

## 🌐 访问应用

启动成功后，您可以通过以下地址访问各个服务：

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://localhost:3000 | Web 用户界面 |
| **主后端 API** | http://localhost:3002 | AiToEarn Server API |
| **频道服务 API** | http://localhost:7001 | AiToEarn Channel API |
| **MongoDB** | localhost:27017 | 数据库（需要认证） |
| **Redis** | localhost:6379 | 缓存服务（需要密码） |
