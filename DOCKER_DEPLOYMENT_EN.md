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
export JWT_SECRET="$(openssl rand -hex 32)"
```

Before starting, set `auth.secret` in both mounted `config.yaml` files to the value of
`JWT_SECRET` above so the auto-login token issued by the initialization script can be verified.
Generate a separate internal token with `openssl rand -hex 32` and configure it as
`auth.internalToken` in both files. Set the backend's `aiClient.token` to the AI service's
`auth.internalToken`. These fields have no defaults; empty values, whitespace, and values
shorter than 32 characters prevent startup. Retain the configured values for restarts and
replicas, and do not commit them to a public repository.

```bash
docker compose up -d
```

First startup pulls images — may take a few minutes. Run `docker compose ps` to confirm all services are `healthy` or `running`.

### Step 2: Open the UI

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
2. Open the deployed UI in your browser and go to **Configuration**
3. Select **Server → Relay** and configure Relay for publishing platform authorization
4. To use AI models provided by the platform, select **AI → Relay** and configure AI Relay
5. For OpenAI, Gemini, Anthropic, and other model providers, you can also fill in the platform-provided API key and API URL under **AI → Model providers**
6. After saving, click **Save and restart** so the corresponding service reloads the configuration

China keys must use `https://aitoearn.cn/api`, and international keys must use `https://aitoearn.ai/api`; mismatched environments return 401.

**You're all set!** 🎉

## Operations Reference

### Auto-Login

Enabled by default. On first startup, `aitoearn-init` generates an admin token saved to a shared volume. `aitoearn-web` reads it automatically.

### Image Pull Policy

All app images use `pull_policy: always` to pull the latest on every `docker compose up`.

### Internal Service Communication

These settings handle inter-service communication via Docker networking. Usually no changes needed:

| Setting | Service | Default |
|----------|---------|---------|
| `serverClient.baseUrl` | aitoearn-ai | `http://aitoearn-server:3002` |
| `aiClient.baseUrl` | aitoearn-server | `http://aitoearn-ai:3010` |

### Config Files

Mounted as writable volumes and editable from the Configuration UI. Restart the corresponding service after changes:

| File | Mounted to | Description |
|------|------------|-------------|
| `project/aitoearn-backend/apps/aitoearn-ai/config/config.yaml` | aitoearn-ai:/app/config.yaml | AI service config |
| `project/aitoearn-backend/apps/aitoearn-server/config/config.yaml` | aitoearn-server:/app/config.yaml | Backend config |

---

## Configuration Quick Reference

`aitoearn-ai` and `aitoearn-server` no longer use `docker-compose.yml` `environment` entries for runtime settings. They read the mounted `config.yaml`, which you can edit from the Configuration UI.

### Environment Variables Still Kept in Compose

| Variable | Service(s) | Description | Default |
|----------|------------|-------------|---------|
| `MONGO_INITDB_ROOT_PASSWORD` | mongodb | MongoDB root password | `password` |
| `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` | rustfs | RustFS credentials | `rustfsadmin` |
| `JWT_SECRET` | aitoearn-init | Must match the backend's `auth.secret` | Required; no default |
| `MONGO_URI` / `DB_NAME` / `AUTO_LOGIN_TOKEN_PATH` | aitoearn-init | First-start admin initialization and auto-login token | Built-in defaults |
| `NODE_ENV` / `NEXT_TELEMETRY_DISABLED` | aitoearn-web | Web runtime mode and Next.js telemetry setting | `production` / `1` |
