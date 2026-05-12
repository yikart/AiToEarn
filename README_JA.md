# [Aitoearn：個人ビジネス向けAIコンテンツマーケティングエージェント](https://aitoearn.ai)

<a href="https://trendshift.io/repositories/20785" target="_blank">
  <img src="https://trendshift.io/api/badge/repositories/20785" alt="yikart%2FAiToEarn | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/>
</a>

[![GitHub stars](https://img.shields.io/github/stars/yikart/AiToEarn?color=fa6470)](https://github.com/yikart/AiToEarn/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node&message=20.18.x&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

**日本語** | [简体中文](README.md) | [English](README_EN.md)

**収益化 · 公開 · エンゲージメント · クリエイト —— オールインワンプラットフォーム**

AiToEarnは**AI自動化**により、クリエイター、ブランド、企業が世界中の主要プラットフォームでコンテンツを構築・配信・収益化することを支援します。

**対応プラットフォーム**：
抖音（Douyin）、小紅書（Rednote）、快手（Kuaishou）、bilibili、TikTok、YouTube、Facebook、Instagram、Threads、Twitter（X）、Pinterest、LinkedIn

---

## 🚀 AiToEarnをすぐに使う（5つの方法）

| 方法                                                           | 対象                             | デプロイ必要    |
| -------------------------------------------------------------- | -------------------------------- | --------------- |
| [① ウェブサイトで直接使う](#use-web)                           | すべてのユーザー                 | ❌ 不要         |
| [② OpenClaw（ロブスター）で使う](#use-in-openclaw)             | OpenClawユーザー                 | ❌ 不要         |
| [③ Claude / Cursor などのAIアシスタントで使う](#use-in-claude) | AIツールユーザー                 | ❌ 不要         |
| [④ Dockerワンクリックデプロイ](#use-docker)                    | 自己ホスティングを希望するチーム | ✅ サーバー必要 |
| [⑤ ソースコードから開発](#use-source)                          | 開発者                           | ✅ 開発環境必要 |

> 💡 **方法②③④** を利用する場合は事前に [API Keyの取得](#get-api-key) が必要です。

---

## 最新情報

- **2026-04-20**: OpenClaw（ロブスター）に対応し、OpenClaw内でAiToEarnの収益化タスクを直接受け取り実行可能に。
- **2026-03-26**: [2.1バージョン](https://www.aitoearn.ai/) — コンテンツ取引マーケットプレイスをリリース。OpenClaw対応およびMCPプロトコル対応を追加（Claude、Cursorなど対応AIアシスタントで利用可能）。
- **2026-02-07**: [1.8.0バージョン](https://www.aitoearn.ai/) — オフライン店舗向けプロモーションソリューションを追加（レストラン、小売店、民宿、美容室、ジムなどに対応）。
- **2025-12-15**: 「All In Agent」機能追加 — コンテンツ自動生成・公開を支援するスーパーAIエージェント [v1.4.3](https://github.com/yikart/AiToEarn/releases/tag/v1.4.3)
- **2025-11-28**: アプリ内自動更新対応および各種AI機能強化（要約、拡張、画像生成、動画生成、タグ生成など） [v1.4.0](https://github.com/yikart/AiToEarn/releases/tag/v1.4.0)
- **2025-11-12**: 初のオープンソースで完全に使用可能なバージョンリリース [v1.3.2](https://github.com/yikart/AiToEarn/releases/tag/v1.3.2)
- **2025-09-16**: 海外展開版リリース（Facebook、Instagram、Threads、Twitter、YouTube、TikTok、Pinterest対応） [v1.0.18](https://github.com/yikart/AiToEarn/releases/tag/v1.0.18)
- **2025-02-26**: 初のオープンソースバージョンリリース（小紅書・抖音・快手対応） [v0.1.1](https://github.com/yikart/AiToEarn/releases/tag/v0.1.1)

---

## 主な機能

AiToEarnはコンテンツクリエイターの**完全な収益化パイプライン**を中心に、以下の4つのコアエージェント機能を提供します：

> **収益化 · 公開 · エンゲージメント · クリエイト**

### 💰 収益化 —— コンテンツで稼ぐ

AiToEarnの最重要目標は「すべてのクリエイターが稼げるようになる」ことです。

プラットフォーム上でコンテンツ販売やブランドプロモーションタスクを完了可能。すべての決済は**成果報酬型**で、以下の3つのモードをサポート：

| 決済モード | 正式名称            | 意味                           |
| ---------- | ------------------- | ------------------------------ |
| **CPS**    | Cost Per Sale       | 売上額に基づく決済             |
| **CPE**    | Cost Per Engagement | エンゲージメント数に基づく決済 |
| **CPM**    | Cost Per Mille      | 再生回数に基づく決済           |

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/monetize-cn.png" width="50%">
</div>

---

### 📢 公開 —— コンテンツ公開エージェント

ワンクリックで10以上の主要プラットフォームへコンテンツを配信。手動投稿の手間を完全に排除します。

- **マルチプラットフォーム対応**：抖音、快手、B站、小紅書、TikTok、YouTube、Facebook、Instagram、Threads、X（Twitter）、Pinterest、LinkedIn
- **カレンダースケジュール機能**：全プラットフォームの公開タイミングを一元管理

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/publish-cn.png" width="30%">
  <img src="presentation/app-screenshot/1.%20content%20publish/support_channels.jpeg" width="30%">
</div>

▶ **デモ動画**
<a href="https://www.youtube.com/watch?v=5041jEKaiU8">
<img src="https://img.youtube.com/vi/5041jEKaiU8/0.jpg" alt="公開 デモ動画" width="480">
</a>

---

### 💬 エンゲージメント —— コンテンツ交流エージェント

ブラウザ拡張機能により、対象プラットフォーム上で自動化された交流運用を実現します。

- 自動いいね・保存・フォロー（一括操作）
- AIスマート返信（LLMによる高品質コメント返信）
- コメントマイニング（高コンバージョンキーワード検出）
- ブランドモニタリング

▶ **デモ動画**
<a href="https://youtu.be/-QoHNrZBmp0">
<img src="./presentation/engage-thumbnail-cn.png" alt="エンゲージメント デモ動画" width="480">
</a>

---

### 🎨 クリエイト —— コンテンツ作成エージェント

エージェントに指示するだけで、アイデアから完成品まで自動生成します。

- **動画コンテンツ**：Grok、Veo、Seedanceなどの最新モデルを活用した完全自動動画制作
- **画像・テキストコンテンツ**：Nano Bananaなど高性能モデル対応
- **一括生成**：大量のコンテンツを並列生成（マトリックス運用に最適）

▶ **デモ動画**
<a href="https://youtu.be/y900LxIrZT4">
<img src="./presentation/display-1.5.2png.png" alt="クリエイト デモ動画" width="480">
</a>

---

## ① ウェブサイトで直接使う <a id="use-web"></a>

**最も簡単な利用方法**です。ブラウザを開くだけで即利用可能：

- 🇨🇳 中国ユーザー：[aitoearn.cn](https://aitoearn.cn/)
- 🌍 国際ユーザー：[aitoearn.ai](https://aitoearn.ai/)

---

## 🔑 API Keyの取得方法 <a id="get-api-key"></a>

方法②③④を利用する際に必要です。一度取得すればすべての方法で使用できます。

**取得手順**：

1. [aitoearn.cn](https://aitoearn.cn/) または [aitoearn.ai](https://aitoearn.ai/) にアクセスして登録・ログイン
2. 左メニューの **設定** をクリック
3. **API Key** ページで「作成」をクリックし、生成されたキーをコピー

<img src="presentation/app-screenshot/0.%20api-key/api-key-settings.png" alt="API Key取得" width="600">

> ⚠️ API Keyは安全に保管し、第三者と共有しないでください。

---

## ② OpenClaw（ロブスター）で使う <a id="use-in-openclaw"></a>

> 前提：[API Keyを取得](#get-api-key)済み

```bash
npx -y @aitoearn/openclaw-plugin-cli
初回起動時に環境を選択し、API Keyを入力してください。
設定後、OpenClaw内でAiToEarnの収益化タスクを直接受け取り実行できます。
<img src="presentation/openclaw-earn-demo.png" alt="OpenClaw で AiToEarn の収益化タスクを実行" width="360">

③ Claude / Cursor などのAIアシスタントで使う
前提：API Keyを取得済み
MCPプロトコルに対応したすべてのAIアシスタントで利用可能です。
環境MCP URLSSE URL中国版https://aitoearn.cn/api/unified/mcphttps://aitoearn.cn/api/unified/sse国際版https://aitoearn.ai/api/unified/mcphttps://aitoearn.ai/api/unified/sse
Claude Desktop / Cursor / その他のツールの設定例は元の内容通り維持されています（詳細は必要に応じて確認してください）。

④ Dockerワンクリックデプロイ
前提：Docker がインストール済み
Bashgit clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
docker compose up -d
起動後、http://localhost:8080 にアクセスして利用可能です。
Relay設定（強く推奨）など、詳細は元の内容を維持しています。

⑤ ソースコードから開発
開発モードでの起動手順（バックエンド・フロントエンド・Electron）は元の内容を維持しています。

貢献ガイド
詳細は CONTRIBUTING.md をご覧ください。
お問い合わせ
ご質問、不具合報告、改善提案は GitHub Issues をご利用ください。

Telegram: https://t.me/harryyyy2025
WeChat：QRコードをスキャン

<img src="presentation/wechat.jpg" alt="WeChat QRコード" width="200">
推奨プロジェクト

MuseTalk
video_spider
CosyVoice
facefusion
NarratoAI
MoneyPrinterTurbo


Aitoearn — あなたのAIコンテンツマーケティングパートナー。
```
