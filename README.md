
# [Aitoearn: The Best Open-Source AI Agent for Content Marketing](https://aitoearn.ai)


![GitHub stars](https://img.shields.io/github/stars/yikart/AttAiToEarn?color=fa6470)
![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node\&message=20.18.x%20\&logo=node.js\&color=3f893e)](https://nodejs.org/about/releases)

English | [简体中文](README_CN.md)

**Create · Publish · Engage · Monetize — all in one platform.**

AiToEarn helps creators, brands, and businesses build, distribute, and monetize content with **AI-powered automation** across the world’s most popular platforms.

Supported Channels:
Douyin, Xiaohongshu (Rednote), WeChat Channels, Kuaishou, Bilibili, WeChat Official Accounts,
TikTok, YouTube, Facebook, Instagram, Threads, Twitter (X), Pinterest, LinkedIn

## 🎥 Demo Video

[![Watch the video](https://img.youtube.com/vi/5041jEKaiU8/0.jpg)](https://www.youtube.com/watch?v=5041jEKaiU8)

## What's new:
* 2025.11.28 : Support automatic updates within the application. Add a large number of AI functions to the creation interface, such as abbreviation, expansion, image creation, video creation, tag generation, etc., supporting Nano Banana Pro.[v1.4.0](https://github.com/yikart/AiToEarn/releases/tag/v1.4.0)
* 2025.11.12 : The first open-source, fully usable version,[v1.3.2](https://github.com/yikart/AiToEarn/releases/tag/v1.3.2)

<details>
  <summary><h2 style="display:inline;margin:0">Table of Contents</h2></summary>
  
  <br/>
  
  1. [Quick Start for Creators (Apps & Web)](#quick-start-for-creators-apps--web)
  2. [Quick Start for Developers (Docker, Recommended)](#quick-start-for-developers-docker-recommended)
  3. [Key Features](#key-features)
  4. [MCP Service](#mcp-service)
  5. [Advanced Setup](#advanced-setup)
  6. [Contribution Guide](#contribution-guide)
  7. [Contact](#contact)
  8. [Milestones](#milestones)
  9. [FAQ](#faq)
  10. [Recommended](#recommended)
</details>





## Quick Start for Creators (Apps & Web)

OS | Download
-- | --
Android |  [![Download Android](https://img.shields.io/badge/APK-Android1.4.0-green?logo=android&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.3.3/AiToEarn-1.4.0-internal-arm64-v8a.apk)
Windows |  [![Download Windows](https://img.shields.io/badge/Setup-Windows1.4.0-blue?logo=windows&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.3.3/AiToEarn-Setup-1.4.0.exe)
macOS |  [![Download macOS](https://img.shields.io/badge/DMG-macOS1.4.0-black?logo=apple&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.3.3/AiToEarn-1.4.0.dmg)
iOS |  **Coming soon!**
Web | [Use on Web](https://aitoearn.ai/en/accounts)

[Google Play Download](https://play.google.com/store/apps/details?id=com.yika.aitoearn.aitoearn_app)


## Quick Start for Developers (Docker, Recommended)

This is the easiest way to run AiToEarn. It will start the **frontend, backend, MongoDB and Redis** with one command.  
You **do NOT** need to install MongoDB or Redis on your machine manually.

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
cp env.example .env
docker compose up -d
````


### 🌐 Access Applications

After Docker starts successfully, you can access services at:

| Service                 | URL                                            | Description                                                 |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| **Web Frontend**        | [http://localhost:3000](http://localhost:3000) | Web user interface                                          |
| **Main Backend API**    | [http://localhost:3002](http://localhost:3002) | AiToEarn main server API                                    |
| **Channel Service API** | [http://localhost:7001](http://localhost:7001) | AiToEarn channel service API                                |
| **MongoDB**             | localhost:27017                                | MongoDB (inside Docker, uses username/password from `.env`) |
| **Redis**               | localhost:6379                                 | Redis (inside Docker, uses password from `.env`)            |

> ℹ️ MongoDB & Redis are both started by `docker compose`.
> You only need to configure their passwords in `.env`; no extra local installation is required.


### 🧩 Advanced Configuration (.env)

Edit the `.env` file to set secure values and customize your deployment:

```bash
# Required security configurations
MONGODB_PASSWORD=your-secure-mongodb-password
REDIS_PASSWORD=your-secure-redis-password
JWT_SECRET=your-jwt-secret-key
INTERNAL_TOKEN=your-internal-token

# If external access is needed, set your public API/domain
NEXT_PUBLIC_API_URL=http://your-domain.com:3002/api
APP_DOMAIN=your-domain.com
```

> ✅ In production, please use strong, random passwords and secrets.



<details>
<summary>🧪 Optional: Run backend & frontend manually (dev mode)</summary>

This mode is mainly for local development & debugging.
You can still use Docker for MongoDB/Redis or point to your own services via `.env`.

#### 1. Start the backend services

```bash
cd project/aitoearn-monorepo
pnpm install
npx nx serve aitoearn-channel
# in another terminal
npx nx serve aitoearn-server
```

#### 2. Start the frontend `aitoearn-web`

```bash
pnpm install
pnpm run dev
```

</details>



<details>
<summary>🖥️ Optional: Start Electron desktop project</summary>

```bash
# Clone the repo
git clone https://github.com/yikart/AttAiToEarn.git

# Enter directory
cd AttAiToEarn

# Install dependencies
npm i

# Compile sqlite (better-sqlite3 requires node-gyp and local Python)
npm run rebuild

# Start development
npm run dev
```

The Electron project provides a desktop client for AiToEarn.

</details>




## Key Features

🚀 **AiToEarn is a full-stack AI-powered content growth & monetization platform.**
From creative ideas, to multi-channel publishing, to analytics & monetization — AiToEarn helps you truly **Create · Publish · Engage · Monetize.**


### 1. Content Publishing — One-Click Multi-Platform

* **Distribute Everywhere**: Publish to the widest range of global platforms (Douyin, Kwai, WeChat Channels, WeChat Offical Account, Bilibili, Rednote, Facebook, Instagram, TikTok, LinkedIn, Threads, YouTube, Pinterest, x(Twitter)).
* **(Coming soon) Smart Import**: Import historical content for fast re-editing & redistribution.

  * Example: Sync your Xiaohongshu posts to YouTube in one click.
* **Calendar Scheduler**: Plan & coordinate content like a calendar across all platforms.
<div style="display: flex; justify-content: space-around;">
  <img src="presentation/app-screenshot/1. content publish/calendar.jpeg" width="30%">
  <img src="presentation/app-screenshot/1. content publish/support_channels.jpeg" width="30%">
</div>

### 2. Content Hotspot — Viral Inspiration Engine

* **Case Library**: Explore how others create posts with 10,000+ likes.
* **Trend Radar**: Discover the latest viral trends instantly, reduce creator anxiety.
<div style="display: flex; justify-content: space-around;">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot.jpg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot2.jpeg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot3.jpeg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot4.jpeg" width="22%">
</div>

### 3. Content Search — Brand & Market Insights

* **Brand Monitoring**: Track conversations about your brand in real-time.
* **Content Discovery**: Search for posts, topics, and communities for targeted engagement.

<div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch.gif" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch1.jpeg" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch2.jpeg" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch4.jpeg" width="22%">
</div>


### 4. Comments Search — Precision User Mining

* **Smart Comment Search**: Detect high-conversion signals like “link please” or “how to buy.”
* **Conversion Booster**: Reply instantly, drive higher engagement & sales.
 <div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/4. comments search/commentsearch.gif" width="30%">
  <img src="presentation/app-screenshot/4. comments search/commentfilter.jpeg" width="30%">
</div>

### 5. Content Engagement — Growth Engine

* **Unified Dashboard**: Manage all interactions in one place.
* **Proactive Engagement**: Join trending conversations, connect with potential customers.
* Turn **passive operations** into **active traffic growth.**

 <div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/5. content engagement/commentfilter2.jpeg" width="30%">
</div>

### 6. (Coming Soon) Content Analytics — Full-Funnel Data

* **Cross-Platform Comparison**: One platform may block traffic, but others won’t.
* **End-to-End Monitoring**: Track performance and build your path to 1M+ followers.

<img src="./presentation/data_center.png" alt="post" width="500"/>

### 7. (Coming Soon) AI Content Creation — End-to-End Assistant

* **AI Copywriting**: Auto-generate titles, captions & descriptions.
* **AI Commenting**: Engage proactively, attract traffic.
* **Image & Card Generator**: Speed up content workflows.
* **Supported AI Video Models**: Seedance, Kling, Hailuo, Veo, Medjourney, Sora, Pika, Runway.
* **Supported AI Image Models**: GPT, Flux.
* **Next**: Tag generator, smart DMs, video editing, AI avatars, translation for global distribution.


### 8. (Coming Soon) Content Marketplace — Trade & Monetize

* **Creators**: Sell your content directly, find buyers fast.
* **Brands**: Purchase ready-made, high-quality content.
* **AI-Powered Growth**:
  **Let’s use AI to earn. Let’s earn money together!**


## MCP Service
https://www.modelscope.cn/mcp/servers/whh826219822/aitoearn
https://www.npmjs.com/~aitoearn?activeTab=packages


## Advanced Setup

AiToEarn integrates with many official APIs. Developer key setup guides:

* [Bilibili](./aitoearn_web/CHANNEL_Md/BILIBILI.md)
* [WeChat Official Accounts](./aitoearn_web/CHANNEL_Md/WXPLAT.md)


## Contribution Guide

See [Contribution Guide](./aitoearn_web/CONTRIBUTING.md) to get started.


## Contact
https://t.me/harryyyy2025


## Milestones

* 2025.02.26 — Released win-0.1.1
* 2025.03.15 — Released win-0.2.0
* 2025.04.18 — Released win-0.6.0
* 2025.05.20 — Released win-0.8.0
* 2025.08.08 — [Released win-0.8.1](https://github.com/yikart/AiToEarn/releases/tag/v0.8.1)
* 2025.08.08 — [Released web-0.1-beta](./aitoearn_web/README.md)
* 2025.09.16 — [Released v1.0.18](https://github.com/yikart/AiToEarn/releases/tag/v1.0.18)
* 2025.10.01 — [Released v1.0.27](https://github.com/yikart/AiToEarn/releases/tag/v1.0.27)
* 2025.11.01 — [First Usable Version: v1.2.2](https://github.com/yikart/AiToEarn/releases/tag/v1.2.2)
* 2025.11.12 — [The first open-source, fully usable release. Released: v1.3.2](https://github.com/yikart/AiToEarn/releases/tag/v1.3.2)
---

## [FAQ](https://heovzp8pm4.feishu.cn/wiki/UksHwxdFai45SvkLf0ycblwRnTc?from=from_copylink)


## Recommended

**[AWS Activate Program](https://www.amazonaws.cn/en/campaign/ps-yunchuang/)**

**[AI Model Hub](https://api.zyai.online/)**

* [https://github.com/TMElyralab/MuseTalk](https://github.com/TMElyralab/MuseTalk)
* [https://github.com/5ime/video\_spider](https://github.com/5ime/video_spider)
* [https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file](https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file)
* [https://github.com/facefusion/facefusion](https://github.com/facefusion/facefusion)
* [https://github.com/linyqh/NarratoAI](https://github.com/linyqh/NarratoAI)
* [https://github.com/harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)



