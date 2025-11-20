# [Aitoearn：最佳开源 AI 内容营销智能体](https://aitoearn.ai)

![GitHub stars](https://img.shields.io/github/stars/yikart/AttAiToEarn?color=fa6470)
![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node&message=20.18.x%20&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

[简体中文](README_CN.md) | English

**Create · Publish · Engage · Monetize —— 一站式平台。**

AiToEarn 通过**AI 自动化**，帮助创作者、品牌与企业在全球主流平台上构建、分发并变现内容。

支持渠道：  
抖音、小红书（Rednote）、视频号、快手、哔哩哔哩、微信公众号，
TikTok、YouTube、Facebook、Instagram、Threads、Twitter（X）、Pinterest、LinkedIn

<details>
  <summary><h2 style="display:inline;margin:0">目录</h2></summary>

  <br/>

  1. [创作者快速开始（应用程序与网页版）](#quick-start-for-creators)
  2. [开发者快速开始（Docker，推荐）](#quick-start-for-developers)
  3. [核心功能](#key-features)
  4. [MCP 服务](#mcp-service)
  5. [高级设置](#advanced-setup)
  6. [贡献指南](#contribution-guide)
  7. [联系](#contact)
  8. [里程碑](#milestones)
  9. [常见问题](#faq)
  10. [推荐](#recommended)
</details>

## 创作者快速开始（应用程序与网页版）

| 操作系统 | 下载 |
| -- | -- |
| Android |  [![Download Android](https://img.shields.io/badge/APK-Android1.3.2-green?logo=android&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.3.2/AiToEarn-1.3.2-internal-arm64-v8a.apk) |
| Windows |  [![Download Windows](https://img.shields.io/badge/Setup-Windows1.3.2-blue?logo=windows&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.3.2/AiToEarn-Setup-1.3.2.exe) |
| macOS |  [![Download macOS](https://img.shields.io/badge/DMG-macOS1.3.2-black?logo=apple&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.3.2/AiToEarn+1.3.2.dmg) |
| iOS |  **即将推出！** |
| Web | [网页版使用](https://aitoearn.ai/en/accounts) |

[Google Play 下载](https://play.google.com/store/apps/details?id=com.yika.aitoearn.aitoearn_app)

## 开发者快速开始（Docker，推荐）

这是运行 AiToEarn 最简单的方式。它将通过一条命令启动**前端、后端、MongoDB 和 Redis**。  
您**无需**在机器上手动安装 MongoDB 或 Redis。

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
cp env.example .env
docker compose up -d
```

### 🌐 访问应用

Docker 成功启动后，您可以通过以下地址访问服务：

| 服务                 | URL                                            | 描述                                                 |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| **Web 前端**        | [http://localhost:3000](http://localhost:3000) | Web 用户界面                                          |
| **主后端 API**    | [http://localhost:3002](http://localhost:3002) | AiToEarn 主服务器 API                                    |
| **渠道服务 API** | [http://localhost:7001](http://localhost:7001) | AiToEarn 渠道服务 API                                |
| **MongoDB**             | localhost:27017                                | MongoDB（在 Docker 内部，使用 `.env` 中的用户名/密码） |
| **Redis**               | localhost:6379                                 | Redis（在 Docker 内部，使用 `.env` 中的密码）            |

> ℹ️ MongoDB 和 Redis 都由 `docker compose` 启动。
> 您只需在 `.env` 中配置它们的密码；无需额外的本地安装。

### 🧩 高级配置（.env）

编辑 `.env` 文件以设置安全值并自定义您的部署：

```bash
# 必需的安全配置
MONGODB_PASSWORD=your-secure-mongodb-password
REDIS_PASSWORD=your-secure-redis-password
JWT_SECRET=your-jwt-secret-key
INTERNAL_TOKEN=your-internal-token

# 如果需要外部访问，请设置您的公共 API/域名
NEXT_PUBLIC_API_URL=http://your-domain.com:3002/api
APP_DOMAIN=your-domain.com
```

> ✅ 在生产环境中，请使用强随机密码和密钥。

<details>
<summary>🧪 可选：手动运行后端和前端（开发模式）</summary>

此模式主要用于本地开发和调试。
您仍然可以使用 Docker 运行 MongoDB/Redis，或通过 `.env` 指向您自己的服务。

#### 1. 启动后端服务

```bash
cd project/aitoearn-monorepo
pnpm install
npx nx serve aitoearn-channel
# 在另一个终端
npx nx serve aitoearn-server
```

#### 2. 启动前端 `aitoearn-web`

```bash
pnpm install
pnpm run dev
```

</details>

<details>
<summary>🖥️ 可选：启动 Electron 桌面项目</summary>

```bash
# 克隆仓库
git clone https://github.com/yikart/AttAiToEarn.git

# 进入目录
cd AttAiToEarn

# 安装依赖
npm i

# 编译 sqlite（better-sqlite3 需要 node-gyp 和本地 Python）
npm run rebuild

# 启动开发
npm run dev
```

Electron 项目为 AiToEarn 提供桌面客户端。

</details>

<h2 id="key-features">核心功能</h2>

🚀 **AiToEarn 是一个全链条的 AI 驱动内容增长与变现平台。**
从创意灵感，到多平台分发，再到数据分析与变现——AiToEarn 让你真正实现 **Create · Publish · Engage · Monetize**。

### 1. 内容发布 —— 一键多平台

- **全网分发**：覆盖最广的平台矩阵（Douyin、Kwai、WeChat Channels、WeChat Offical Accounts、 Bilibili、Rednote、Facebook、Instagram、TikTok、LinkedIn、Threads、YouTube、Pinterest、X（Twitter））。
- **（即将推出）智能导入**：导入历史内容，快速二次编辑与再分发。

  - 例如：一键将你的小红书内容同步到 YouTube。

- **日历排期**：像排日程一样统一规划所有平台的内容。

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/app-screenshot/1. content publish/calendar.jpeg" width="30%">
  <img src="presentation/app-screenshot/1. content publish/support_channels.jpeg" width="30%">
</div>

### 2. 热点灵感 —— 爆款灵感引擎

- **案例库**：浏览 1 万＋点赞量级内容的创作方法。
- **趋势雷达**：第一时间捕捉热点，缓解创作者焦虑。

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot.jpg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot2.jpeg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot3.jpeg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot4.jpeg" width="22%">
</div>

### 3. 内容搜索 —— 品牌与市场洞察

- **品牌监测**：实时追踪关于你品牌的讨论。
- **内容发现**：按主题、话题与社区检索，以更精准地参与互动。

<div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch.gif" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch1.jpeg" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch2.jpeg" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch4.jpeg" width="22%">
</div>

### 4. 评论搜寻 —— 精准用户挖掘

- **智能评论检索**：识别“求链接”“怎么购买”等高转化信号。
- **转化加速器**：快速回复，驱动更高互动与销量。

<div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/4. comments search/commentsearch.gif" width="30%">
  <img src="presentation/app-screenshot/4. comments search/commentfilter.jpeg" width="30%">
</div>

### 5. 互动运营 —— 增长引擎

- **统一工作台**：在一个界面管理全部互动。
- **主动参与**：跟进热点话题，连接潜在用户。
  将**被动运营**转变为**主动引流**。

<div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/5. content engagement/commentfilter2.jpeg" width="30%">
</div>

### 6.（即将推出）数据分析 —— 全链路漏斗

- **跨平台对比**：某个平台限流？其他平台一样能打。
- **端到端监控**：追踪表现，构建通往 100 万＋粉丝的路线图。

<img src="./presentation/data_center.png" alt="数据中心" width="500"/>

### 7.（即将推出）AI 内容创作 —— 端到端助手

- **AI 文案**：自动生成标题、文案与描述。
- **AI 评论**：主动互动，吸引流量。
- **图片与卡片生成**：加速内容工作流。
- **支持的视频模型**：Seedance、Kling、海螺（Hailuo）、Veo、Medjourney、Sora、Pika、Runway。
- **支持的图像模型**：GPT、Flux。
- **下一步**：标签生成、智能私信、视频剪辑、AI 数字人、全球分发多语种翻译等。

### 8.（即将推出）内容交易市场 —— 创作即变现

- **创作者**：直接出售你的内容，高效找到买家。
- **品牌方**：即买即用的优质内容资源。
- **AI 驱动增长**：
  **让我们用 AI 赚钱，一起赚！**

<h2 id="mcp-service">MCP 服务</h2>

https://www.modelscope.cn/mcp/servers/whh826219822/aitoearn

https://www.npmjs.com/~aitoearn?activeTab=packages

<h2 id="advanced-setup">高级设置</h2>

AiToEarn 集成了多种官方 API。以下是开发者密钥配置指南：

- [B 站（Bilibili）](./aitoearn_web/CHANNEL_Md/BILIBILI.md)
- [微信公众号（WeChat Official Accounts）](./aitoearn_web/CHANNEL_Md/WXPLAT.md)

<h2 id="contribution-guide">贡献指南</h2>

请查看 [贡献指南](./aitoearn_web/CONTRIBUTING.md) 开始参与。

<h2 id="contact">联系</h2>

[https://t.me/harryyyy2025](https://t.me/harryyyy2025)

<h2 id="milestones">里程碑</h2>

- 2025.02.26 — 发布 win-0.1.1
- 2025.03.15 — 发布 win-0.2.0
- 2025.04.18 — 发布 win-0.6.0
- 2025.05.20 — 发布 win-0.8.0
- 2025.08.08 — [发布 win-0.8.1](https://github.com/yikart/AiToEarn/releases/tag/v0.8.1)
- 2025.08.08 — [发布 web-0.1-beta](./aitoearn_web/README.md)
- 2025.09.16 — [发布 v1.0.18](https://github.com/yikart/AiToEarn/releases/tag/v1.0.18)
- 2025.10.01 — [发布 v1.0.27](https://github.com/yikart/AiToEarn/releases/tag/v1.0.27)
- 2025.11.01 — [首个可用版本：v1.2.2](https://github.com/yikart/AiToEarn/releases/tag/v1.2.2)
- 2025.11.12 — [首个开源、完全可用的版本。发布：v1.3.2](https://github.com/yikart/AiToEarn/releases/tag/v1.3.2)

---

## [常见问题](https://heovzp8pm4.feishu.cn/wiki/UksHwxdFai45SvkLf0ycblwRnTc?from=from_copylink)

<h2 id="recommended">推荐</h2>

**[AWS Activate Program](https://www.amazonaws.cn/en/campaign/ps-yunchuang/)**

**[AI Model Hub](https://api.zyai.online/)**

- [https://github.com/TMElyralab/MuseTalk](https://github.com/TMElyralab/MuseTalk)
- [https://github.com/5ime/video_spider](https://github.com/5ime/video_spider)
- [https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file](https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file)
- [https://github.com/facefusion/facefusion](https://github.com/facefusion/facefusion)
- [https://github.com/linyqh/NarratoAI](https://github.com/linyqh/NarratoAI)
- [https://github.com/harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)
