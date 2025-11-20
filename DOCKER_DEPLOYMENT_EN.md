# AiToEarn Docker Deployment Guide

This guide will help you quickly deploy the complete AiToEarn application stack using Docker Compose.

## 📋 Prerequisites

Before you begin, ensure your system has:

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher

Verify installation:
```bash
docker --version
docker compose version
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
```

### 2. Configure Environment Variables

Copy the environment variable template file and modify it according to your needs:

```bash
cp env.example .env
```

Edit the `.env` file. At minimum, modify these critical configurations:

```bash
# Required security configurations
MONGODB_PASSWORD=your-secure-mongodb-password
REDIS_PASSWORD=your-secure-redis-password
JWT_SECRET=your-jwt-secret-key
INTERNAL_TOKEN=your-internal-token

# If external access is needed, modify API address
NEXT_PUBLIC_API_URL=http://your-domain.com:3002/api
APP_DOMAIN=your-domain.com
```

> ⚠️ **Security Warning**: Always change default passwords and secrets. Never use default values in production!

### 3. Start Services

Launch all services using Docker Compose:

```bash
docker compose up -d
```

The first startup will pull images, which may take a few minutes.

### 4. Check Service Status

```bash
docker compose ps
```

All services should show status as `healthy` or `running`.

### 5. View Logs

View all service logs:
```bash
docker compose logs -f
```

View specific service logs:
```bash
docker compose logs -f aitoearn-web
docker compose logs -f aitoearn-server
docker compose logs -f aitoearn-channel
```

## 🌐 Access Applications

After successful startup, you can access services at the following addresses:

| Service | URL | Description |
|---------|-----|-------------|
| **Web Frontend** | http://localhost:3000 | Web User Interface |
| **Main Backend API** | http://localhost:3002 | AiToEarn Server API |
| **Channel Service API** | http://localhost:7001 | AiToEarn Channel API |
| **MongoDB** | localhost:27017 | Database (authentication required) |
| **Redis** | localhost:6379 | Cache Service (password required) |
