## [Aitoearn:最好用的开源内容营销AI Agent！](https://aitoearn.ai)
![GitHub stars](https://img.shields.io/github/stars/yikart/AttAiToEarn?color=fa6470)
![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node&message=20.18.x%20&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

[English](README_EN.md) | 简体中文



AI内容制作，分发，互动，出售。

支持平台：
抖音、小红书、视频号、快手、bilibili、公众号、
Tiktok、Youtube、Facebook、Instagram、Threads、Twitter、Pinterest

## 目录
1. [快速开始（Web 版）](#快速开始web-版)
2. [快速开始（Windows 版）](#快速开始windows-版)
3. [核心功能](#核心功能)
4. [MCP 服务（即将上线）](#mcp-服务即将上线)
5. [高级设置](#高级设置)
6. [贡献指南](#贡献指南)
7. [加我微信](#加我微信)
8. [里程碑](#里程碑)
9. [常见问题](#常见问题)
10. [友情链接](#友情链接)

## 快速开始（Web 版）
### 1. 启动后端服务模块
[直接访问web网站](https://aitoearn.ai)

本地启动：在 config 目录下创建 `local.config.js` 文件（复制 `./aitoearn_web/server/aitoearn-user/config/dev.config.js` 文件并修改配置）

```bash
pnpm install
pnpm run dev:local
```

### 2. 启动前端项目 `aitoearn-web`

```bash
pnpm install
pnpm run dev
```

## 快速开始（Windows 版）
[直接下载最新版本0.8.1(windows)](https://github.com/yikart/AiToEarn/releases/download/0.8.1/AiToEarn-0.8.1.exe)


```sh
# 克隆项目
git clone https://github.com/yikart/AttAiToEarn.git

# 进入目录
cd AttAiToEarn

# 安装依赖
npm i

# 编译sqlite, better-sqlite3对node-gyp有依赖，需要本地有python环境,请自行查阅node-gyp安装资料
npm run rebuild

# develop
npm run dev
```

## 核心功能

🚀Aitoearn 不只是一个内容管理工具，它是一整套 **AI 驱动的全链路内容增长与变现平台**。
从创意灵感到多平台分发，再到数据分析和商业化，Aitoearn 让你的内容真正做到：
**Create · Publish · Engage · Monetize**


### 1. Content Publishing — 一键发布 · 多平台触达

* **多平台分发**：支持全球最多主流社交平台（Douyin, Kwai, Wechat, Bilibili, Rednote, Facebook, Instagram, TikTok, LinkedIn, Threads, Bluesky, YouTube Shorts, Pinterest, Google Business, Mastodon, X）。
* **（即将上线）智能导入**：直接导入历史内容，快速编辑、二次分发。

  * 例如：小红书创作者可一键同步到 YouTube，让更多用户看到。
* **日历编排**：像操作日历一样规划内容，实现多平台协同发布。
<div style="display: flex; justify-content: space-around;">
  <img src="presentation/app-screenshot/1. content publish/calendar.jpeg" width="30%">
  <img src="presentation/app-screenshot/1. content publish/support_channels.jpeg" width="30%">
</div>



### 2. Content Hotspot — 爆款灵感引擎

* **爆款案例库**：随时查看他人如何打造 10,000+ 点赞的内容。
* **趋势捕捉**：快速发现流行趋势，降低创作焦虑。
<div style="display: flex; justify-content: space-around;">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot.jpg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot2.jpeg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot3.jpeg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot4.jpeg" width="22%">
</div>



### 3. Content Search — 品牌与市场洞察

* **品牌监控**：实时追踪品牌相关讨论，第一时间响应。
* **内容搜索**：找到目标帖子和话题，高效互动，精准拓展市场。
<div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch.gif" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch1.jpeg" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch2.jpeg" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch4.jpeg" width="22%">
</div>


### 4. Comments Search — 精准用户挖掘

* 用户真实需求往往藏在 **评论区**。
* **智能评论搜索**：快速发现“求链接”“怎么购买”等高转化信号。
* **精准转化**：主动回复，提升流量变现效率。
 <div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/4. comments search/commentsearch.gif" width="30%">
  <img src="presentation/app-screenshot/4. comments search/commentfilter.jpeg" width="30%">
</div>


### 5. Content Engagement — 互动与增长引擎

* **统一后台**：集中管理所有内容，互动零遗漏。
* **主动运营**：参与热门话题，与潜在用户双向互动。
* 把 **“被动内容运营”** 变成 **“主动流量经营”**。
 <div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/5. content engagement/commentfilter2.jpeg" width="30%">
</div>


### 6. （即将上线）Content Analytics — 全景化数据视图

* **多平台对比**：一个平台不给流量，不代表所有平台不给。
* **全链路监控**：追踪内容表现，助力打造下一个百万博主。
<img src="./presentation/data_center.png" alt="post" width="500"/>

### 7. （即将上线）AI Content Creation — 全流程 AI 助手

* **AI 文案生成**：自动生成标题、描述，高效产出。
* **AI 评论生成**：主动出击，获取流量。
* **图文卡片生成**，全流程加速创作。
* **支持主流 AI 视频模型**：Seedance, Kling, Hailuo, Veo, Medjourney, Sora, Pika, Runway。
* **支持主流 AI 图片模型**：GPT, Flux。
* **即将上线功能**：标签生成器、自动私信管理、智能剪辑、数字人生成、视频翻译 —— 助力多语言全球化内容分发。



### 8. （即将上线）Content Marketplace — 内容交易与变现

* **创作者变现**：在平台直接出售内容，让优质作品快速找到买家。
* **品牌采购**：企业可直接购买现成内容，节省时间与成本。
* **AI 赋能**：让创作变成收益 ——
  **Let’s use AI to earn. Let’s earn money together!**




## MCP 服务（即将上线！）

## 高级设置
Aitoearn使用了大量的官方开放接口，可以参考下述教程申请开发者key
1. [Bilibili](./aitoearn_web/CHANNEL_Md/BILIBILI.md)
1. [微信公众号](./aitoearn_web/CHANNEL_Md/WXPLAT.md)


## 贡献指南
请查看 [贡献指南](./aitoearn_web/CONTRIBUTING.md) 了解如何参与项目开发。

## 加我微信
辛苦备注一下 AiToEarn

<img src="./wechat.jpg" alt="wechat" width="500"/>


## 里程碑
- 2025.2.26 发布win-0.1.1版本
- 2025.3.15 发布win-0.2.0版本
- 2025.4.18 发布win-0.6.0版本
- 2025.5.20 发布win-0.8.0版本
- 2025.8.8 [发布win-0.8.1版本](https://github.com/yikart/AiToEarn/releases/tag/v0.8.1)
- 2025.8.8 [发布web-0.1-beta版本](./aitoearn_web/README.md)


## [常见问题](https://heovzp8pm4.feishu.cn/wiki/UksHwxdFai45SvkLf0ycblwRnTc?from=from_copylink)


## 友情链接

**[AWS云创计划](https://www.amazonaws.cn/en/campaign/ps-yunchuang/)**


**[AI模型中转站](https://api.zyai.online/)**

https://github.com/TMElyralab/MuseTalk

https://github.com/5ime/video_spider

https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file

https://github.com/facefusion/facefusion

https://github.com/linyqh/NarratoAI

https://github.com/harry0703/MoneyPrinterTurbo

