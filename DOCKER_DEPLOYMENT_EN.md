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

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
```

### 2. Start Services

```bash
docker compose up -d
```

First startup will pull images, which may take a few minutes.

### 3. Check Status

```bash
docker compose ps
```

All services should show `healthy` or `running` status.

### 4. Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:8080 | Web frontend (via Nginx) |
| http://localhost:8080/api/ | Backend API (via Nginx) |
| http://localhost:8080/_nhealth | Nginx health check |
| http://localhost:9001 | RustFS object storage console |

### 5. Configure Relay (Recommended)

Relay allows self-hosted instances to connect social media platform accounts via the official AiToEarn relay server, without needing to configure OAuth credentials for each platform.

**Setup:**

1. Go to **Settings → API Key** at [https://aitoearn.ai](https://aitoearn.ai) and create an API Key.
2. Configure in the `aitoearn-server` service of `docker-compose.yml`:

```yaml
RELAY_SERVER_URL: https://aitoearn.ai/api
RELAY_API_KEY: your-api-key
RELAY_CALLBACK_URL: http://127.0.0.1:8080/api/plat/relay-callback
```

3. Restart the service: `docker compose restart aitoearn-server`

### 6. Configure AI Services

**Recommended: use a relay service like new-api / one-api** to manage all AI models through a single endpoint.

- [new-api](https://github.com/Calcium-Ion/new-api) - Multi-model API relay
- [one-api](https://github.com/songquanpeng/one-api) - OpenAI API management and distribution

Configure in `docker-compose.yml`:

```yaml
# In both aitoearn-ai and aitoearn-server services
OPENAI_BASE_URL: https://your-new-api-host/v1
OPENAI_API_KEY: sk-your-new-api-key
```

> Default `sk-placeholder` values allow the app to start normally. AI features will return errors until real keys are configured.

### 7. Configure Environment Variables (Production)

All environment variables are configured directly in `docker-compose.yml`. **Default values are already provided for all settings, so you can start the application immediately without any changes.**

For production deployments, it is recommended to modify the following security-related fields:

```yaml
# 1. mongodb service — change database password
MONGO_INITDB_ROOT_PASSWORD: your-secure-password

# 2. redis service — change Redis password
command: redis-server --requirepass your-secure-password

# 3. aitoearn-ai service — change these variables
MONGODB_PASSWORD: your-secure-password        # must match MongoDB password above
REDIS_PASSWORD: your-secure-password          # must match Redis password above
JWT_SECRET: your-random-jwt-secret
INTERNAL_TOKEN: your-random-internal-token

# 4. aitoearn-server service — change these variables (must match aitoearn-ai)
MONGODB_PASSWORD: your-secure-password
REDIS_PASSWORD: your-secure-password
JWT_SECRET: your-random-jwt-secret            # must match aitoearn-ai
INTERNAL_TOKEN: your-random-internal-token    # must match aitoearn-ai
APP_DOMAIN: your-domain.com                   # change for production
```

> **Note**: When changing passwords, you must update ALL services that reference them. For example, the MongoDB password appears in the `mongodb`, `aitoearn-ai`, and `aitoearn-server` services.
>
> Generate random strings with: `openssl rand -hex 32`

### 8. Configure Application Config Files

Configuration files are located in each application's `config/` subdirectory, mounted as read-only volumes into containers:

| File | Mounted to | Description |
|------|------------|-------------|
| `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` | aitoearn-ai:/app/config.js | AI service config (AI model definitions, storage) |
| `project/aitoearn-backend/apps/aitoearn-server/config/config.js` | aitoearn-server:/app/config.js | Backend config (OAuth callbacks, email, storage) |

These config files read environment variables from `process.env` (set by docker-compose.yml) and also contain hardcoded configuration (storage endpoints, AI model lists, etc.).

**To change RustFS credentials or switch to external S3/OSS**, update the `assets` configuration in both config.js files, or override via the `ASSETS_CONFIG` environment variable (see below).

## Environment Variables Reference

All variables below are configured in the `environment` section of each service in `docker-compose.yml`.

### Core Settings

All variables below have working defaults — the application starts out of the box. For production, change passwords and secrets.

| Variable | Service(s) | Description | Default |
|----------|------------|-------------|---------|
| `MONGO_INITDB_ROOT_PASSWORD` | mongodb | MongoDB root password | `password` |
| `MONGODB_PASSWORD` | aitoearn-ai, aitoearn-server | MongoDB connection password (must match above) | `password` |
| `REDIS_PASSWORD` | aitoearn-ai, aitoearn-server | Redis password (must match redis `--requirepass`) | `password` |
| `JWT_SECRET` | aitoearn-ai, aitoearn-server | JWT signing secret | `change-this-jwt-secret` |
| `INTERNAL_TOKEN` | aitoearn-ai, aitoearn-server | Inter-service auth token | `change-this-secret-token` |
| `APP_DOMAIN` | aitoearn-server | Application domain (for OAuth callbacks) | `localhost` |
| `ASSETS_CONFIG` | aitoearn-ai, aitoearn-server | Asset storage config (JSON format, see above) | Built-in RustFS config |

### Internal Service Communication

These variables handle inter-service communication via Docker internal networking. Usually no changes needed.

| Variable | Service | Description | Default |
|----------|---------|-------------|---------|
| `SERVER_URL` | aitoearn-ai | URL to reach aitoearn-server | `http://aitoearn-server:3002` |
| `AI_URL` | aitoearn-server | URL to reach aitoearn-ai | `http://aitoearn-ai:3010` |

### Assets Storage (RustFS)

Docker Compose includes [RustFS](https://github.com/rustfs/rustfs) as a built-in S3-compatible object storage. **It works out of the box with no extra configuration**.

On startup, the `aitoearn` bucket is automatically created. Application services access it via `http://rustfs.local:9000` on the internal network.

**RustFS Console**: http://localhost:9001
- Default username: `rustfsadmin`
- Default password: `rustfsadmin`

To change RustFS credentials, update these locations:

1. `docker-compose.yml` — `rustfs` service: `RUSTFS_ACCESS_KEY` and `RUSTFS_SECRET_KEY`
2. `docker-compose.yml` — `rustfs-init` service: credentials in the `mc alias set` command
3. `docker-compose.yml` — `ASSETS_CONFIG` environment variable in both `aitoearn-ai` and `aitoearn-server` services

**`ASSETS_CONFIG` environment variable** (JSON format) configures asset storage. Required in both `aitoearn-ai` and `aitoearn-server` services:

```yaml
ASSETS_CONFIG: '{"provider":"s3","region":"us-east-1","bucketName":"aitoearn","endpoint":"http://rustfs.local:9000","publicEndpoint":"http://127.0.0.1:9000","cdnEndpoint":"http://127.0.0.1:8080/oss","accessKeyId":"rustfsadmin","secretAccessKey":"rustfsadmin","forcePathStyle":true}'
```

**For production** with AWS S3 or other providers, update `ASSETS_CONFIG` or the `assets` config in both config.js files:

```yaml
# In docker-compose.yml (AWS S3 example)
ASSETS_CONFIG: '{"provider":"s3","region":"ap-southeast-1","bucketName":"your-bucket","endpoint":"https://s3.ap-southeast-1.amazonaws.com","accessKeyId":"xxx","secretAccessKey":"xxx","cdnEndpoint":"https://your-cdn.com"}'
```

### AI Services

**Recommended: use a relay service like new-api / one-api** to manage all AI models through a single endpoint. One API URL and key gives you access to OpenAI, Claude, Gemini, and more.

Popular relay services:
- [new-api](https://github.com/Calcium-Ion/new-api) - Multi-model API relay
- [one-api](https://github.com/songquanpeng/one-api) - OpenAI API management and distribution

After deploying a relay service, configure in `docker-compose.yml`:

```yaml
# In both aitoearn-ai and aitoearn-server services
OPENAI_BASE_URL: https://your-new-api-host/v1
OPENAI_API_KEY: sk-your-new-api-key
```

> Default `sk-placeholder` values allow the app to start normally. AI features will return errors until real keys are configured.

All supported AI services (configured in the `aitoearn-ai` service):

| Variable | Service | Notes |
|----------|---------|-------|
| `OPENAI_API_KEY` | OpenAI / Relay | Needed in both aitoearn-ai and aitoearn-server |
| `OPENAI_BASE_URL` | API URL | Relay URL or `https://api.openai.com/v1` (both services) |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) | Can be accessed via relay |
| `ANTHROPIC_BASE_URL` | Anthropic API URL | Default: `https://api.anthropic.com` |
| `VOLCENGINE_API_KEY` | Volcengine (Doubao) | https://console.volcengine.com/ark |
| `VOLCENGINE_ACCESS_KEY_ID` | Volcengine | Access Key ID |
| `VOLCENGINE_SECRET_ACCESS_KEY` | Volcengine | Secret Access Key |
| `VOLCENGINE_VOD_SPACE_NAME` | Volcengine | VOD space name |
| `GROK_API_KEY` | xAI (Grok) | https://console.x.ai |
| `AICSO_API_KEY` | AICSO | AICSO service API key |
| `AICSO_BASE_URL` | AICSO | AICSO service base URL |
| `GEMINI_KEY_PAIRS` | Google Gemini | JSON array format |
| `GEMINI_LOCATION` | Google Gemini | Default: `us-central1` |
| `AI_PROXY_URL` | AI Proxy | Optional, for proxied AI API access |

`GEMINI_KEY_PAIRS` format (JSON array), defaults to `'[]'` (empty array):

```yaml
# Default (Gemini disabled)
GEMINI_KEY_PAIRS: '[]'

# Example with Gemini configured
GEMINI_KEY_PAIRS: '[{"projectId":"your-gcp-project-id","apiKey":"your-gemini-api-key","bucket":"your-bucket"}]'
```

AI model definitions (available models, pricing, etc.) are configured in `project/aitoearn-backend/apps/aitoearn-ai/config/config.js`.

### Third-party OAuth (Optional)

Configure social media OAuth credentials as needed in the `aitoearn-server` service of `docker-compose.yml`.

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

**OAuth callback URL format**: `https://{APP_DOMAIN}/api/plat/{platform}/auth/back`

> Ensure `APP_DOMAIN` is set to your public domain. OAuth callbacks won't work with `localhost`.

### Other Optional Services

| Variable | Service | Description | How to get |
|----------|---------|-------------|-----------|
| `MAIL_USER` / `MAIL_PASS` | aitoearn-server | Email (AWS SES SMTP) | AWS Console → SES → SMTP |
| `ALI_SMS_*` (4 vars) | aitoearn-server | Aliyun SMS | https://dysms.console.aliyun.com |

### Auto-Login

Auto-login is enabled by default. On first startup, the `aitoearn-init` service generates an admin token and saves it to a shared volume. The `aitoearn-web` service reads this token automatically and uses it to log in without manual authentication.

### Image Pull Policy

All application service images in Docker Compose use `pull_policy: always` to ensure the latest images are pulled on every `docker compose up`:

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

## Config Files Reference

Each application has its own configuration file, mounted as read-only volumes into containers. Restart the corresponding service after making changes.

### project/aitoearn-backend/apps/aitoearn-ai/config/config.js

Complete configuration for the AI service, mounted to `aitoearn-ai:/app/config.js`.

#### Basic Settings

| Config | Description | Default |
|--------|-------------|---------|
| `port` | Service listening port | `3010` |
| `logger.console.enable` | Enable console logging | `true` |
| `logger.console.level` | Log level | `debug` |
| `logger.console.pretty` | Pretty-print log output | `false` |

#### Database & Cache

Read from environment variables, usually no changes needed in the config file.

| Config | Description | Source |
|--------|-------------|--------|
| `redis` | Redis connection (host/port/password) | Env vars `REDIS_HOST/PORT/PASSWORD` |
| `redlock` | Distributed lock Redis config | Same as redis |
| `mongodb.uri` | MongoDB connection URI | Built from env vars |
| `mongodb.dbName` | Database name | `aitoearn` |

#### Authentication

| Config | Description | Source |
|--------|-------------|--------|
| `auth.secret` | JWT signing secret | Env var `JWT_SECRET` |
| `auth.expiresIn` | JWT expiration (seconds) | `604800` (7 days) |
| `auth.internalToken` | Internal service token | Env var `INTERNAL_TOKEN` |

#### Inter-service Communication

| Config | Description | Source |
|--------|-------------|--------|
| `serverClient.baseUrl` | URL to reach backend service | Env var `SERVER_URL` |
| `serverClient.token` | Service communication token | Env var `INTERNAL_TOKEN` |

#### Assets Storage

**Requires manual editing.** Defaults point to built-in RustFS:

| Config | Description | Default |
|--------|-------------|---------|
| `assets.provider` | Storage provider | `s3` |
| `assets.region` | Storage region | `us-east-1` |
| `assets.bucketName` | Bucket name | `aitoearn` |
| `assets.endpoint` | Storage endpoint | `http://rustfs.local:9000` |
| `assets.accessKeyId` | Access key ID | `rustfsadmin` |
| `assets.secretAccessKey` | Secret access key | `rustfsadmin` |
| `assets.cdnEndpoint` | CDN URL (optional) | None |

#### AI Service Providers

Connection config for each AI service, read from environment variables:

| Config | Description |
|--------|-------------|
| `ai.openai` | OpenAI config (baseUrl, apiKey), supports `AI_PROXY_URL` proxy |
| `ai.anthropic` | Anthropic Claude config (baseUrl, apiKey), supports proxy |
| `ai.grok` | xAI Grok config (baseUrl fixed to `https://api.x.ai`, apiKey), supports proxy |
| `ai.volcengine` | Volcengine config (baseUrl, apiKey, accessKeyId, secretAccessKey, spaceName) |
| `ai.gemini` | Google Gemini config (keyPairs, location, apiKey), supports proxy |
| `ai.aicso` | AICSO config (apiKey, baseUrl) |

#### Video AI Feature Pricing (ai.aideo)

Pricing config for video AI features (unit: cents/minute), all default to `0` (free):

| Config | Description |
|--------|-------------|
| `ai.aideo.vCreative.basePrice` | AI video editing (720P) |
| `ai.aideo.vision.basePrice` | Video understanding |
| `ai.aideo.highlight.basePrice` | Highlight smart editing |
| `ai.aideo.aiTranslation.facialTranslation` | Facial translation |
| `ai.aideo.erase.basePrice` | AI subtitle removal |
| `ai.aideo.videoEdit.basePrice` | Video editing (720P) |
| `ai.aideo.dramaRecap.basePrice` | Drama recap |
| `ai.aideo.styleTransfer.basePrice` | Video style transfer |

#### AI Chat Models (ai.models.chat)

Defines the list of available AI chat models. Each model contains:

| Field | Description |
|-------|-------------|
| `name` | Model ID (used in API calls) |
| `description` | Display name |
| `inputModalities` | Input types (`text`, `image`, `audio`, `video`) |
| `outputModalities` | Output types (`text`, `image`) |
| `pricing.tiers` | Tiered pricing (per input/output token) |

Default chat models:

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

#### AI Image Models (ai.models.image)

**Image generation and image editing** models:

| Model ID | Supported Sizes | Quality Options | Max Input Images (edit) |
|----------|----------------|-----------------|------------------------|
| `gpt-image-1.5` | 1024x1024, 1536x1024, 1024x1536, auto | high, medium, low | 16 (edit mode only) |

#### AI Video Models (ai.models.video.generation)

| Model ID | Display Name | Channel | Modes | Resolution | Duration | Aspect Ratios |
|----------|-------------|---------|-------|------------|----------|---------------|
| `grok-imagine-video` | Grok Video | grok | text2video, image2video, video2video | 720p | 1-15s | 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 |
| `grok-video-3-15s` | Grok Video 15s | aicso-grok | text2video, image2video | 720p | 15s | 2:3, 3:2, 1:1 |
| `veo3.1-components-4k` | Veo 3.1 4K | aicso-veo | text2video, image2video | 4k | 8s | 9:16, 16:9, 1:1 |
| `veo3.1-components` | Veo 3.1 | aicso-veo | text2video, image2video | 720p | 8s | 9:16, 16:9, 1:1 |

#### Draft Generation Image Models (ai.draftGeneration.imageModels)

| Model ID | Display Name | Supported Aspect Ratios | Max Input Images |
|----------|-------------|------------------------|-----------------|
| `gemini-3.1-flash-image-preview` | NanoBanana 2 | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 | 14 |
| `gemini-3-pro-image-preview` | NanoBanana Pro | Same as above | 14 |

Pricing is per resolution (1K/2K/4K), all default to `0`.

#### Agent Config

| Config | Description | Source |
|--------|-------------|--------|
| `agent.baseUrl` | Agent API URL | Based on `OPENAI_BASE_URL` + `/messages`, supports proxy |
| `agent.apiKey` | Agent API key | Env var `OPENAI_API_KEY` |

---

### project/aitoearn-backend/apps/aitoearn-server/config/config.js

Complete configuration for the backend service, mounted to `aitoearn-server:/app/config.js`.

#### Basic Settings

| Config | Description | Default / Source |
|--------|-------------|-----------------|
| `appDomain` | Application domain | Env var `APP_DOMAIN` |
| `port` | Service listening port | `3002` |
| `environment` | Runtime environment | Env var `NODE_ENV` |
| `enableBadRequestDetails` | Return bad request error details | `true` |

#### Auth, Logger, Database, Cache

Same config structure as aitoearn-ai.config.js, read from environment variables.

#### Platform Integration (channel)

**channel.channelDb** — Separate database for platform data:

| Config | Description | Default |
|--------|-------------|---------|
| `channelDb.uri` | MongoDB connection URI | Same as main database |
| `channelDb.dbName` | Database name | `aitoearn_channel` |

**channel.moreApi** — External platform APIs:

| Config | Description | Default |
|--------|-------------|---------|
| `moreApi.platApiUri` | Platform API URL | `https://platapi.yikart.cn` |
| `moreApi.xhsCreatorUri` | Xiaohongshu Creator API | `http://39.106.41.190:7008` |

**channel.shortLink** — Short link service:

| Config | Description | Default |
|--------|-------------|---------|
| `shortLink.baseUrl` | Short link base URL | `https://{APP_DOMAIN}/api/shortLink/` |

**Platform OAuth Configuration** — OAuth callback URLs are auto-generated from `APP_DOMAIN`:

| Platform | Callback URL Format | Special Config |
|----------|-------------------|----------------|
| Bilibili | `https://{APP_DOMAIN}/api/plat/bilibili/auth/back` | — |
| Google | Handled via Google SDK | — |
| Google Business | `https://{APP_DOMAIN}/api/plat/google-business/auth/callback` | Requires separate clientId/clientSecret |
| Kwai | `https://{APP_DOMAIN}/api/plat/kwai/auth/back` | — |
| Pinterest | `https://{APP_DOMAIN}/api/plat/pinterest/authWebhook` | `baseUrl`: `https://api.pinterest.com`, supports `test_authorization` |
| TikTok | `https://{APP_DOMAIN}/api/plat/tiktok/auth/back` | Includes promotion callback and scopes |
| Twitter | `https://{APP_DOMAIN}/api/plat/twitter/auth/back` | — |
| Facebook | `https://{APP_DOMAIN}/api/plat/meta/auth/back` | Includes `configId` and scopes |
| Threads | `https://{APP_DOMAIN}/api/plat/meta/auth/back` | Separate clientId/Secret, includes scopes |
| Instagram | `https://{APP_DOMAIN}/api/plat/meta/auth/back` | Includes promotion callback and scopes |
| LinkedIn | `https://{APP_DOMAIN}/api/plat/meta/auth/back` | Scopes: openid, profile, email, w_member_social |
| WeChat | `https://{APP_DOMAIN}/platcallback` | Includes token and encodingAESKey |
| YouTube | `https://{APP_DOMAIN}/api/plat/youtube/auth/callback` | — |
| Douyin | `https://{APP_DOMAIN}/api/plat/douyin/auth/back` | — |

#### Assets Storage

Same as `assets` in the aitoearn-ai config.js. Both must be kept in sync. Can also be overridden via the `ASSETS_CONFIG` environment variable.

#### Email Configuration (mail)

| Config | Description | Default / Source |
|--------|-------------|-----------------|
| `mail.transport.host` | SMTP host | `email-smtp.ap-southeast-1.amazonaws.com` |
| `mail.transport.port` | SMTP port | `587` |
| `mail.transport.secure` | Use TLS | `false` (STARTTLS) |
| `mail.transport.auth.user` | SMTP username | Env var `MAIL_USER` |
| `mail.transport.auth.pass` | SMTP password | Env var `MAIL_PASS` |
| `mail.defaults.from` | Default sender address | `noreply@tx.aitoearn.ai` |

To switch email providers (e.g., SendGrid, Mailgun), modify the `mail.transport` host/port settings.

#### Aliyun SMS (aliSms)

| Config | Description | Source |
|--------|-------------|--------|
| `aliSms.accessKeyId` | Aliyun AccessKey ID | Env var `ALI_SMS_ACCESS_KEY_ID` |
| `aliSms.accessKeySecret` | Aliyun AccessKey Secret | Env var `ALI_SMS_ACCESS_KEY_SECRET` |
| `aliSms.signName` | SMS signature name | Env var `ALI_SMS_SIGN_NAME` |
| `aliSms.templateCode` | SMS template code | Env var `ALI_SMS_TEMPLATE_CODE` |

#### Inter-service Communication

| Config | Description | Source |
|--------|-------------|--------|
| `aiClient.baseUrl` | URL to reach AI service | Env var `AI_URL` |
| `aiClient.token` | Service communication token | Env var `INTERNAL_TOKEN` |

## Common Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Check service status
docker compose ps

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f aitoearn-web
docker compose logs -f aitoearn-server
docker compose logs -f aitoearn-ai

# Restart a single service
docker compose restart aitoearn-server

# Restart after editing config files
docker compose restart aitoearn-ai aitoearn-server

# Recreate services (after editing docker-compose.yml)
docker compose down && docker compose up -d

# Remove all data (dangerous!)
docker compose down -v
```

## Data Persistence

Data is persisted via Docker Volumes:

| Volume | Description |
|--------|-------------|
| `mongodb-data` | MongoDB data files |
| `mongodb-config` | MongoDB config files |
| `redis-data` | Redis persistent data |
| `rustfs-data` | RustFS object storage data |

Stopping services (`docker compose down`) preserves data. Only `docker compose down -v` deletes volumes.

## Production Deployment

### HTTPS

For production, add an HTTPS reverse proxy in front of Nginx (e.g., Caddy with automatic HTTPS, or Certbot + Nginx), or modify `nginx/nginx.conf` to add SSL:

```bash
# Option 1: Use Caddy (recommended, automatic HTTPS)
# Replace the nginx service in docker-compose.yml with caddy

# Option 2: Use Let's Encrypt
# Mount certificates into the nginx container
```

### Security Recommendations

1. **Change all default passwords and secrets in docker-compose.yml**
2. Do not expose MongoDB (27017) and Redis (6379) ports in production
3. Configure firewall to only allow ports 8080/443
4. Regularly backup MongoDB data

### Backup

```bash
# Backup MongoDB
docker exec aitoearn-mongodb mongodump --uri="mongodb://admin:your-password@localhost:27017" --out=/dump
docker cp aitoearn-mongodb:/dump ./backup/

# Restore MongoDB
docker cp ./backup/dump aitoearn-mongodb:/dump
docker exec aitoearn-mongodb mongorestore --uri="mongodb://admin:your-password@localhost:27017" /dump
```

## FAQ

### Q: How to build images from source?

If you need to build Docker images from source (instead of using pre-built images), use the included build script:

```bash
bash scripts/build.sh
```

This script will:
1. Build backend projects (aitoearn-server, aitoearn-ai) using Nx
2. Build the frontend project (aitoearn-web) using its Dockerfile
3. Tag all images as `aitoearn/*:latest`

After building, start services normally with `docker compose up -d`.

> Prerequisites: Node.js and pnpm must be installed, and `pnpm install` must have been run in `project/aitoearn-backend`.

### Q: What are the config files for?

Each application has its own config file in its `config/` subdirectory:

- **project/aitoearn-backend/apps/aitoearn-ai/config/config.js**: Detailed AI service configuration including AI model definitions (available models, pricing), storage config, and Gemini settings
- **project/aitoearn-backend/apps/aitoearn-server/config/config.js**: Backend service configuration including OAuth callback URL patterns, email transport settings, and storage config

These files are mounted as read-only volumes. After editing, restart the relevant services: `docker compose restart aitoearn-ai aitoearn-server`

### Q: How to add or change AI models?

Edit the `ai.models` section in `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` to modify the available model list, pricing, and model parameters. Then restart the AI service:

```bash
docker compose restart aitoearn-ai
```

### Q: Service fails to start, port already in use?

Check if ports 8080, 27017, 6379 are occupied:

```bash
lsof -i :8080
lsof -i :27017
lsof -i :6379
```

### Q: Frontend loads but API requests fail?

1. Check Nginx logs: `docker compose logs nginx`
2. Check backend health: `docker compose ps`

### Q: OAuth login callback fails?

1. Ensure `APP_DOMAIN` in the `aitoearn-server` service of `docker-compose.yml` is set to your public domain (not localhost)
2. Configure the correct callback URL in each platform's developer console
3. Ensure your domain has valid HTTPS

### Q: AI features not working?

1. Verify `OPENAI_API_KEY` and `OPENAI_BASE_URL` are correctly configured in `docker-compose.yml`
2. Recommended: deploy [new-api](https://github.com/Calcium-Ion/new-api) relay service to manage all AI models
3. The default `sk-placeholder` is just a placeholder — no AI service will work until real keys are set
4. AI model configuration is in `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` — ensure model definitions match your API service

### Q: How to update to the latest version?

```bash
docker compose pull
docker compose down && docker compose up -d
```
