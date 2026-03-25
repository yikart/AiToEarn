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

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
```

### 2. 配置环境变量

所有环境变量直接在 `docker-compose.yml` 文件中配置。**所有配置项都已提供默认值，无需修改即可直接启动应用。**

生产环境部署时，建议修改以下安全相关配置：

```yaml
# 1. mongodb 服务 — 修改数据库密码
MONGO_INITDB_ROOT_PASSWORD: your-secure-password

# 2. redis 服务 — 修改 Redis 密码
command: redis-server --requirepass your-secure-password

# 3. aitoearn-ai 服务 — 修改以下变量
MONGODB_PASSWORD: your-secure-password        # 与上面 MongoDB 密码一致
REDIS_PASSWORD: your-secure-password          # 与上面 Redis 密码一致
JWT_SECRET: your-random-jwt-secret
INTERNAL_TOKEN: your-random-internal-token

# 4. aitoearn-server 服务 — 修改以下变量（须与 aitoearn-ai 保持一致）
MONGODB_PASSWORD: your-secure-password
REDIS_PASSWORD: your-secure-password
JWT_SECRET: your-random-jwt-secret            # 须与 aitoearn-ai 一致
INTERNAL_TOKEN: your-random-internal-token    # 须与 aitoearn-ai 一致
APP_DOMAIN: your-domain.com                   # 生产环境改为你的域名
```

> **注意**: 修改密码时，必须同步更新所有引用该密码的服务。例如 MongoDB 密码出现在 `mongodb`、`aitoearn-ai`、`aitoearn-server` 三个服务中。
>
> 可以使用 `openssl rand -hex 32` 生成随机字符串。

### 3. 配置应用配置文件

配置文件位于各应用的 `config/` 子目录中，以只读卷挂载到容器中：

| 文件 | 挂载到 | 说明 |
|------|--------|------|
| `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` | aitoearn-ai:/app/config.js | AI 服务配置（AI 模型定义、存储配置） |
| `project/aitoearn-backend/apps/aitoearn-server/config/config.js` | aitoearn-server:/app/config.js | 后端配置（OAuth 回调、邮件、存储配置） |

这些配置文件从 `process.env`（由 docker-compose.yml 设置）读取环境变量，同时包含一些硬编码配置（存储端点、AI 模型列表等）。

**如需修改 RustFS 凭证或切换到外部 S3/OSS**，需同时更新两个 config.js 文件中的 `assets` 配置部分，或通过 `ASSETS_CONFIG` 环境变量覆盖（见下文）。

### 4. 启动服务

```bash
docker compose up -d
```

首次启动会拉取镜像，可能需要几分钟。

### 5. 检查状态

```bash
docker compose ps
```

所有服务应显示 `healthy` 或 `running` 状态。

### 6. 访问应用

| 地址 | 说明 |
|------|------|
| http://localhost:8080 | Web 前端（通过 Nginx） |
| http://localhost:8080/api/ | 后端 API（通过 Nginx） |
| http://localhost:8080/_nhealth | Nginx 健康检查 |
| http://localhost:9001 | RustFS 对象存储控制台 |

## 环境变量详细说明

以下变量均在 `docker-compose.yml` 各服务的 `environment` 部分配置。

### 核心配置

以下变量均已提供可用的默认值，应用可直接启动。生产环境建议修改密码和密钥。

| 变量 | 所属服务 | 说明 | 默认值 |
|------|----------|------|--------|
| `MONGO_INITDB_ROOT_PASSWORD` | mongodb | MongoDB root 密码 | `password` |
| `MONGODB_PASSWORD` | aitoearn-ai, aitoearn-server | MongoDB 连接密码（须与上面一致） | `password` |
| `REDIS_PASSWORD` | aitoearn-ai, aitoearn-server | Redis 密码（须与 redis 服务 `--requirepass` 一致） | `password` |
| `JWT_SECRET` | aitoearn-ai, aitoearn-server | JWT 签名密钥 | `change-this-jwt-secret` |
| `INTERNAL_TOKEN` | aitoearn-ai, aitoearn-server | 内部服务通信 token | `change-this-secret-token` |
| `APP_DOMAIN` | aitoearn-server | 应用域名（用于 OAuth 回调地址） | `localhost` |
| `ASSETS_CONFIG` | aitoearn-ai, aitoearn-server | 资源存储配置（JSON 格式，见上文） | 内置 RustFS 配置 |

### 内部服务通信

以下变量用于服务间通信，使用 Docker 内部网络，通常无需修改。

| 变量 | 所属服务 | 说明 | 默认值 |
|------|----------|------|--------|
| `SERVER_URL` | aitoearn-ai | AI 服务访问后端的地址 | `http://aitoearn-server:3002` |
| `AI_URL` | aitoearn-server | 后端访问 AI 服务的地址 | `http://aitoearn-ai:3010` |

### 资源存储配置（RustFS）

Docker Compose 内置了 [RustFS](https://github.com/rustfs/rustfs) 作为 S3 兼容对象存储，**开箱即用，无需额外配置**。

启动后会自动创建 `aitoearn` 存储桶，应用服务通过内部网络 `http://rustfs.local:9000` 访问。

**RustFS 管理控制台**：http://localhost:9001
- 默认账号：`rustfsadmin`
- 默认密码：`rustfsadmin`

如需修改 RustFS 凭证，需要同时更新以下位置：

1. `docker-compose.yml` 中 `rustfs` 服务的 `RUSTFS_ACCESS_KEY` 和 `RUSTFS_SECRET_KEY`
2. `docker-compose.yml` 中 `rustfs-init` 服务的 `entrypoint` 命令（`mc alias set` 中的凭证）
3. `docker-compose.yml` 中 `aitoearn-ai` 和 `aitoearn-server` 服务的 `ASSETS_CONFIG` 环境变量

**`ASSETS_CONFIG` 环境变量**（JSON 格式）用于配置资源存储，在 `aitoearn-ai` 和 `aitoearn-server` 两个服务中都需要设置：

```yaml
ASSETS_CONFIG: '{"provider":"s3","region":"us-east-1","bucketName":"aitoearn","endpoint":"http://rustfs.local:9000","publicEndpoint":"http://127.0.0.1:9000","cdnEndpoint":"http://127.0.0.1:8080/oss","accessKeyId":"rustfsadmin","secretAccessKey":"rustfsadmin","forcePathStyle":true}'
```

**生产环境**如使用 AWS S3 或阿里云 OSS，更新 `ASSETS_CONFIG` 或两个 config.js 文件中的 `assets` 配置：

```yaml
# docker-compose.yml 中（AWS S3 示例）
ASSETS_CONFIG: '{"provider":"s3","region":"ap-southeast-1","bucketName":"your-bucket","endpoint":"https://s3.ap-southeast-1.amazonaws.com","accessKeyId":"xxx","secretAccessKey":"xxx","cdnEndpoint":"https://your-cdn.com"}'
```

### AI 服务配置

**推荐使用 new-api / one-api 等中转服务**统一管理所有 AI 模型。通过中转服务，只需一个 API 地址和密钥就可以访问 OpenAI、Claude、Gemini 等多种模型。

常用中转服务：
- [new-api](https://github.com/Calcium-Ion/new-api) - 支持多种模型的 API 中转
- [one-api](https://github.com/songquanpeng/one-api) - OpenAI 接口管理和分发系统

部署中转服务后，在 `docker-compose.yml` 中配置：

```yaml
# aitoearn-ai 和 aitoearn-server 服务中
OPENAI_BASE_URL: https://your-new-api-host/v1
OPENAI_API_KEY: sk-your-new-api-key
```

> 默认提供 `sk-placeholder` 占位值，应用可以正常启动，但 AI 功能在实际调用时会返回错误。

所有支持的 AI 服务（均在 `aitoearn-ai` 服务中配置）：

| 变量 | 服务 | 说明 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI / 中转服务 | API 密钥（aitoearn-ai 和 aitoearn-server 都需要） |
| `OPENAI_BASE_URL` | API 地址 | 中转服务地址或 `https://api.openai.com/v1`（两个服务都需要） |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) | 可通过中转服务访问 |
| `ANTHROPIC_BASE_URL` | Anthropic API 地址 | 默认 `https://api.anthropic.com` |
| `VOLCENGINE_API_KEY` | 火山引擎（豆包） | https://console.volcengine.com/ark |
| `VOLCENGINE_ACCESS_KEY_ID` | 火山引擎 | Access Key ID |
| `VOLCENGINE_SECRET_ACCESS_KEY` | 火山引擎 | Secret Access Key |
| `VOLCENGINE_VOD_SPACE_NAME` | 火山引擎 | VOD 空间名称 |
| `GROK_API_KEY` | xAI (Grok) | https://console.x.ai |
| `AICSO_API_KEY` | AICSO | AICSO 服务 API 密钥 |
| `AICSO_BASE_URL` | AICSO | AICSO 服务地址 |
| `GEMINI_KEY_PAIRS` | Google Gemini | JSON 数组格式 |
| `GEMINI_LOCATION` | Google Gemini | 默认 `us-central1` |
| `AI_PROXY_URL` | AI 代理 | 可选，用于代理访问 AI API |

`GEMINI_KEY_PAIRS` 格式为 JSON 数组，默认为 `'[]'`（空数组）：

```yaml
# 默认值（不使用 Gemini）
GEMINI_KEY_PAIRS: '[]'

# 配置 Gemini 示例
GEMINI_KEY_PAIRS: '[{"projectId":"your-gcp-project-id","apiKey":"your-gemini-api-key","bucket":"your-bucket"}]'
```

AI 模型的具体定义（可用模型列表、定价等）在 `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` 中配置。

### 第三方平台 OAuth 配置（可选）

按需在 `docker-compose.yml` 的 `aitoearn-server` 服务中配置社交媒体平台的 OAuth 凭证。

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

**OAuth 回调地址格式**：`https://{APP_DOMAIN}/api/plat/{platform}/auth/back`

> 确保 `APP_DOMAIN` 已正确配置为你的公网域名，否则 OAuth 回调将无法正常工作。

### 其他可选服务

| 变量 | 所属服务 | 说明 | 获取方式 |
|------|----------|------|----------|
| `MAIL_USER` / `MAIL_PASS` | aitoearn-server | 邮件服务（AWS SES SMTP） | AWS Console → SES → SMTP |
| `ALI_SMS_ACCESS_KEY_ID` 等 4 项 | aitoearn-server | 阿里云短信 | https://dysms.console.aliyun.com |

### 自动登录

自动登录默认已启用。首次启动时，`aitoearn-init` 服务会生成管理员 token 并保存到共享卷中。`aitoearn-web` 服务会自动读取该 token，无需手动登录。

### 镜像拉取策略

Docker Compose 中所有应用服务镜像使用 `pull_policy: always`，确保每次 `docker compose up` 都拉取最新镜像：

```yaml
services:
  aitoearn-web:
    image: aitoearn/aitoearn-web:latest
    pull_policy: always
  aitoearn-server:
    image: aitoearn/aitoearn-server:latest
    pull_policy: always
  aitoearn-ai:
    image: aitoearn/aitoearn-ai:latest
    pull_policy: always
```

## 配置文件参考

以下是各应用配置文件的完整说明。这些文件以只读卷挂载到容器中，修改后需重启对应服务。

### project/aitoearn-backend/apps/aitoearn-ai/config/config.js

AI 服务的完整配置文件，挂载到 `aitoearn-ai:/app/config.js`。

#### 基础配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `port` | 服务监听端口 | `3010` |
| `logger.console.enable` | 是否启用控制台日志 | `true` |
| `logger.console.level` | 日志级别 | `debug` |
| `logger.console.pretty` | 是否格式化日志输出 | `false` |

#### 数据库与缓存

从环境变量读取，通常无需在配置文件中修改。

| 配置项 | 说明 | 来源 |
|--------|------|------|
| `redis` | Redis 连接配置（host/port/password） | 环境变量 `REDIS_HOST/PORT/PASSWORD` |
| `redlock` | 分布式锁 Redis 配置 | 同 redis |
| `mongodb.uri` | MongoDB 连接 URI | 环境变量拼接 |
| `mongodb.dbName` | 数据库名称 | `aitoearn` |

#### 认证配置

| 配置项 | 说明 | 来源 |
|--------|------|------|
| `auth.secret` | JWT 签名密钥 | 环境变量 `JWT_SECRET` |
| `auth.expiresIn` | JWT 过期时间（秒） | `604800`（7 天） |
| `auth.internalToken` | 内部服务通信 token | 环境变量 `INTERNAL_TOKEN` |

#### 服务间通信

| 配置项 | 说明 | 来源 |
|--------|------|------|
| `serverClient.baseUrl` | 访问后端服务的地址 | 环境变量 `SERVER_URL` |
| `serverClient.token` | 服务通信 token | 环境变量 `INTERNAL_TOKEN` |

#### 资源存储（assets）

**需要手动修改**。默认配置指向内置 RustFS：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `assets.provider` | 存储提供商 | `s3` |
| `assets.region` | 存储区域 | `us-east-1` |
| `assets.bucketName` | 存储桶名称 | `aitoearn` |
| `assets.endpoint` | 存储端点 | `http://rustfs.local:9000` |
| `assets.accessKeyId` | 访问密钥 ID | `rustfsadmin` |
| `assets.secretAccessKey` | 访问密钥 | `rustfsadmin` |
| `assets.cdnEndpoint` | CDN 地址（可选） | 无 |

#### AI 服务提供商

各 AI 服务的连接配置，从环境变量读取：

| 配置项 | 说明 |
|--------|------|
| `ai.openai` | OpenAI 配置（baseUrl、apiKey），支持 `AI_PROXY_URL` 代理 |
| `ai.anthropic` | Anthropic Claude 配置（baseUrl、apiKey），支持代理 |
| `ai.grok` | xAI Grok 配置（baseUrl 固定为 `https://api.x.ai`，apiKey），支持代理 |
| `ai.volcengine` | 火山引擎配置（baseUrl、apiKey、accessKeyId、secretAccessKey、spaceName） |
| `ai.gemini` | Google Gemini 配置（keyPairs、location、apiKey），支持代理 |
| `ai.aicso` | AICSO 配置（apiKey、baseUrl） |

#### 视频 AI 功能定价（ai.aideo）

各视频 AI 功能的定价配置（单位：分/分钟），默认均为 `0`（免费）：

| 配置项 | 说明 |
|--------|------|
| `ai.aideo.vCreative.basePrice` | AI 视频编辑（720P） |
| `ai.aideo.vision.basePrice` | 视频理解 |
| `ai.aideo.highlight.basePrice` | 高光智能剪辑 |
| `ai.aideo.aiTranslation.facialTranslation` | 面部翻译 |
| `ai.aideo.erase.basePrice` | AI 字幕去除 |
| `ai.aideo.videoEdit.basePrice` | 视频编辑（720P） |
| `ai.aideo.dramaRecap.basePrice` | 剧情回顾 |
| `ai.aideo.styleTransfer.basePrice` | 视频风格迁移 |

#### AI 对话模型（ai.models.chat）

定义可用的 AI 对话模型列表。每个模型包含：

| 字段 | 说明 |
|------|------|
| `name` | 模型 ID（API 调用时使用） |
| `description` | 模型显示名称 |
| `inputModalities` | 输入类型（`text`、`image`、`audio`、`video`） |
| `outputModalities` | 输出类型（`text`、`image`） |
| `pricing.tiers` | 分层定价（按 input/output token 计费） |

默认配置的对话模型：

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

#### AI 图片模型（ai.models.image）

**图片生成（generation）和图片编辑（edit）**模型：

| 模型 ID | 支持尺寸 | 质量选项 | 编辑最大输入图片数 |
|---------|----------|----------|-------------------|
| `gpt-image-1.5` | 1024x1024, 1536x1024, 1024x1536, auto | high, medium, low | 16（仅编辑模式） |

#### AI 视频模型（ai.models.video.generation）

| 模型 ID | 显示名称 | 渠道 | 生成模式 | 分辨率 | 时长范围 | 宽高比 |
|---------|----------|------|----------|--------|----------|--------|
| `grok-imagine-video` | Grok Video | grok | text2video, image2video, video2video | 720p | 1-15 秒 | 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 |
| `grok-video-3-15s` | Grok Video 15s | aicso-grok | text2video, image2video | 720p | 15 秒 | 2:3, 3:2, 1:1 |
| `veo3.1-components-4k` | Veo 3.1 4K | aicso-veo | text2video, image2video | 4k | 8 秒 | 9:16, 16:9, 1:1 |
| `veo3.1-components` | Veo 3.1 | aicso-veo | text2video, image2video | 720p | 8 秒 | 9:16, 16:9, 1:1 |

#### 草稿生成图片模型（ai.draftGeneration.imageModels）

| 模型 ID | 显示名称 | 支持宽高比 | 最大输入图片数 |
|---------|----------|-----------|---------------|
| `gemini-3.1-flash-image-preview` | NanoBanana 2 | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 | 14 |
| `gemini-3-pro-image-preview` | NanoBanana Pro | 同上 | 14 |

定价按分辨率计费（1K/2K/4K），默认均为 `0`。

#### Agent 配置

| 配置项 | 说明 | 来源 |
|--------|------|------|
| `agent.baseUrl` | Agent API 地址 | 基于 `OPENAI_BASE_URL` + `/messages`，支持代理 |
| `agent.apiKey` | Agent API 密钥 | 环境变量 `OPENAI_API_KEY` |

---

### project/aitoearn-backend/apps/aitoearn-server/config/config.js

后端服务的完整配置文件，挂载到 `aitoearn-server:/app/config.js`。

#### 基础配置

| 配置项 | 说明 | 默认值/来源 |
|--------|------|-------------|
| `appDomain` | 应用域名 | 环境变量 `APP_DOMAIN` |
| `port` | 服务监听端口 | `3002` |
| `environment` | 运行环境 | 环境变量 `NODE_ENV` |
| `enableBadRequestDetails` | 是否返回请求错误详情 | `true` |

#### 认证、日志、数据库、缓存

与 aitoearn-ai.config.js 相同的配置结构，从环境变量读取。

#### 平台集成配置（channel）

**channel.channelDb** — 平台数据独立数据库：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `channelDb.uri` | MongoDB 连接 URI | 与主数据库相同 |
| `channelDb.dbName` | 数据库名称 | `aitoearn_channel` |

**channel.moreApi** — 外部平台 API：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `moreApi.platApiUri` | 平台 API 地址 | `https://platapi.yikart.cn` |
| `moreApi.xhsCreatorUri` | 小红书创作者 API | `http://39.106.41.190:7008` |

**channel.shortLink** — 短链接服务：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `shortLink.baseUrl` | 短链接基础 URL | `https://{APP_DOMAIN}/api/shortLink/` |

**各平台 OAuth 配置** — 每个平台的 OAuth 回调地址由 `APP_DOMAIN` 自动拼接：

| 平台 | 回调地址格式 | 特殊配置 |
|------|-------------|----------|
| Bilibili | `https://{APP_DOMAIN}/api/plat/bilibili/auth/back` | — |
| Google | 通过 Google SDK 处理 | — |
| Google Business | `https://{APP_DOMAIN}/api/plat/google-business/auth/callback` | 需单独配置 clientId/clientSecret |
| 快手 | `https://{APP_DOMAIN}/api/plat/kwai/auth/back` | — |
| Pinterest | `https://{APP_DOMAIN}/api/plat/pinterest/authWebhook` | `baseUrl`: `https://api.pinterest.com`，支持 `test_authorization` |
| TikTok | `https://{APP_DOMAIN}/api/plat/tiktok/auth/back` | 含推广回调和 scopes 配置 |
| Twitter | `https://{APP_DOMAIN}/api/plat/twitter/auth/back` | — |
| Facebook | `https://{APP_DOMAIN}/api/plat/meta/auth/back` | 含 `configId` 和 scopes |
| Threads | `https://{APP_DOMAIN}/api/plat/meta/auth/back` | 独立的 clientId/Secret，含 scopes |
| Instagram | `https://{APP_DOMAIN}/api/plat/meta/auth/back` | 含推广回调和 scopes |
| LinkedIn | `https://{APP_DOMAIN}/api/plat/meta/auth/back` | scopes: openid, profile, email, w_member_social |
| 微信公众平台 | `https://{APP_DOMAIN}/platcallback` | 含 token 和 encodingAESKey |
| YouTube | `https://{APP_DOMAIN}/api/plat/youtube/auth/callback` | — |
| 抖音 | `https://{APP_DOMAIN}/api/plat/douyin/auth/back` | — |

#### 资源存储（assets）

与 aitoearn-ai config.js 中的 `assets` 配置相同，两处需保持一致。也可通过 `ASSETS_CONFIG` 环境变量统一覆盖。

#### 邮件配置（mail）

| 配置项 | 说明 | 默认值/来源 |
|--------|------|-------------|
| `mail.transport.host` | SMTP 主机 | `email-smtp.ap-southeast-1.amazonaws.com` |
| `mail.transport.port` | SMTP 端口 | `587` |
| `mail.transport.secure` | 是否使用 TLS | `false`（STARTTLS） |
| `mail.transport.auth.user` | SMTP 用户名 | 环境变量 `MAIL_USER` |
| `mail.transport.auth.pass` | SMTP 密码 | 环境变量 `MAIL_PASS` |
| `mail.defaults.from` | 默认发件人地址 | `noreply@tx.aitoearn.ai` |

如需更换邮件服务商（如 SendGrid、Mailgun），修改 `mail.transport` 中的 host/port 配置。

#### 阿里云短信（aliSms）

| 配置项 | 说明 | 来源 |
|--------|------|------|
| `aliSms.accessKeyId` | 阿里云 AccessKey ID | 环境变量 `ALI_SMS_ACCESS_KEY_ID` |
| `aliSms.accessKeySecret` | 阿里云 AccessKey Secret | 环境变量 `ALI_SMS_ACCESS_KEY_SECRET` |
| `aliSms.signName` | 短信签名 | 环境变量 `ALI_SMS_SIGN_NAME` |
| `aliSms.templateCode` | 短信模板代码 | 环境变量 `ALI_SMS_TEMPLATE_CODE` |

#### 内部服务通信

| 配置项 | 说明 | 来源 |
|--------|------|------|
| `aiClient.baseUrl` | 访问 AI 服务的地址 | 环境变量 `AI_URL` |
| `aiClient.token` | 服务通信 token | 环境变量 `INTERNAL_TOKEN` |

#### Relay 配置（可选）

Relay 允许自部署实例通过官方 AiToEarn 中继服务器连接社交媒体平台账号，无需自行配置各平台的 OAuth 凭据。

**配置步骤：**

1. 在 [https://aitoearn.ai](https://aitoearn.ai) 的 **设置 → API Key** 中创建一个 API Key。
2. 在 `docker-compose.yml` 的 `aitoearn-server` 服务中配置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `RELAY_SERVER_URL` | Relay 服务器地址 | `https://aitoearn.ai/api` |
| `RELAY_API_KEY` | 你的 API Key（第 1 步创建） | 无 |
| `RELAY_CALLBACK_URL` | 本地回调地址，用于接收中继结果 | `http://127.0.0.1:8080/api/plat/relay-callback` |

```yaml
RELAY_SERVER_URL: https://aitoearn.ai/api
RELAY_API_KEY: 你的API-Key
RELAY_CALLBACK_URL: http://127.0.0.1:8080/api/plat/relay-callback
```

## 常用命令

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 查看服务状态
docker compose ps

# 查看所有日志
docker compose logs -f

# 查看指定服务日志
docker compose logs -f aitoearn-web
docker compose logs -f aitoearn-server
docker compose logs -f aitoearn-ai

# 重启单个服务
docker compose restart aitoearn-server

# 修改配置文件后重启相关服务
docker compose restart aitoearn-ai aitoearn-server

# 重新创建服务（修改 docker-compose.yml 后）
docker compose down && docker compose up -d

# 清理所有数据（危险！）
docker compose down -v
```

## 数据持久化

以下数据通过 Docker Volume 持久化：

| Volume | 说明 |
|--------|------|
| `mongodb-data` | MongoDB 数据文件 |
| `mongodb-config` | MongoDB 配置文件 |
| `redis-data` | Redis 持久化数据 |
| `rustfs-data` | RustFS 对象存储数据 |

停止服务（`docker compose down`）不会删除数据。只有 `docker compose down -v` 才会删除 Volume 数据。

## 生产环境部署建议

### HTTPS 配置

生产环境建议在 Nginx 前再加一层 HTTPS 反向代理（如 Caddy 或 Certbot + Nginx），或修改 `nginx/nginx.conf` 添加 SSL 配置：

```bash
# 方式一：使用 Caddy（推荐，自动 HTTPS）
# 在 docker-compose.yml 中替换 nginx 服务为 caddy

# 方式二：使用 Let's Encrypt
# 将证书挂载到 nginx 容器中
```

### 安全建议

1. **在 docker-compose.yml 中修改所有默认密码和密钥**
2. 不要在生产环境暴露 MongoDB（27017）和 Redis（6379）端口
3. 配置防火墙，仅允许 8080/443 端口
4. 定期备份 MongoDB 数据

### 备份

```bash
# 备份 MongoDB
docker exec aitoearn-mongodb mongodump --uri="mongodb://admin:your-password@localhost:27017" --out=/dump
docker cp aitoearn-mongodb:/dump ./backup/

# 恢复 MongoDB
docker cp ./backup/dump aitoearn-mongodb:/dump
docker exec aitoearn-mongodb mongorestore --uri="mongodb://admin:your-password@localhost:27017" /dump
```

## 常见问题

### Q: 如何从源码构建镜像？

如果你需要从源码构建 Docker 镜像（而非使用预构建镜像），可以使用项目自带的构建脚本：

```bash
bash scripts/build.sh
```

该脚本会：
1. 使用 Nx 构建后端项目（aitoearn-server、aitoearn-ai）
2. 使用 Dockerfile 构建前端项目（aitoearn-web）
3. 将所有镜像 tag 为 `aitoearn/*:latest`

构建完成后，正常使用 `docker compose up -d` 启动即可。

> 前置要求：需要安装 Node.js 和 pnpm，并在 `project/aitoearn-backend` 目录下执行过 `pnpm install`。

### Q: 配置文件有什么作用？

各应用的 `config/` 子目录包含应用配置文件：

- **project/aitoearn-backend/apps/aitoearn-ai/config/config.js**: AI 服务的详细配置，包含 AI 模型定义（可用模型列表、定价）、存储配置、Gemini 设置等
- **project/aitoearn-backend/apps/aitoearn-server/config/config.js**: 后端服务配置，包含 OAuth 回调地址模式、邮件传输设置、存储配置等

这些文件以只读卷挂载到容器中，修改后需重启对应服务：`docker compose restart aitoearn-ai aitoearn-server`

### Q: 如何修改或添加 AI 模型？

编辑 `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` 中的 `ai.models` 部分，可以修改可用模型列表、定价和模型参数。修改后重启 AI 服务：

```bash
docker compose restart aitoearn-ai
```

### Q: 服务启动失败，提示端口被占用？

检查 8080、27017、6379 端口是否被其他程序占用：

```bash
lsof -i :8080
lsof -i :27017
lsof -i :6379
```

### Q: 前端页面加载但 API 请求失败？

1. 检查 Nginx 是否正常运行：`docker compose logs nginx`
2. 检查后端服务是否健康：`docker compose ps`

### Q: OAuth 登录回调失败？

1. 确认 `docker-compose.yml` 中 `aitoearn-server` 服务的 `APP_DOMAIN` 配置为你的公网域名（不是 localhost）
2. 在各平台开发者后台配置正确的回调地址
3. 确保域名已备案且 HTTPS 配置正确

### Q: AI 功能不可用？

1. 确认 `docker-compose.yml` 中 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL` 已正确配置
2. 推荐部署 [new-api](https://github.com/Calcium-Ion/new-api) 中转服务统一管理所有 AI 模型
3. 默认的 `sk-placeholder` 仅作为占位值，不会调通任何 AI 服务
4. AI 模型的配置在 `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` 中，确认模型定义与你的 API 服务匹配

### Q: 如何更新到最新版本？

```bash
docker compose pull
docker compose down && docker compose up -d
```
