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

配置好环境变量后，还需要确认 `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` 中的模型配置与你的 API 服务匹配（详见下方 [AI 服务与模型配置](#ai-服务与模型配置)），然后重启服务：

```bash
docker compose up -d
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
| `MAIL_USER` / `MAIL_PASS` | aitoearn-server | SMTP 邮件服务 | 你的 SMTP 服务商 |
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

### AI 服务与模型配置

AI 变量配置在 `aitoearn-ai` 服务中（部分变量 `aitoearn-server` 也需要，下文会标注）。默认的占位密钥允许应用正常启动，但 AI 功能需要填入真实密钥才能使用。

模型定义在 `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` 的 `ai.models` 中，可自行增删改模型。所有模型定价必须设置为 `0`。修改后需重启服务生效：`docker compose restart aitoearn-ai`。

#### OpenAI / 中转服务

> **推荐使用 [new-api](https://github.com/Calcium-Ion/new-api) 或 [one-api](https://github.com/songquanpeng/one-api)**，一个地址统一管理 OpenAI、Claude、Gemini 等所有模型。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | API 密钥（`aitoearn-ai` + `aitoearn-server` 都需要） | `sk-placeholder` |
| `OPENAI_BASE_URL` | API 地址（`aitoearn-ai` + `aitoearn-server` 都需要） | `https://api.openai.com/v1` |

**内置模型：**

| 模型 ID | 类型 | 说明 |
|---------|------|------|
| `gpt-5` | 对话 | text/image → text |
| `gpt-image-1.5` | 图片生成/编辑 | 支持尺寸 1024x1024, 1536x1024, 1024x1536, auto |

<details>
<summary>模型配置示例</summary>

```js
// 对话模型 → ai.models.chat
{
  name: 'gpt-5',                       // 模型 ID
  description: 'GPT 5',               // 显示名称
  inputModalities: ['text', 'image'],  // 支持的输入类型
  outputModalities: ['text'],          // 输出类型
  pricing: {                           // 定价（必须为 0）
    tiers: [{ input: { text: '0', image: '0' }, output: { text: '0' } }],
  },
},

// 图片模型 → ai.models.image.generation
{
  name: 'gpt-image-1.5',                                    // 模型 ID
  description: 'gpt-image-1.5',                             // 显示名称
  sizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],  // 支持的尺寸
  qualities: ['high', 'medium', 'low'],                     // 质量选项
  styles: [],                                               // 风格选项
  pricing: '0',                                             // 单价（必须为 0）
},
```

</details>

#### Anthropic Claude

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | `sk-placeholder` |
| `ANTHROPIC_BASE_URL` | Anthropic API 地址 | `https://api.anthropic.com` |

> Agent（智能体）功能也通过此组变量调用 Claude。

**内置模型：**

| 模型 ID | 类型 | 说明 |
|---------|------|------|
| `claude-opus-4-5-20251101` | 对话 | Claude Opus 4.5 |
| `claude-opus-4-6` | 对话 | Claude Opus 4.6 |
| `claude-sonnet-4-5-20250929` | 对话 | Claude Sonnet 4.5 |

<details>
<summary>模型配置示例</summary>

```js
// 对话模型 → ai.models.chat
{
  name: 'claude-sonnet-4-5-20250929',  // 模型 ID
  description: 'Claude Sonnet 4.5',    // 显示名称
  inputModalities: ['text', 'image'],  // 支持的输入类型
  outputModalities: ['text'],          // 输出类型
  pricing: {                           // 定价（必须为 0）
    tiers: [{ input: { text: '0', image: '0' }, output: { text: '0' } }],
  },
},
```

</details>

#### Google Gemini

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GEMINI_KEY_PAIRS` | Vertex AI 密钥对（JSON 数组），用于对话和视频 | `'[]'` |
| `GEMINI_LOCATION` | Vertex AI 区域 | `us-central1` |
| `GEMINI_API_KEY` | 图片生成 API Key | |
| `GEMINI_BASE_URL` | 图片生成 API 地址 | |

`GEMINI_KEY_PAIRS` 格式：

```yaml
# 不使用 Gemini（默认）
GEMINI_KEY_PAIRS: '[]'

# 使用 Gemini
GEMINI_KEY_PAIRS: '[{"projectId":"your-project","apiKey":"your-key","keyFile":"/path/to/sa.json","bucket":"your-bucket"}]'
```

**内置模型：**

| 模型 ID | 类型 | 说明 |
|---------|------|------|
| `gemini-3.1-pro-preview` | 对话 | Gemini 3.1 Pro Preview，text/image/audio/video → text |
| `gemini-3-flash-preview` | 对话 | Gemini 3 Flash Preview，text/image/audio/video → text |
| `gemini-3.1-flash-image-preview` | 图片生成 / 草稿生成 | NanoBanana 2，text/image → image |
| `gemini-3-pro-image-preview` | 图片生成 / 草稿生成 | NanoBanana Pro，text/image → image |

<details>
<summary>模型配置示例</summary>

```js
// 多模态对话模型 → ai.models.chat
{
  name: 'gemini-3.1-pro-preview',                       // 模型 ID
  description: 'Gemini 3.1 Pro Preview',                // 显示名称
  inputModalities: ['text', 'image', 'audio', 'video'], // 支持的输入类型
  outputModalities: ['text'],                           // 输出类型
  pricing: {                                            // 分层定价（必须为 0）
    tiers: [
      {
        maxInputTokens: 200000,                         // 该层最大输入 token 数
        input: { text: '0', image: '0', video: '0', audio: '0' },
        output: { text: '0' },
      },
      {                                                 // 超过 200K token 的定价层
        input: { text: '0', image: '0', video: '0', audio: '0' },
        output: { text: '0' },
      },
    ],
  },
},

// 图片生成模型 → ai.models.chat（outputModalities 含 image）
{
  name: 'gemini-3.1-flash-image-preview',  // 模型 ID
  description: 'Nano Banana 2',            // 显示名称
  inputModalities: ['text', 'image'],      // 支持的输入类型
  outputModalities: ['image'],             // 输出类型为图片
  pricing: {                               // 定价（必须为 0）
    tiers: [{ input: { text: '0', image: '0' }, output: { text: '0', image: '0' } }],
  },
},
```

</details>

#### xAI (Grok)

| 变量 | 说明 |
|------|------|
| `GROK_API_KEY` | xAI Grok API Key |

**内置模型：**

| 模型 ID | 类型 | 说明 |
|---------|------|------|
| `grok-imagine-video` | 视频生成 | text/image/video → video，720p，1-15 秒 |

<details>
<summary>模型配置示例</summary>

```js
// 视频模型 → ai.models.video.generation
{
  name: 'grok-imagine-video',       // 模型 ID
  description: 'Grok Video',       // 显示名称
  channel: 'grok',                 // 关联的 AI 服务渠道
  modes: ['text2video', 'image2video', 'video2video'], // 支持的生成模式
  resolutions: ['720p'],           // 支持的分辨率
  durations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // 支持的时长（秒）
  maxInputImages: 1,               // 最大输入图片数
  aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'], // 支持的宽高比
  defaults: { duration: 8, aspectRatio: '9:16' }, // 默认参数
  pricing: [                       // 按时长定价（必须为 0）
    { duration: 5, price: 0 },
    { duration: 10, price: 0 },
    { duration: 15, price: 0 },
  ],
},
```

</details>

#### 火山引擎

| 变量 | 说明 |
|------|------|
| `VOLCENGINE_API_KEY` | 火山引擎 API Key |
| `VOLCENGINE_ACCESS_KEY_ID` | Access Key ID |
| `VOLCENGINE_SECRET_ACCESS_KEY` | Secret Access Key |
| `VOLCENGINE_VOD_SPACE_NAME` | VOD 点播空间名称 |

提供以下功能：
- **豆包视频生成**：在 `ai.models.video.generation` 中配置，channel 为 `volcengine`
- **Aideo**：AI 视频编辑系列功能，包括视频风格转换、视频理解、高光智剪、面容翻译、字幕擦除、视频编辑、短剧解说、风格迁移，定价必须全部为 `0`

<details>
<summary>视频模型配置示例</summary>

```js
// 视频模型 → ai.models.video.generation
{
  name: 'doubao-seedance-1-0-lite-i2v',  // 模型 ID
  description: 'Doubao Seedance Lite',   // 显示名称
  channel: 'volcengine',                 // 关联的 AI 服务渠道
  modes: ['text2video', 'image2video'],  // 支持的生成模式
  resolutions: ['720p', '1080p'],        // 支持的分辨率
  durations: [5, 10],                    // 支持的时长（秒）
  maxInputImages: 1,                     // 最大输入图片数
  aspectRatios: ['1:1', '16:9', '9:16'], // 支持的宽高比
  defaults: { duration: 5, aspectRatio: '16:9' }, // 默认参数
  pricing: [                             // 按时长定价（必须为 0）
    { duration: 5, price: 0 },
    { duration: 10, price: 0 },
  ],
},
```

</details>
