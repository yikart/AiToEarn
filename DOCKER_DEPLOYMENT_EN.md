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

After configuring environment variables, verify that the model configuration in `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` matches your API service (see [AI Services & Model Configuration](#ai-services--model-configuration) below), then restart:

```bash
docker compose up -d
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
| `MAIL_USER` / `MAIL_PASS` | aitoearn-server | SMTP email service | Your SMTP provider |
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

### AI Services & Model Configuration

AI variables are configured in the `aitoearn-ai` service (some are also needed in `aitoearn-server`, noted below). Default placeholder keys allow the app to start, but AI features require real keys.

Models are defined in `project/aitoearn-backend/apps/aitoearn-ai/config/config.js` under `ai.models`. You can add, remove, or modify models. All model pricing must be set to `0`. Restart the service after changes: `docker compose restart aitoearn-ai`.

#### OpenAI / Relay Service

> **Recommended: use [new-api](https://github.com/Calcium-Ion/new-api) or [one-api](https://github.com/songquanpeng/one-api)** to manage all AI models (OpenAI, Claude, Gemini, etc.) through a single endpoint.

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | API key (`aitoearn-ai` + `aitoearn-server`) | `sk-placeholder` |
| `OPENAI_BASE_URL` | API URL (`aitoearn-ai` + `aitoearn-server`) | `https://api.openai.com/v1` |

**Built-in models:**

| Model ID | Type | Description |
|----------|------|-------------|
| `gpt-5` | Chat | text/image → text |
| `gpt-image-1.5` | Image generation/edit | Sizes: 1024x1024, 1536x1024, 1024x1536, auto |

<details>
<summary>Model configuration example</summary>

```js
// Chat model → ai.models.chat
{
  name: 'gpt-5',                       // Model ID
  description: 'GPT 5',               // Display name
  inputModalities: ['text', 'image'],  // Supported input types
  outputModalities: ['text'],          // Output type
  pricing: {                           // Pricing (must be 0)
    tiers: [{ input: { text: '0', image: '0' }, output: { text: '0' } }],
  },
},

// Image model → ai.models.image.generation
{
  name: 'gpt-image-1.5',                                    // Model ID
  description: 'gpt-image-1.5',                             // Display name
  sizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],  // Supported sizes
  qualities: ['high', 'medium', 'low'],                     // Quality options
  styles: [],                                               // Style options
  pricing: '0',                                             // Price (must be 0)
},
```

</details>

#### Anthropic Claude

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-placeholder` |
| `ANTHROPIC_BASE_URL` | Anthropic API URL | `https://api.anthropic.com` |

> The Agent feature also uses these variables to call Claude.

**Built-in models:**

| Model ID | Type | Description |
|----------|------|-------------|
| `claude-opus-4-5-20251101` | Chat | Claude Opus 4.5 |
| `claude-opus-4-6` | Chat | Claude Opus 4.6 |
| `claude-sonnet-4-5-20250929` | Chat | Claude Sonnet 4.5 |

<details>
<summary>Model configuration example</summary>

```js
// Chat model → ai.models.chat
{
  name: 'claude-sonnet-4-5-20250929',  // Model ID
  description: 'Claude Sonnet 4.5',    // Display name
  inputModalities: ['text', 'image'],  // Supported input types
  outputModalities: ['text'],          // Output type
  pricing: {                           // Pricing (must be 0)
    tiers: [{ input: { text: '0', image: '0' }, output: { text: '0' } }],
  },
},
```

</details>

#### Google Gemini

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_KEY_PAIRS` | Vertex AI key pairs (JSON array) for chat and video | `'[]'` |
| `GEMINI_LOCATION` | Vertex AI region | `us-central1` |
| `GEMINI_API_KEY` | Image generation API key | |
| `GEMINI_BASE_URL` | Image generation API URL | |

`GEMINI_KEY_PAIRS` format:

```yaml
# Disabled (default)
GEMINI_KEY_PAIRS: '[]'

# Enabled
GEMINI_KEY_PAIRS: '[{"projectId":"your-project","apiKey":"your-key","keyFile":"/path/to/sa.json","bucket":"your-bucket"}]'
```

**Built-in models:**

| Model ID | Type | Description |
|----------|------|-------------|
| `gemini-3.1-pro-preview` | Chat | Gemini 3.1 Pro Preview, text/image/audio/video → text |
| `gemini-3-flash-preview` | Chat | Gemini 3 Flash Preview, text/image/audio/video → text |
| `gemini-3.1-flash-image-preview` | Image / Draft generation | NanoBanana 2, text/image → image |
| `gemini-3-pro-image-preview` | Image / Draft generation | NanoBanana Pro, text/image → image |

<details>
<summary>Model configuration example</summary>

```js
// Multimodal chat model → ai.models.chat
{
  name: 'gemini-3.1-pro-preview',                       // Model ID
  description: 'Gemini 3.1 Pro Preview',                // Display name
  inputModalities: ['text', 'image', 'audio', 'video'], // Supported input types
  outputModalities: ['text'],                           // Output type
  pricing: {                                            // Tiered pricing (must be 0)
    tiers: [
      {
        maxInputTokens: 200000,                         // Max input tokens for this tier
        input: { text: '0', image: '0', video: '0', audio: '0' },
        output: { text: '0' },
      },
      {                                                 // Pricing tier for >200K tokens
        input: { text: '0', image: '0', video: '0', audio: '0' },
        output: { text: '0' },
      },
    ],
  },
},

// Image generation model → ai.models.chat (outputModalities includes image)
{
  name: 'gemini-3.1-flash-image-preview',  // Model ID
  description: 'Nano Banana 2',            // Display name
  inputModalities: ['text', 'image'],      // Supported input types
  outputModalities: ['image'],             // Output type is image
  pricing: {                               // Pricing (must be 0)
    tiers: [{ input: { text: '0', image: '0' }, output: { text: '0', image: '0' } }],
  },
},
```

</details>

#### xAI (Grok)

| Variable | Description |
|----------|-------------|
| `GROK_API_KEY` | xAI Grok API key |

**Built-in models:**

| Model ID | Type | Description |
|----------|------|-------------|
| `grok-imagine-video` | Video generation | text/image/video → video, 720p, 1-15s |

<details>
<summary>Model configuration example</summary>

```js
// Video model → ai.models.video.generation
{
  name: 'grok-imagine-video',       // Model ID
  description: 'Grok Video',       // Display name
  channel: 'grok',                 // AI service channel
  modes: ['text2video', 'image2video', 'video2video'], // Supported generation modes
  resolutions: ['720p'],           // Supported resolutions
  durations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // Supported durations (seconds)
  maxInputImages: 1,               // Max input images
  aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'], // Supported aspect ratios
  defaults: { duration: 8, aspectRatio: '9:16' }, // Default parameters
  pricing: [                       // Per-duration pricing (must be 0)
    { duration: 5, price: 0 },
    { duration: 10, price: 0 },
    { duration: 15, price: 0 },
  ],
},
```

</details>

#### Volcengine

| Variable | Description |
|----------|-------------|
| `VOLCENGINE_API_KEY` | Volcengine API key |
| `VOLCENGINE_ACCESS_KEY_ID` | Access Key ID |
| `VOLCENGINE_SECRET_ACCESS_KEY` | Secret Access Key |
| `VOLCENGINE_VOD_SPACE_NAME` | VOD space name |

Features:
- **Doubao video generation**: Configure in `ai.models.video.generation` with channel `volcengine`
- **Aideo**: AI video editing features including style transfer, video understanding, highlight editing, facial translation, subtitle erasing, video editing, drama recap, and style migration. All pricing must be `0`

<details>
<summary>Video model configuration example</summary>

```js
// Video model → ai.models.video.generation
{
  name: 'doubao-seedance-1-0-lite-i2v',  // Model ID
  description: 'Doubao Seedance Lite',   // Display name
  channel: 'volcengine',                 // AI service channel
  modes: ['text2video', 'image2video'],  // Supported generation modes
  resolutions: ['720p', '1080p'],        // Supported resolutions
  durations: [5, 10],                    // Supported durations (seconds)
  maxInputImages: 1,                     // Max input images
  aspectRatios: ['1:1', '16:9', '9:16'], // Supported aspect ratios
  defaults: { duration: 5, aspectRatio: '16:9' }, // Default parameters
  pricing: [                             // Per-duration pricing (must be 0)
    { duration: 5, price: 0 },
    { duration: 10, price: 0 },
  ],
},
```

</details>
