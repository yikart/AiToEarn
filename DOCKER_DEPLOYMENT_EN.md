# AiToEarn Docker Deployment Guide

This guide helps you quickly deploy the complete AiToEarn application using Docker Compose.

## Architecture

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

| Service | Description | Port |
|---------|-------------|------|
| **Nginx** | Reverse proxy, unified entry | 8080 (public) |
| **aitoearn-web** | Next.js frontend | 3000 (internal) |
| **aitoearn-server** | NestJS main backend API | 3002 (internal) |
| **aitoearn-ai** | NestJS AI service | 3010 (internal) |
| **MongoDB** | Database | 27017 |
| **Redis** | Cache / Queue | 6379 |
| **RustFS** | S3-compatible object storage | 9000 (API) / 9001 (Console) |

## Prerequisites

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **System RAM**: 4GB+ recommended
- **Disk Space**: 20GB+ recommended

Verify installation:

```bash
docker --version
docker compose version
```

---

## 🚀 Get Running in 3 Minutes

Just 3 steps to run the complete AiToEarn on your machine.

### Step 1: Clone and Start

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
docker compose up -d
```

First startup pulls images — may take a few minutes. Run `docker compose ps` to confirm all services are `healthy` or `running`.

### Step 2: Open the App

Visit: **[http://localhost:8080](http://localhost:8080)**

> First startup auto-creates an admin account and logs you in automatically.

### Step 3: Configure Relay (Strongly Recommended)

> **Why configure Relay?**
>
> AiToEarn needs to log into your social media accounts (TikTok, Instagram, YouTube, etc.) to publish content. These platforms require OAuth developer credentials for authorization.
>
> - **Without Relay**: You'd need to register as a developer on each platform and obtain client_id/secret — extremely tedious.
> - **With Relay**: Use the official aitoearn.ai credentials to authorize all platforms with **just one API Key**.

**How to configure**:

1. Sign up at [aitoearn.ai](https://aitoearn.ai) (international) or [aitoearn.cn](https://aitoearn.cn) (China), go to **Settings → API Key**, and create an API Key
2. Edit `docker-compose.yml`, add to the `aitoearn-server` service `environment`:

```yaml
RELAY_SERVER_URL: https://aitoearn.ai/api
RELAY_API_KEY: your-api-key
RELAY_CALLBACK_URL: http://127.0.0.1:8080/api/plat/relay-callback
```

3. Restart the service:

```bash
docker compose restart aitoearn-server
```

**You're all set!** 🎉

Everything below is advanced configuration — refer to it only when needed.

---

## Advanced Configuration

### AI Services

Default AI keys are placeholders (`sk-placeholder`). The app starts fine, but AI features (AI copywriting, AI comments, etc.) will return errors.

**Recommended: use [new-api](https://github.com/Calcium-Ion/new-api) or [one-api](https://github.com/songquanpeng/one-api)** to manage all AI models (OpenAI, Claude, Gemini, etc.) through a single endpoint.

Configure in `docker-compose.yml` (both `aitoearn-ai` and `aitoearn-server` services):

```yaml
OPENAI_BASE_URL: https://your-new-api-host/v1
OPENAI_API_KEY: sk-your-new-api-key
```

### Production Security

Default passwords are all `password`. **Change them for production.**

> 💡 Generate random strings with `openssl rand -hex 32`

```yaml
# 1. mongodb service
MONGO_INITDB_ROOT_PASSWORD: your-secure-password

# 2. redis service
command: redis-server --requirepass your-secure-password

# 3. aitoearn-ai service
MONGODB_PASSWORD: your-secure-password        # must match MongoDB
REDIS_PASSWORD: your-secure-password          # must match Redis
JWT_SECRET: your-random-jwt-secret
INTERNAL_TOKEN: your-random-internal-token

# 4. aitoearn-server service (must match aitoearn-ai)
MONGODB_PASSWORD: your-secure-password
REDIS_PASSWORD: your-secure-password
JWT_SECRET: your-random-jwt-secret            # must match aitoearn-ai
INTERNAL_TOKEN: your-random-internal-token    # must match aitoearn-ai
APP_DOMAIN: your-domain.com                   # your public domain
```

> ⚠️ MongoDB password appears in `mongodb`, `aitoearn-ai`, and `aitoearn-server` — update all three when changing.

### Third-Party OAuth (Optional)

> If you've configured Relay, you can **skip this**. Only needed if you want to use your own OAuth credentials instead of Relay.

Configure in the `aitoearn-server` service of `docker-compose.yml`:

| Platform | Variables | Developer Console |
|----------|-----------|------------------|
| Bilibili | `BILIBILI_CLIENT_ID/SECRET` | https://open.bilibili.com |
| Google | `GOOGLE_CLIENT_ID/SECRET` | https://console.cloud.google.com/apis/credentials |
| Kwai | `KWAI_CLIENT_ID/SECRET` | https://open.kuaishou.com |
| Pinterest | `PINTEREST_CLIENT_ID/SECRET` | https://developers.pinterest.com |
| TikTok | `TIKTOK_CLIENT_ID/SECRET` | https://developers.tiktok.com |
| Twitter/X | `TWITTER_CLIENT_ID/SECRET` | https://developer.x.com/en/portal |
| Facebook | `FACEBOOK_CLIENT_ID/SECRET`, `FACEBOOK_CONFIG_ID` | https://developers.facebook.com |
| Threads | `THREADS_CLIENT_ID/SECRET` | https://developers.facebook.com |
| Instagram | `INSTAGRAM_CLIENT_ID/SECRET` | https://developers.facebook.com |
| LinkedIn | `LINKEDIN_CLIENT_ID/SECRET` | https://www.linkedin.com/developers |
| YouTube | `YOUTUBE_CLIENT_ID/SECRET` | https://console.cloud.google.com/apis/credentials |
| WeChat | `WXPLAT_APP_ID/SECRET`, `WXPLAT_ENCODING_AES_KEY` | https://mp.weixin.qq.com |
| Douyin | `DOYIN_CLIENT_ID/SECRET` | https://open.douyin.com |

OAuth callback URL format: `https://{APP_DOMAIN}/api/plat/{platform}/auth/back`

> Ensure `APP_DOMAIN` is set to your public domain.

### Object Storage (RustFS)

Docker Compose includes [RustFS](https://github.com/rustfs/rustfs) as built-in S3-compatible storage. **Works out of the box.**

**RustFS Console**: http://localhost:9001
- Default username: `rustfsadmin`
- Default password: `rustfsadmin`

<details>
<summary>Changing RustFS credentials or switching to external S3/OSS</summary>

Update all three locations:

1. `docker-compose.yml` — `rustfs` service: `RUSTFS_ACCESS_KEY` and `RUSTFS_SECRET_KEY`
2. `docker-compose.yml` — `rustfs-init` service: credentials in `mc alias set` command
3. `docker-compose.yml` — `ASSETS_CONFIG` in both `aitoearn-ai` and `aitoearn-server`

`ASSETS_CONFIG` format (JSON), needed in both services:

```yaml
ASSETS_CONFIG: '{"provider":"s3","region":"us-east-1","bucketName":"aitoearn","endpoint":"http://rustfs.local:9000","publicEndpoint":"http://127.0.0.1:9000","cdnEndpoint":"http://127.0.0.1:8080/oss","accessKeyId":"rustfsadmin","secretAccessKey":"rustfsadmin","forcePathStyle":true}'
```

AWS S3 example:

```yaml
ASSETS_CONFIG: '{"provider":"s3","region":"ap-southeast-1","bucketName":"your-bucket","endpoint":"https://s3.ap-southeast-1.amazonaws.com","accessKeyId":"xxx","secretAccessKey":"xxx","cdnEndpoint":"https://your-cdn.com"}'
```

</details>

### Other Optional Services

| Variable | Service | Description | How to get |
|----------|---------|-------------|-----------|
| `MAIL_USER` / `MAIL_PASS` | aitoearn-server | Email (AWS SES SMTP) | AWS Console → SES → SMTP |
| `ALI_SMS_*` (4 vars) | aitoearn-server | Aliyun SMS | https://dysms.console.aliyun.com |

---

## Operations Reference

### Auto-Login

Enabled by default. On first startup, `aitoearn-init` generates an admin token saved to a shared volume. `aitoearn-web` reads it automatically.

### Image Pull Policy

All app images use `pull_policy: always` to pull the latest on every `docker compose up`.

### Internal Service Communication

These variables handle inter-service communication via Docker networking. Usually no changes needed:

| Variable | Service | Default |
|----------|---------|---------|
| `SERVER_URL` | aitoearn-ai | `http://aitoearn-server:3002` |
| `AI_URL` | aitoearn-server | `http://aitoearn-ai:3010` |

### Config Files

Mounted as read-only volumes. Restart the service after changes:

| File | Mounted to | Description |
|------|------------|-------------|
| `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` | aitoearn-ai:/app/config.js | AI service config |
| `project/aitoearn-backend/apps/aitoearn-server/config/config.js` | aitoearn-server:/app/config.js | Backend config |

---

## Environment Variables Quick Reference

All variables are in the `environment` section of each service in `docker-compose.yml`.

### Core

| Variable | Service(s) | Description | Default |
|----------|------------|-------------|---------|
| `MONGO_INITDB_ROOT_PASSWORD` | mongodb | MongoDB root password | `password` |
| `MONGODB_PASSWORD` | aitoearn-ai, aitoearn-server | MongoDB connection password | `password` |
| `REDIS_PASSWORD` | aitoearn-ai, aitoearn-server | Redis password | `password` |
| `JWT_SECRET` | aitoearn-ai, aitoearn-server | JWT signing secret | `change-this-jwt-secret` |
| `INTERNAL_TOKEN` | aitoearn-ai, aitoearn-server | Inter-service auth token | `change-this-secret-token` |
| `APP_DOMAIN` | aitoearn-server | Application domain | `localhost` |
| `ASSETS_CONFIG` | aitoearn-ai, aitoearn-server | Asset storage config (JSON) | Built-in RustFS |

### Relay

| Variable | Service | Description |
|----------|---------|-------------|
| `RELAY_SERVER_URL` | aitoearn-server | Relay server URL (`https://aitoearn.ai/api`) |
| `RELAY_API_KEY` | aitoearn-server | Your API Key |
| `RELAY_CALLBACK_URL` | aitoearn-server | OAuth callback (`http://127.0.0.1:8080/api/plat/relay-callback`) |

### AI Services

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI / relay API key (both services) |
| `OPENAI_BASE_URL` | API URL (both services) |
| `ANTHROPIC_API_KEY` | Anthropic Claude |
| `ANTHROPIC_BASE_URL` | Anthropic API URL |
| `VOLCENGINE_API_KEY` | Volcengine (Doubao) |
| `VOLCENGINE_ACCESS_KEY_ID` | Volcengine Access Key |
| `VOLCENGINE_SECRET_ACCESS_KEY` | Volcengine Secret Key |
| `VOLCENGINE_VOD_SPACE_NAME` | Volcengine VOD space |
| `GROK_API_KEY` | xAI (Grok) |
| `AICSO_API_KEY` | AICSO service |
| `AICSO_BASE_URL` | AICSO URL |
| `GEMINI_KEY_PAIRS` | Google Gemini (JSON array) |
| `GEMINI_LOCATION` | Gemini region (default: `us-central1`) |
| `AI_PROXY_URL` | AI proxy URL (optional) |

`GEMINI_KEY_PAIRS` format:

```yaml
# Disabled (default)
GEMINI_KEY_PAIRS: '[]'

# Enabled
GEMINI_KEY_PAIRS: '[{"projectId":"your-project","apiKey":"your-key","bucket":"your-bucket"}]'
```

---

## AI Model Reference

AI models are defined in `project/aitoearn-backend/apps/aitoearn-ai/config/config.js`.

### Chat Models (ai.models.chat)

| Model ID | Display Name | Input | Output |
|----------|-------------|-------|--------|
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

### Image Models (ai.models.image)

| Model ID | Supported Sizes | Quality Options | Max Input Images (edit) |
|----------|----------------|-----------------|------------------------|
| `gpt-image-1.5` | 1024x1024, 1536x1024, 1024x1536, auto | high, medium, low | 16 (edit mode only) |

### Video Models (ai.models.video.generation)

| Model ID | Display Name | Modes | Resolution | Duration | Aspect Ratios |
|----------|-------------|-------|------------|----------|---------------|
| `grok-imagine-video` | Grok Video | text/image/video → video | 720p | 1-15s | 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 |
| `grok-video-3-15s` | Grok Video 15s | text/image → video | 720p | 15s | 2:3, 3:2, 1:1 |
| `veo3.1-components-4k` | Veo 3.1 4K | text/image → video | 4k | 8s | 9:16, 16:9, 1:1 |
| `veo3.1-components` | Veo 3.1 | text/image → video | 720p | 8s | 9:16, 16:9, 1:1 |

### Draft Generation Image Models (ai.draftGeneration.imageModels)

| Model ID | Display Name | Supported Aspect Ratios | Max Input Images |
|----------|-------------|------------------------|-----------------|
| `gemini-3.1-flash-image-preview` | NanoBanana 2 | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 | 14 |
| `gemini-3-pro-image-preview` | NanoBanana Pro | Same as above | 14 |

Pricing is per resolution (1K/2K/4K), all default to `0` (free).
