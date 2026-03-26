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

### 第 2 步：打开应用

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
2. 编辑 `docker-compose.yml`，在 `aitoearn-server` 服务的 `environment` 中添加：

```yaml
RELAY_SERVER_URL: https://aitoearn.ai/api
RELAY_API_KEY: 你的API-Key
RELAY_CALLBACK_URL: http://127.0.0.1:8080/api/plat/relay-callback
```

3. 重启服务：

```bash
docker compose restart aitoearn-server
```

**到这里，你已经可以正常使用 AiToEarn 了！** 🎉

以下是进阶配置，只在需要时参考。

---

## 进阶配置

### AI 服务配置

默认的 AI 密钥是占位值（`sk-placeholder`），应用可以正常启动，但 AI 功能（如 AI 文案、AI 评论等）会返回错误。

**推荐使用 [new-api](https://github.com/Calcium-Ion/new-api) 或 [one-api](https://github.com/songquanpeng/one-api) 等中继服务**，一个地址统一管理 OpenAI、Claude、Gemini 等所有模型。

在 `docker-compose.yml` 中配置（`aitoearn-ai` 和 `aitoearn-server` 两个服务都需要）：

```yaml
OPENAI_BASE_URL: https://your-new-api-host/v1
OPENAI_API_KEY: sk-your-new-api-key
```

### 生产环境安全配置

默认密码均为 `password`，**生产环境务必修改**。

> 💡 可使用 `openssl rand -hex 32` 生成随机字符串。

```yaml
# 1. mongodb 服务 — 修改数据库密码
MONGO_INITDB_ROOT_PASSWORD: your-secure-password

# 2. redis 服务 — 修改 Redis 密码
command: redis-server --requirepass your-secure-password

# 3. aitoearn-ai 服务
MONGODB_PASSWORD: your-secure-password        # 与 MongoDB 密码一致
REDIS_PASSWORD: your-secure-password          # 与 Redis 密码一致
JWT_SECRET: your-random-jwt-secret
INTERNAL_TOKEN: your-random-internal-token

# 4. aitoearn-server 服务（须与 aitoearn-ai 保持一致）
MONGODB_PASSWORD: your-secure-password
REDIS_PASSWORD: your-secure-password
JWT_SECRET: your-random-jwt-secret            # 须与 aitoearn-ai 一致
INTERNAL_TOKEN: your-random-internal-token    # 须与 aitoearn-ai 一致
APP_DOMAIN: your-domain.com                   # 改为你的公网域名
```

> ⚠️ MongoDB 密码出现在 `mongodb`、`aitoearn-ai`、`aitoearn-server` 三个服务中，修改时必须同步更新。

### 第三方平台 OAuth 配置（可选）

> 如果你已经配置了 Relay，以下内容**可以跳过**。只有不使用 Relay、需要直接对接各平台 OAuth 的用户才需要配置。

在 `docker-compose.yml` 的 `aitoearn-server` 服务中按需配置：

| 平台 | 变量 | 开发者后台 |
|------|------|-----------|
| Bilibili | `BILIBILI_CLIENT_ID/SECRET` | https://open.bilibili.com |
| Google | `GOOGLE_CLIENT_ID/SECRET` | https://console.cloud.google.com/apis/credentials |
| 快手 | `KWAI_CLIENT_ID/SECRET` | https://open.kuaishou.com |
| Pinterest | `PINTEREST_CLIENT_ID/SECRET` | https://developers.pinterest.com |
| TikTok | `TIKTOK_CLIENT_ID/SECRET` | https://developers.tiktok.com |
| Twitter/X | `TWITTER_CLIENT_ID/SECRET` | https://developer.x.com/en/portal |
| Facebook | `FACEBOOK_CLIENT_ID/SECRET`, `FACEBOOK_CONFIG_ID` | https://developers.facebook.com |
| Threads | `THREADS_CLIENT_ID/SECRET` | https://developers.facebook.com |
| Instagram | `INSTAGRAM_CLIENT_ID/SECRET` | https://developers.facebook.com |
| LinkedIn | `LINKEDIN_CLIENT_ID/SECRET` | https://www.linkedin.com/developers |
| YouTube | `YOUTUBE_CLIENT_ID/SECRET` | https://console.cloud.google.com/apis/credentials |
| 微信公众平台 | `WXPLAT_APP_ID/SECRET`, `WXPLAT_ENCODING_AES_KEY` | https://mp.weixin.qq.com |
| 抖音 | `DOYIN_CLIENT_ID/SECRET` | https://open.douyin.com |

OAuth 回调地址格式：`https://{APP_DOMAIN}/api/plat/{platform}/auth/back`

> 确保 `APP_DOMAIN` 已正确配置为你的公网域名。

### 对象存储配置（RustFS）

Docker Compose 内置了 [RustFS](https://github.com/rustfs/rustfs) 作为 S3 兼容对象存储，**开箱即用，无需额外配置**。

**RustFS 管理控制台**：http://localhost:9001
- 默认账号：`rustfsadmin`
- 默认密码：`rustfsadmin`

<details>
<summary>如需修改 RustFS 凭证或切换到外部 S3/OSS</summary>

修改凭证需同时更新以下位置：

1. `docker-compose.yml` 中 `rustfs` 服务的 `RUSTFS_ACCESS_KEY` 和 `RUSTFS_SECRET_KEY`
2. `docker-compose.yml` 中 `rustfs-init` 服务的 `entrypoint` 命令
3. `docker-compose.yml` 中 `aitoearn-ai` 和 `aitoearn-server` 服务的 `ASSETS_CONFIG`

`ASSETS_CONFIG` 格式（JSON），两个服务都需要设置：

```yaml
ASSETS_CONFIG: '{"provider":"s3","region":"us-east-1","bucketName":"aitoearn","endpoint":"http://rustfs.local:9000","publicEndpoint":"http://127.0.0.1:9000","cdnEndpoint":"http://127.0.0.1:8080/oss","accessKeyId":"rustfsadmin","secretAccessKey":"rustfsadmin","forcePathStyle":true}'
```

使用 AWS S3 示例：

```yaml
ASSETS_CONFIG: '{"provider":"s3","region":"ap-southeast-1","bucketName":"your-bucket","endpoint":"https://s3.ap-southeast-1.amazonaws.com","accessKeyId":"xxx","secretAccessKey":"xxx","cdnEndpoint":"https://your-cdn.com"}'
```

</details>

### 其他可选服务

| 变量 | 所属服务 | 说明 | 获取方式 |
|------|----------|------|----------|
| `MAIL_USER` / `MAIL_PASS` | aitoearn-server | 邮件服务（AWS SES SMTP） | AWS Console → SES → SMTP |
| `ALI_SMS_ACCESS_KEY_ID` 等 4 项 | aitoearn-server | 阿里云短信 | https://dysms.console.aliyun.com |

---

## 运维参考

### 自动登录

自动登录默认已启用。首次启动时，`aitoearn-init` 服务会生成管理员 token 并保存到共享卷中，`aitoearn-web` 服务自动读取该 token 完成登录。

### 镜像拉取策略

所有应用服务镜像使用 `pull_policy: always`，确保每次 `docker compose up` 都拉取最新镜像。

### 内部服务通信

以下变量用于服务间通信，使用 Docker 内部网络，通常无需修改：

| 变量 | 所属服务 | 默认值 |
|------|----------|--------|
| `SERVER_URL` | aitoearn-ai | `http://aitoearn-server:3002` |
| `AI_URL` | aitoearn-server | `http://aitoearn-ai:3010` |

### 配置文件

配置文件以只读卷挂载到容器中，修改后需重启对应服务：

| 文件 | 挂载到 | 说明 |
|------|--------|------|
| `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` | aitoearn-ai:/app/config.js | AI 服务配置 |
| `project/aitoearn-backend/apps/aitoearn-server/config/config.js` | aitoearn-server:/app/config.js | 后端配置 |

---

## 环境变量速查表

所有变量均在 `docker-compose.yml` 各服务的 `environment` 部分配置。

### 核心配置

| 变量 | 所属服务 | 说明 | 默认值 |
|------|----------|------|--------|
| `MONGO_INITDB_ROOT_PASSWORD` | mongodb | MongoDB root 密码 | `password` |
| `MONGODB_PASSWORD` | aitoearn-ai, aitoearn-server | MongoDB 连接密码 | `password` |
| `REDIS_PASSWORD` | aitoearn-ai, aitoearn-server | Redis 密码 | `password` |
| `JWT_SECRET` | aitoearn-ai, aitoearn-server | JWT 签名密钥 | `change-this-jwt-secret` |
| `INTERNAL_TOKEN` | aitoearn-ai, aitoearn-server | 内部服务通信 token | `change-this-secret-token` |
| `APP_DOMAIN` | aitoearn-server | 应用域名 | `localhost` |
| `ASSETS_CONFIG` | aitoearn-ai, aitoearn-server | 资源存储配置（JSON） | 内置 RustFS 配置 |

### Relay 中继

| 变量 | 所属服务 | 说明 |
|------|----------|------|
| `RELAY_SERVER_URL` | aitoearn-server | 中继服务器地址（`https://aitoearn.ai/api`） |
| `RELAY_API_KEY` | aitoearn-server | 你的 API Key |
| `RELAY_CALLBACK_URL` | aitoearn-server | OAuth 回调地址（`http://127.0.0.1:8080/api/plat/relay-callback`） |

### AI 服务

| 变量 | 说明 |
|------|------|
| `OPENAI_API_KEY` | OpenAI / 中转服务 API 密钥（两个服务都需要） |
| `OPENAI_BASE_URL` | API 地址（两个服务都需要） |
| `ANTHROPIC_API_KEY` | Anthropic Claude |
| `ANTHROPIC_BASE_URL` | Anthropic API 地址 |
| `VOLCENGINE_API_KEY` | 火山引擎（豆包） |
| `VOLCENGINE_ACCESS_KEY_ID` | 火山引擎 Access Key |
| `VOLCENGINE_SECRET_ACCESS_KEY` | 火山引擎 Secret Key |
| `VOLCENGINE_VOD_SPACE_NAME` | 火山引擎 VOD 空间 |
| `GROK_API_KEY` | xAI (Grok) |
| `AICSO_API_KEY` | AICSO 服务 |
| `AICSO_BASE_URL` | AICSO 地址 |
| `GEMINI_KEY_PAIRS` | Google Gemini（JSON 数组） |
| `GEMINI_LOCATION` | Gemini 区域（默认 `us-central1`） |
| `AI_PROXY_URL` | AI 代理地址（可选） |

`GEMINI_KEY_PAIRS` 格式：

```yaml
# 不使用 Gemini（默认）
GEMINI_KEY_PAIRS: '[]'

# 使用 Gemini
GEMINI_KEY_PAIRS: '[{"projectId":"your-project","apiKey":"your-key","bucket":"your-bucket"}]'
```

---

## AI 模型配置参考

AI 模型定义在 `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` 中配置。

### 对话模型（ai.models.chat）

| 模型 ID | 显示名称 | 输入 | 输出 |
|---------|----------|------|------|
| `gemini-3.1-pro-preview` | Gemini 3.1 Pro Preview | text/image/audio/video | text |
| `gemini-3-flash-preview` | Gemini 3 Flash Preview | text/image/audio/video | text |
| `gpt-5.1-all` | GPT 5.1 | text/image | text |
| `gpt-5` | GPT 5 | text/image | text |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | text/image | image |
| `gemini-3-pro-image-preview` | Nano Banana Pro | text/image | image |
| `claude-opus-4-5-20251101` | Claude Opus 4.5 | text/image | text |
| `claude-opus-4-6` | Claude Opus 4.6 | text/image | text |
| `claude-sonnet-4-5-20250929` | Claude Sonnet 4.5 | text/image | text |
| `gemini-2.5-flash` | Gemini 2.5 Flash | text/image/audio/video | text |

### 图片模型（ai.models.image）

| 模型 ID | 支持尺寸 | 质量选项 | 编辑最大输入图片数 |
|---------|----------|----------|-------------------|
| `gpt-image-1.5` | 1024x1024, 1536x1024, 1024x1536, auto | high, medium, low | 16（仅编辑模式） |

### 视频模型（ai.models.video.generation）

| 模型 ID | 显示名称 | 生成模式 | 分辨率 | 时长 | 宽高比 |
|---------|----------|----------|--------|------|--------|
| `grok-imagine-video` | Grok Video | text/image/video → video | 720p | 1-15 秒 | 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 |
| `grok-video-3-15s` | Grok Video 15s | text/image → video | 720p | 15 秒 | 2:3, 3:2, 1:1 |
| `veo3.1-components-4k` | Veo 3.1 4K | text/image → video | 4k | 8 秒 | 9:16, 16:9, 1:1 |
| `veo3.1-components` | Veo 3.1 | text/image → video | 720p | 8 秒 | 9:16, 16:9, 1:1 |

### 草稿生成图片模型（ai.draftGeneration.imageModels）

| 模型 ID | 显示名称 | 支持宽高比 | 最大输入图片数 |
|---------|----------|-----------|---------------|
| `gemini-3.1-flash-image-preview` | NanoBanana 2 | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 | 14 |
| `gemini-3-pro-image-preview` | NanoBanana Pro | 同上 | 14 |

定价按分辨率（1K/2K/4K），默认均为 `0`（免费）。
