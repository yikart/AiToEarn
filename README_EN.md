
# [Aitoearn: The Best Open-Source AI Agent for Content Marketing](https://aitoearn.ai)

<a href="https://trendshift.io/repositories/20785" target="_blank"><img src="https://trendshift.io/api/badge/repositories/20785" alt="yikart%2FAiToEarn | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

[![GitHub stars](https://img.shields.io/github/stars/yikart/AiToEarn?color=fa6470)](https://github.com/yikart/AiToEarn/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node&message=20.18.x%20&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

English | [简体中文](README.md)

**Create · Publish · Engage · Monetize — all in one platform.**

AiToEarn helps creators, brands, and businesses build, distribute, and monetize content with **AI-powered automation** across the world's most popular platforms.

Supported Channels:
Douyin, Xiaohongshu (Rednote), WeChat Channels, Kuaishou, Bilibili, WeChat Official Accounts,
TikTok, YouTube, Facebook, Instagram, Threads, Twitter (X), Pinterest, LinkedIn

## 🚀 Quick Start with AiToEarn (5 Ways)

| Option | Best for | Deployment needed? |
|--------|----------|-------------------|
| [① Use the Website](#use-web) | Everyone | ❌ No |
| [② Use in OpenClaw](#use-in-openclaw) | OpenClaw users | ❌ No |
| [③ Use in Claude / Cursor / Other AI Assistants](#use-in-claude) | AI tool users | ❌ No |
| [④ Docker One-Click Deploy](#use-docker) | Teams wanting self-hosted | ✅ Server needed |
| [⑤ Build from Source](#use-source) | Developers | ✅ Dev environment needed |

> 💡 **Options ②③④ require an API Key first.** See [How to Get an API Key](#get-api-key).

## 🎥 Demo Video
<a href="https://youtu.be/y900LxIrZT4">
  <img src="./presentation/display-1.5.2png.png" alt="Watch the video" width="480">
</a>

[![Watch the video](https://img.youtube.com/vi/5041jEKaiU8/0.jpg)](https://www.youtube.com/watch?v=5041jEKaiU8)

## What's New

- **2026-03-26**: [2.1 version](https://www.aitoearn.ai/) — Fixed numerous usability issues; added OpenClaw support for using AiToEarn directly within OpenClaw; added MCP protocol support for using AiToEarn in Claude, Cursor, and any MCP-compatible Agent or LLM.
- **2025-02-07**: [1.8.0 version](https://www.aitoearn.ai/) — We introduced support for offline business scenarios, covering restaurants, retail stores, hotels and guesthouses, beauty and hair salons, gyms, and other types of physical businesses. This feature transforms offline promotional activities into executable online distribution tasks.
- **2025-01-06**: [1.5.3 version](https://www.aitoearn.ai/) — Fixed a large number of known issues.
- **2024-12-15**: "All In Agent" arrives! We've introduced a super AI agent that can automatically generate and publish content, and help you operate AiToEarn. [v1.4.3](https://github.com/yikart/AiToEarn/releases/tag/v1.4.3)
- **2024-11-28**: Support automatic updates within the application. Add a large number of AI functions to the creation interface, such as abbreviation, expansion, image creation, video creation, tag generation, etc., supporting Nano Banana Pro. [v1.4.0](https://github.com/yikart/AiToEarn/releases/tag/v1.4.0)
- **2024-11-12**: The first open-source, fully usable version. [v1.3.2](https://github.com/yikart/AiToEarn/releases/tag/v1.3.2)

<details>
  <summary><h2 style="display:inline;margin:0">Table of Contents</h2></summary>

  <br/>

  1. [Quick Start with AiToEarn (5 Ways)](#-quick-start-with-aitoearn-5-ways)
  2. [How to Get an API Key](#get-api-key)
  3. [Key Features](#key-features)
  4. [Contributing](#contributing)
  5. [Contact](#contact)
  6. [FAQ](#faq)
  7. [Recommended](#recommended)
</details>

## [Key Features](https://aitoearn.ai/)

🚀 **AiToEarn is a full-stack AI-powered content growth & monetization platform.**
From creative ideas, to multi-channel publishing, to analytics & monetization — AiToEarn helps you truly **Create · Publish · Engage · Monetize.**

### Agent — AI Assistant
- **All In Agent**: Let the AI agent help you create and publish content, assisting you in operating AiToEarn.

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/agent_0.png" width="100%">
</div>

### 1. Content Publishing — One-Click Multi-Platform

* **Distribute Everywhere**: Publish to the widest range of global platforms (Douyin, Kwai, WeChat Channels, WeChat Official Accounts, Bilibili, Rednote, Facebook, Instagram, TikTok, LinkedIn, Threads, YouTube, Pinterest, X (Twitter)).
* **Smart Import**: Import historical content for fast re-editing & redistribution.
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

* **Smart Comment Search**: Detect high-conversion signals like "link please" or "how to buy."
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

### 6. Content Analytics — Full-Funnel Data

* **Cross-Platform Comparison**: One platform may block traffic, but others won't.
* **End-to-End Monitoring**: Track performance and build your path to 1M+ followers.

<img src="./presentation/data_center.png" alt="post" width="500"/>

### 7. (Coming Soon) AI Content Creation — End-to-End Assistant

* **AI Copywriting**: Auto-generate titles, captions & descriptions.
* **AI Commenting**: Engage proactively, attract traffic.
* **Image & Card Generator**: Speed up content workflows.
* **Supported AI Video Models**: Seedance, Kling, Hailuo, Veo, Midjourney, Sora, Pika, Runway.
* **Supported AI Image Models**: GPT, Flux.
* **Next**: Tag generator, smart DMs, video editing, AI avatars, translation for global distribution.

### 8. (Coming Soon) Content Marketplace — Trade & Monetize

* **Creators**: Sell your content directly, find buyers fast.
* **Brands**: Purchase ready-made, high-quality content.
* **AI-Powered Growth**:
  **Let's use AI to earn. Let's earn money together!**

---

<h2 id="use-web">① Use the Website</h2>

The simplest way — just open your browser:

- 🇨🇳 China users: **[aitoearn.cn](https://aitoearn.cn/)**
- 🌍 International users: **[aitoearn.ai](https://aitoearn.ai/)**

---

<h2 id="get-api-key">🔑 How to Get an API Key (Required for Steps Below)</h2>

> Options ②③④ all need an API Key. You only need to get it once.

**3 steps**:

1. Open [aitoearn.cn](https://aitoearn.cn/) (China) or [aitoearn.ai](https://aitoearn.ai/) (international), sign up and log in
2. Click **Settings** in the left menu
3. Go to **API Key**, click Create, and copy the generated key

<img src="app-screenshot/0.%20api-key/b4d316c4-300c-4935-a8ef-801eb18f436d.png" alt="Get API Key" width="600">

> ⚠️ Keep your API Key safe. Do not share it with others.

---

<h2 id="use-in-openclaw">② Use in OpenClaw</h2>

> Prerequisite: [Get an API Key](#get-api-key) first

Just one step — send this message to OpenClaw (replace `your-api-key` with your own):

> Help me use mcporter to install this MCP server: `https://aitoearn.ai/api/unified/mcp`, authentication header is `x-api-key: your-api-key`

OpenClaw will handle the setup automatically. After that, you can say things like "publish a post to Rednote" directly.

---

<h2 id="use-in-claude">③ Use in Claude / Cursor / Other AI Assistants</h2>

> Prerequisite: [Get an API Key](#get-api-key) first

AiToEarn works with any MCP-compatible AI assistant. Here's how to configure the most popular ones:

<details open>
<summary><b>Claude Desktop</b></summary>

Find and edit `claude_desktop_config.json`, add:

```json
{
  "mcpServers": {
    "aitoearn": {
      "type": "http",
      "url": "https://aitoearn.ai/api/unified/mcp",
      "headers": {
        "x-api-key": "your-api-key"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

In Cursor's MCP settings, add:

```
MCP URL: https://aitoearn.ai/api/unified/mcp
Auth Header: x-api-key: your-api-key
```

</details>

<details>
<summary><b>Other AI Assistants (Generic Config)</b></summary>

Any MCP-compatible tool just needs two pieces of info:

| Setting | Value |
|---------|-------|
| **MCP URL** | `https://aitoearn.ai/api/unified/mcp` |
| **Auth Header** | `x-api-key: your-api-key` |

SSE transport is also available: `https://aitoearn.ai/api/unified/sse`

</details>

> 💡 For self-hosted instances, replace `aitoearn.ai` with your own address (e.g., `localhost:8080`).

---

<h2 id="use-docker">④ Docker One-Click Deploy</h2>

> Prerequisite: [Docker](https://docs.docker.com/get-docker/) installed

For teams wanting to run AiToEarn on their own server. 3 commands, no manual database setup:

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
docker compose up -d
```

Open **[http://localhost:8080](http://localhost:8080)** and you're ready to go.

#### Configure Relay (Strongly Recommended)

> **Why Relay?** Publishing content requires logging into social media accounts (TikTok, Instagram, YouTube, etc.), which need OAuth developer credentials. With Relay, you can use the official aitoearn.ai credentials — **no need to register as a developer on each platform**.

Add to `docker-compose.yml` under `aitoearn-server` (see [How to Get an API Key](#get-api-key)):

```yaml
RELAY_SERVER_URL: https://aitoearn.ai/api
RELAY_API_KEY: your-api-key
RELAY_CALLBACK_URL: http://127.0.0.1:8080/api/plat/relay-callback
```

Then restart: `docker compose restart aitoearn-server`

> 📖 Full deployment guide (production config, AI services, OAuth, storage, etc.): [DOCKER_DEPLOYMENT_EN.md](DOCKER_DEPLOYMENT_EN.md).

---

<h2 id="use-source">⑤ Build from Source</h2>

<details>
<summary>🧪 Run backend & frontend manually (dev mode)</summary>

For local development and debugging. You can use Docker for MongoDB/Redis, or point to your own services.

#### 1. Start the backend services

```bash
cd project/aitoearn-backend
pnpm install
cp apps/aitoearn-ai/config/config.js apps/aitoearn-ai/config/local.config.js
cp apps/aitoearn-server/config/config.js apps/aitoearn-server/config/local.config.js
pnpm nx serve aitoearn-ai
# in another terminal
pnpm nx serve aitoearn-server
```

#### 2. Start the frontend `aitoearn-web`

```bash
pnpm install
pnpm run dev
```

</details>

<details>
<summary>🖥️ Start Electron desktop project</summary>

```bash
git clone https://github.com/yikart/AttAiToEarn.git
cd AttAiToEarn
npm i
npm run rebuild
npm run dev
```

The Electron project provides a desktop client for AiToEarn.

</details>

## Contributing

Please see [Contributing Guide](./CONTRIBUTING.md) to get started.

## Contact

- Telegram: [https://t.me/harryyyy2025](https://t.me/harryyyy2025)

## [FAQ](https://heovzp8pm4.feishu.cn/wiki/UksHwxdFai45SvkLf0ycblwRnTc?from=from_copylink)

## Recommended

* [MuseTalk](https://github.com/TMElyralab/MuseTalk)
* [video_spider](https://github.com/5ime/video_spider)
* [CosyVoice](https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file)
* [facefusion](https://github.com/facefusion/facefusion)
* [NarratoAI](https://github.com/linyqh/NarratoAI)
* [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)
