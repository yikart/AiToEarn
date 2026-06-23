# AiToEarn Docker 部署指南

本指南帮助你使用 Docker Compose 快速部署完整的 AiToEarn 应用。

## 服务架构

```
                         ┌──────────┐
                         │  Nginx   │
                         │  :8080   │
                         └────┬─────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────┴─────┐  ┌─────┴──────┐  ┌─────┴─────┐
        │  Web (FE)  │  │  Server    │  │  AI       │
        │  :3000     │  │  :3002     │  │  :3010    │
        └────────────┘  └──────┬─────┘  └─────┬─────┘
                               │              │
                  ┌────────────┼──────────────┤
                  │            │              │
             ┌────┴─────┐ ┌───┴────┐  ┌──────┴───┐
             │ MongoDB  │ │ Redis  │  │  RustFS  │
             │ :27017   │ │ :6379  │  │ :9000/01 │
             └──────────┘ └────────┘  └──────────┘
```

| 服务 | 说明 | 端口 |
|------|------|------|
| **Nginx** | 反向代理，统一入口 | 8080 (对外) |
| **aitoearn-web** | Next.js 前端 | 3000 (内部) |
| **aitoearn-server** | NestJS 主后端 API | 3002 (内部) |
| **aitoearn-ai** | NestJS AI 服务 | 3010 (内部) |
| **MongoDB** | 数据库 | 27017 |
| **Redis** | 缓存/队列 | 6379 |
| **RustFS** | S3 兼容对象存储 | 9000 (API) / 9001 (控制台) |

## 前置要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **系统内存**: 建议 4GB+
- **磁盘空间**: 建议 20GB+

验证安装：

```bash
docker --version
docker compose version
```

---

## 🚀 3 分钟快速启动

只需 3 步，即可在本地跑起完整的 AiToEarn。

### 第 1 步：克隆并启动

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
docker compose up -d
```

首次启动会拉取镜像，可能需要几分钟。运行 `docker compose ps` 确认所有服务为 `healthy` 或 `running`。

### 第 2 步：打开界面

启动成功后，打开浏览器访问：**[http://localhost:8080](http://localhost:8080)**

> 首次启动会自动创建管理员账号并自动登录，无需手动注册。

### 第 3 步：配置 Relay 中继（强烈推荐）

> **为什么要配 Relay？**
>
> AiToEarn 需要登录你的社交媒体账号（抖音、小红书、TikTok 等）才能发布内容。这些平台要求 OAuth 开发者凭据才能授权登录。
>
> - **不配 Relay**：你需要自己去十几个平台逐一申请开发者账号，获取 client_id/secret，非常麻烦。
> - **配了 Relay**：借用官方 aitoearn.ai 的凭据完成授权，**一个 API Key 搞定所有平台**。

**配置方法**：

1. 在 [aitoearn.ai](https://aitoearn.ai)（国际）或 [aitoearn.cn](https://aitoearn.cn)（中国）注册登录，进入 **设置 → API Key**，创建一个 API Key
2. 在浏览器打开部署后的界面，进入 **配置管理**
3. 选择 **Server → Relay 中转**，配置发布平台授权使用的 Relay
4. 如需使用平台提供的 AI 模型，选择 **AI → Relay 中转** 并配置 AI Relay
5. OpenAI、Gemini、Anthropic 等模型服务商也可以在 **AI → 模型服务商** 中填写平台提供的 API Key 和 API 地址
6. 保存后点击 **保存并重启**，让对应服务重新加载配置

中国版 Key 搭配 `https://aitoearn.cn/api`，国际版 Key 搭配 `https://aitoearn.ai/api`；环境和 Key 不匹配会导致 401。

**到这里，你已经可以正常使用 AiToEarn 了！** 🎉

## 运维参考

### 自动登录

自动登录默认已启用。首次启动时，`aitoearn-init` 服务会生成管理员 token 并保存到共享卷中，`aitoearn-web` 服务自动读取该 token 完成登录。

### 镜像拉取策略

所有应用服务镜像使用 `pull_policy: always`，确保每次 `docker compose up` 都拉取最新镜像。

### 内部服务通信

以下配置用于服务间通信，使用 Docker 内部网络，通常无需修改：

| 配置项 | 所属服务 | 默认值 |
|------|----------|--------|
| `serverClient.baseUrl` | aitoearn-ai | `http://aitoearn-server:3002` |
| `aiClient.baseUrl` | aitoearn-server | `http://aitoearn-ai:3010` |

### 配置文件

配置文件以可写卷挂载到容器中，可通过配置管理界面修改，保存后需重启对应服务：

| 文件 | 挂载到 | 说明 |
|------|--------|------|
| `project/aitoearn-backend/apps/aitoearn-ai/config/config.yaml` | aitoearn-ai:/app/config.yaml | AI 服务配置 |
| `project/aitoearn-backend/apps/aitoearn-server/config/config.yaml` | aitoearn-server:/app/config.yaml | 后端配置 |

---

## 配置速查表

`aitoearn-ai` 和 `aitoearn-server` 不再通过 `docker-compose.yml` 的 `environment` 配置运行参数，统一读取挂载的 `config.yaml`，并通过配置管理界面修改。

### Compose 中仍保留的环境变量

| 变量 | 所属服务 | 说明 | 默认值 |
|------|----------|------|--------|
| `MONGO_INITDB_ROOT_PASSWORD` | mongodb | MongoDB root 密码 | `password` |
| `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` | rustfs | RustFS 访问凭证 | `rustfsadmin` |
| `MONGO_URI` / `JWT_SECRET` / `DB_NAME` / `AUTO_LOGIN_TOKEN_PATH` | aitoearn-init | 首次启动初始化管理员与自动登录 token | 内置默认值 |
| `NODE_ENV` / `NEXT_TELEMETRY_DISABLED` | aitoearn-web | Web 运行环境与 Next.js telemetry 设置 | `production` / `1` |
