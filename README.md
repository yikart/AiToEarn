
# [Aitoearn: The Best Open-Source AI Agent for Content Marketing](https://aitoearn.ai)


![GitHub stars](https://img.shields.io/github/stars/yikart/AttAiToEarn?color=fa6470)
![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node\&message=20.18.x%20\&logo=node.js\&color=3f893e)](https://nodejs.org/about/releases)

[简体中文](README.md) | English



**Create · Publish · Engage · Monetize — all in one platform.**

AiToEarn helps creators, brands, and businesses build, distribute, and monetize content with **AI-powered automation** across the world’s most popular platforms.

Supported Channels:
Douyin, Xiaohongshu (Rednote), WeChat Channels, Kuaishou, Bilibili, WeChat Official Accounts,
TikTok, YouTube, Facebook, Instagram, Threads, Twitter (X), Pinterest


## Table of Contents

1. [Quick Start (Web)](#quick-start-web)
2. [Quick Start (Windows)](#quick-start-windows)
3. [Key Features](#key-features)
4. [MCP Service (Coming Soon)](#mcp-service-coming-soon)
5. [Advanced Setup](#advanced-setup)
6. [Contribution Guide](#contribution-guide)
7. [Contact](#contact)
8. [Milestones](#milestones)
9. [FAQ](#faq)
10. [Recommended](#recommended)


## Quick Start (Web)

### 1. Start the backend service

[👉 Try the web version](https://aitoearn.ai)

For local setup:
Create a `local.config.js` file under the `config` directory (copy from `./aitoearn_web/server/aitoearn-user/config/dev.config.js` and adjust configs).

```bash
pnpm install
pnpm run dev:local
```

### 2. Start the frontend `aitoearn-web`

```bash
pnpm install
pnpm run dev
```


## Quick Start (Windows)

[⬇️ Download the latest Windows version (0.8.1)](https://github.com/yikart/AiToEarn/releases/download/0.8.1/AiToEarn-0.8.1.exe)

```sh
# Clone the repo
git clone https://github.com/yikart/AttAiToEarn.git

# Enter directory
cd AttAiToEarn

# Install dependencies
npm i

# Compile sqlite (better-sqlite3 requires node-gyp, Python must be installed locally)
npm run rebuild

# Start development
npm run dev
```


## Key Features

🚀 **AiToEarn is a full-stack AI-powered content growth & monetization platform.**
From creative ideas, to multi-channel publishing, to analytics & monetization — AiToEarn helps you truly **Create · Publish · Engage · Monetize.**


### 1. Content Publishing — One-Click Multi-Platform

* **Distribute Everywhere**: Publish to the widest range of global platforms (Douyin, Kwai, WeChat, Bilibili, Rednote, Facebook, Instagram, TikTok, LinkedIn, Threads, Bluesky, YouTube Shorts, Pinterest, Google Business, Mastodon, X).
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


## MCP Service (Coming Soon)


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



