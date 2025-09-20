
# [Aitoearn：最佳开源 AI 内容营销智能体](https://aitoearn.ai)

![GitHub stars](https://img.shields.io/github/stars/yikart/AttAiToEarn?color=fa6470)
![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node\&message=20.18.x%20\&logo=node.js\&color=3f893e)](https://nodejs.org/about/releases)

[简体中文](README_CN.md) | English

**Create · Publish · Engage · Monetize —— 一站式平台。**

AiToEarn 通过**AI 自动化**，帮助创作者、品牌与企业在全球主流平台上构建、分发并变现内容。

支持渠道：  
抖音（Douyin）、小红书（Rednote）、视频号（WeChat Channels）、快手（Kuaishou）、哔哩哔哩（Bilibili）、微信公众号（WeChat Official Accounts）、TikTok、YouTube、Facebook、Instagram、Threads、Twitter（X）、Pinterest

<details>
  <summary><h2 style="display:inline;margin:0">目录</h2></summary>

  <br/>

  1. [快速开始](#quick-start)
  2. [启动 Web 项目](#start-web-project)
  3. [启动 Electron 项目](#start-electron-project)
  4. [核心功能](#key-features)
  5. [MCP 服务](#mcp-service)
  6. [高级设置](#advanced-setup)
  7. [贡献指南](#contribution-guide)
  8. [联系](#contact)
  9. [里程碑](#milestones)
  10. [常见问题](#faq)
  11. [推荐](#recommended)
</details>

<h2 id="quick-start">快速开始</h2>

操作系统 | 下载
-- | --
Android |  [![Download Android](https://img.shields.io/badge/APK-Android1.0.18-green?logo=android&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.0.18/app-release-1.0.18.apk)
Windows |  [![Download Windows](https://img.shields.io/badge/Setup-Windows1.0.18-blue?logo=windows&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.0.18/AiToEarnSetup-1.0.18.exe)
macOS |  [![Download macOS](https://img.shields.io/badge/DMG-macOS1.0.18-black?logo=apple&logoColor=white)](https://aitoearn-download.s3.ap-southeast-1.amazonaws.com/aitoearn-download/1.0.18/AiToEarn+1.0.18.dmg)
iOS |  **即将推出！**

[Google Play 下载](https://play.google.com/store/apps/details?id=com.yika.aitoearn.aitoearn_app)

[立即在线使用](https://aitoearn.ai/en/accounts)

<h2 id="start-web-project">启动 Web 项目</h2>

### 1. 启动后端服务

用于本地开发：  
在 `config` 目录下创建 `local.config.js`（可从 `./aitoearn_web/server/aitoearn-user/config/dev.config.js` 复制并按需修改）。

```bash
pnpm install
pnpm run dev:local
````

### 2. 启动前端 `aitoearn-web`

```bash
pnpm install
pnpm run dev
```

<h2 id="start-electron-project">启动 Electron 项目</h2>

```sh
# 克隆仓库
git clone https://github.com/yikart/AttAiToEarn.git

# 进入目录
cd AttAiToEarn

# 安装依赖
npm i

# 编译 sqlite（better-sqlite3 依赖 node-gyp，本地需安装 Python）
npm run rebuild

# 启动开发
npm run dev
```

<h2 id="key-features">核心功能</h2>

🚀 **AiToEarn 是一个全链条的 AI 驱动内容增长与变现平台。**
从创意灵感，到多平台分发，再到数据分析与变现——AiToEarn 让你真正实现 **Create · Publish · Engage · Monetize**。

### 1. 内容发布 —— 一键多平台

* **全网分发**：覆盖最广的平台矩阵（Douyin、Kwai、WeChat、Bilibili、Rednote、Facebook、Instagram、TikTok、LinkedIn、Threads、Bluesky、YouTube Shorts、Pinterest、Google Business、Mastodon、X）。
* **（即将推出）智能导入**：导入历史内容，快速二次编辑与再分发。

  * 例如：一键将你的小红书内容同步到 YouTube。
* **日历排期**：像排日程一样统一规划所有平台的内容。

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/app-screenshot/1. content publish/calendar.jpeg" width="30%">
  <img src="presentation/app-screenshot/1. content publish/support_channels.jpeg" width="30%">
</div>

### 2. 热点灵感 —— 爆款灵感引擎

* **案例库**：浏览 1 万＋点赞量级内容的创作方法。
* **趋势雷达**：第一时间捕捉热点，缓解创作者焦虑。

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot.jpg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot2.jpeg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot3.jpeg" width="22%">
  <img src="presentation/app-screenshot/2. content hotspot/hotspot4.jpeg" width="22%">
</div>

### 3. 内容搜索 —— 品牌与市场洞察

* **品牌监测**：实时追踪关于你品牌的讨论。
* **内容发现**：按主题、话题与社区检索，以更精准地参与互动。

<div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch.gif" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch1.jpeg" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch2.jpeg" width="22%">
  <img src="presentation/app-screenshot/3.%20content%20search/contentsearch4.jpeg" width="22%">
</div>

### 4. 评论搜寻 —— 精准用户挖掘

* **智能评论检索**：识别“求链接”“怎么购买”等高转化信号。
* **转化加速器**：快速回复，驱动更高互动与销量。

<div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/4. comments search/commentsearch.gif" width="30%">
  <img src="presentation/app-screenshot/4. comments search/commentfilter.jpeg" width="30%">
</div>

### 5. 互动运营 —— 增长引擎

* **统一工作台**：在一个界面管理全部互动。
* **主动参与**：跟进热点话题，连接潜在用户。
  将**被动运营**转变为**主动引流**。

<div style="display:flex; justify-content:space-between; align-items:center;">
  <img src="presentation/app-screenshot/5. content engagement/commentfilter2.jpeg" width="30%">
</div>

### 6.（即将推出）数据分析 —— 全链路漏斗

* **跨平台对比**：某个平台限流？其他平台一样能打。
* **端到端监控**：追踪表现，构建通往 100 万＋粉丝的路线图。

<img src="./presentation/data_center.png" alt="数据中心" width="500"/>

### 7.（即将推出）AI 内容创作 —— 端到端助手

* **AI 文案**：自动生成标题、文案与描述。
* **AI 评论**：主动互动，吸引流量。
* **图片与卡片生成**：加速内容工作流。
* **支持的视频模型**：Seedance、Kling、海螺（Hailuo）、Veo、Medjourney、Sora、Pika、Runway。
* **支持的图像模型**：GPT、Flux。
* **下一步**：标签生成、智能私信、视频剪辑、AI 数字人、全球分发多语种翻译等。

### 8.（即将推出）内容交易市场 —— 创作即变现

* **创作者**：直接出售你的内容，高效找到买家。
* **品牌方**：即买即用的优质内容资源。
* **AI 驱动增长**：
  **让我们用 AI 赚钱，一起赚！**

<h2 id="mcp-service">MCP 服务</h2>

[https://www.modelscope.cn/mcp/servers/whh826219822/aitoearn](https://www.modelscope.cn/mcp/servers/whh826219822/aitoearn)
[https://www.npmjs.com/\~aitoearn?activeTab=packages](https://www.npmjs.com/~aitoearn?activeTab=packages)

<h2 id="advanced-setup">高级设置</h2>

AiToEarn 集成了多种官方 API。以下是开发者密钥配置指南：

* [B 站（Bilibili）](./aitoearn_web/CHANNEL_Md/BILIBILI.md)
* [微信公众号（WeChat Official Accounts）](./aitoearn_web/CHANNEL_Md/WXPLAT.md)

<h2 id="contribution-guide">贡献指南</h2>

请查看 [贡献指南](./aitoearn_web/CONTRIBUTING.md) 开始参与。

<h2 id="contact">联系</h2>

[https://t.me/harryyyy2025](https://t.me/harryyyy2025)

<h2 id="milestones">里程碑</h2>

* 2025.02.26 — 发布 win-0.1.1
* 2025.03.15 — 发布 win-0.2.0
* 2025.04.18 — 发布 win-0.6.0
* 2025.05.20 — 发布 win-0.8.0
* 2025.08.08 — [发布 win-0.8.1](https://github.com/yikart/AiToEarn/releases/tag/v0.8.1)
* 2025.08.08 — [发布 web-0.1-beta](./aitoearn_web/README.md)
* 2025.09.16 — [发布 v1.0.18](https://github.com/yikart/AiToEarn/releases/tag/v1.0.18)

---
## [常见问题](https://docs.aitoearn.ai)


<h2 id="recommended">推荐</h2>

**[AWS Activate Program](https://www.amazonaws.cn/en/campaign/ps-yunchuang/)**

**[AI Model Hub](https://api.zyai.online/)**

* [https://github.com/TMElyralab/MuseTalk](https://github.com/TMElyralab/MuseTalk)
* [https://github.com/5ime/video\_spider](https://github.com/5ime/video_spider)
* [https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file](https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file)
* [https://github.com/facefusion/facefusion](https://github.com/facefusion/facefusion)
* [https://github.com/linyqh/NarratoAI](https://github.com/linyqh/NarratoAI)
* [https://github.com/harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)

