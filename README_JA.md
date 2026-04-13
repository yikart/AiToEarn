# [Aitoearn：個人ビジネス向けAIコンテンツマーケティングエージェント](https://aitoearn.ai)

<a href="https://trendshift.io/repositories/20785" target="_blank"><img src="https://trendshift.io/api/badge/repositories/20785" alt="yikart%2FAiToEarn | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

[![GitHub stars](https://img.shields.io/github/stars/yikart/AiToEarn?color=fa6470)](https://github.com/yikart/AiToEarn/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Required Node.JS 20.18.x](https://img.shields.io/static/v1?label=node&message=20.18.x&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

日本語 | [简体中文](README.md) | [English](README_EN.md)

**収益化 · 公開 · エンゲージメント · クリエイト —— オールインワンプラットフォーム。**

AiToEarnは**AI自動化**を通じて、クリエイター、ブランド、企業が世界中の主要プラットフォームでコンテンツを構築、配信、収益化するのを支援します。

対応チャンネル：
抖音（Douyin）、小紅書（Rednote）、快手（Kuaishou）、bilibili、TikTok、YouTube、Facebook、Instagram、Threads、Twitter（X）、Pinterest、LinkedIn

## 🚀 AiToEarnをすぐに使う（5つの方法）

| 方法 | 対象 | デプロイ必要？ |
|------|------|--------------|
| [① ウェブサイトで直接使う](#use-web) | すべてのユーザー | ❌ 不要 |
| [② OpenClaw（ロブスター）で使う](#use-in-openclaw) | OpenClawユーザー | ❌ 不要 |
| [③ Claude / Cursor などのAIアシスタントで使う](#use-in-claude) | AIツールユーザー | ❌ 不要 |
| [④ Dockerワンクリックデプロイ](#use-docker) | 自己デプロイしたいチーム | ✅ サーバー必要 |
| [⑤ ソースコードから開発](#use-source) | 開発者 | ✅ 開発環境必要 |

> 💡 **方法②③④は事前にAPI Keyの取得が必要です**。[API Keyの取得方法](#get-api-key)を先にご覧ください。

## 最新情報

- **2026-03-26**: [2.1バージョン](https://www.aitoearn.ai/) — コンテンツ取引マーケットプレイスをリリース。OpenClaw（ロブスター）対応を追加し、OpenClaw内で直接AiToEarnを使用可能に。MCPプロトコル対応を追加し、Claude、CursorなどMCP対応のエージェントやLLMでAiToEarnを使用可能に。
- **2026-02-07**: [1.8.0バージョン](https://www.aitoearn.ai/) — オフライン店舗プロモーションソリューションを追加。レストラン、小売店、民宿、美容室、ジムなど多様なオフラインビジネスに対応。オフラインのプロモーション活動を実行可能なオンライン拡散タスクに変換し、コンテンツ公開とユーザー参加メカニズムを通じて店舗のオンライン露出と来店トラフィックの増加を支援。
- **2025-12-15**: 「All In Agent」の始まり！コンテンツの自動生成・公開、そしてAitoearnの操作を支援するスーパーAIエージェントを追加。[v1.4.3](https://github.com/yikart/AiToEarn/releases/tag/v1.4.3)
- **2025-11-28**: アプリ内自動更新に対応。作成画面に多くのAI機能を追加：要約、拡張、画像生成、動画生成、タグ生成など。Nano Banana Proにも対応。[v1.4.0](https://github.com/yikart/AiToEarn/releases/tag/v1.4.0)
- **2025-11-12**: 初のオープンソースで完全に使用可能なバージョン。[v1.3.2](https://github.com/yikart/AiToEarn/releases/tag/v1.3.2)
- **2025-09-16**: 初の海外展開バージョン、Facebook、Instagram、Threads、Twitter、YouTube、TikTok、Pinterestに対応。[v1.0.18](https://github.com/yikart/AiToEarn/releases/tag/v1.0.18)
- **2025-02-26**: 初のオープンソースバージョン、小紅書・抖音・快手・ビデオアカウントへのワンクリック動画投稿を実現。[v0.1.1](https://github.com/yikart/AiToEarn/releases/tag/v0.1.1)

<details>
  <summary><h2 style="display:inline;margin:0">目次</h2></summary>

  <br/>

  1. [AiToEarnをすぐに使う（5つの方法）](#-aitoearnをすぐに使う5つの方法)
  2. [最新情報](#最新情報)
  3. [主な機能](#主な機能)
  4. [API Keyの取得方法](#get-api-key)
  5. [貢献ガイド](#貢献ガイド)
  6. [お問い合わせ](#お問い合わせ)
  7. [推奨](#推奨)
</details>

## 主な機能

AiToEarnはコンテンツクリエイターの完全な収益化パイプラインを中心に、4つのエージェント機能を提供します：

> **収益化 · 公開 · エンゲージメント · クリエイト**

---

### 💰 収益化 —— コンテンツで稼ぐ

AiToEarnの最も重要な目標：**すべてのクリエイターが稼げるようにする**。

クリエイターはプラットフォーム上でコンテンツを販売し、ブランドのプロモーションタスクを完了できます。すべての決済は成果報酬型で、3つの決済モードを提供：

| 決済モード | 正式名称 | 意味 |
|---------|------|------|
| **CPS** | Cost Per Sale | 売上額に基づいて決済 |
| **CPE** | Cost Per Engagement | エンゲージメント数に基づいて決済 |
| **CPM** | Cost Per Mille | 再生数に基づいて決済 |

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/monetize-cn.png" width="50%">
</div>

---

### 📢 公開 —— コンテンツ公開エージェント

ワンクリックで世界中の10以上の主要プラットフォームにコンテンツを配信。各プラットフォームで手動投稿する手間から解放されます。

- **マルチプラットフォーム配信**：抖音、快手、B站、小紅書、TikTok、YouTube、Facebook、Instagram、Threads、X（Twitter）、Pinterest、LinkedInに対応
- **カレンダースケジュール**：カレンダーのように全プラットフォームのコンテンツ公開時間を統一的に計画

<div style="display: flex; justify-content: space-around;">
  <img src="presentation/publish-cn.png" width="30%">
  <img src="presentation/app-screenshot/1.%20content%20publish/support_channels.jpeg" width="30%">
</div>

> ▶ デモ動画を見る

<a href="https://www.youtube.com/watch?v=5041jEKaiU8">
  <img src="https://img.youtube.com/vi/5041jEKaiU8/0.jpg" alt="公開 デモ動画" width="480">
</a>

---

### 💬 エンゲージメント —— コンテンツ交流エージェント

AiToEarnブラウザ拡張機能を通じて、上記のすべてのプラットフォームで自動化された交流運用を実現。

- **自動化アクション**：自動いいね、保存、フォロー — 大規模な一括操作
- **AIスマート返信**：LLMを使用して各コメントに的確な返信を生成
- **コメントマイニング**：「リンクください」「購入方法は」などの高コンバージョンシグナルを検出し、即座に対応
- **ブランドモニタリング**：ブランドに関する言及をリアルタイムで追跡し、トレンドの会話に積極的に参加

> ▶ デモ動画を見る

<a href="https://youtu.be/-QoHNrZBmp0">
  <img src="./presentation/engage-thumbnail-cn.png" alt="エンゲージメント デモ動画" width="480">
</a>

---

### 🎨 クリエイト —— コンテンツ作成エージェント

エージェント方式でコンテンツ制作ワークフローを再構築しました。エージェントにコンテンツのニーズを伝えるだけで、アイデアから完成品まで全てを自動的に処理します。

**動画コンテンツ**：エージェントが自動的に動画生成モデル（Grok、Veo、Seedanceなど）、動画翻訳モジュール、動画編集モジュールを呼び出し、一貫して動画を制作。

**画像・テキストコンテンツ**：Nano Bananaなどのトップクラスの画像モデルをサポートし、高品質なビジュアルコンテンツを自動生成。

**一括生成**：作成タスクを一括で投入 — エージェントが複数のコンテンツを並列生成。マトリックスアカウント運用や大規模コンテンツ配信に最適。

> ▶ デモ動画を見る

<a href="https://youtu.be/y900LxIrZT4">
  <img src="./presentation/display-1.5.2png.png" alt="クリエイト デモ動画" width="480">
</a>

---

<h2 id="use-web">① ウェブサイトで直接使う</h2>

最も簡単な方法 — ブラウザを開くだけで使用可能：

- 🇨🇳 中国のユーザー：**[aitoearn.cn](https://aitoearn.cn/)**
- 🌍 その他のユーザー：**[aitoearn.ai](https://aitoearn.ai/)**

---

<h2 id="get-api-key">🔑 API Keyの取得方法（以下の手順に必要）</h2>

> 以下の方法②③④にはAPI Keyが必要です。一度取得すれば、すべての方法で使用可能です。

**3ステップで取得**：

1. [aitoearn.cn](https://aitoearn.cn/)（中国）または[aitoearn.ai](https://aitoearn.ai/)（その他）を開き、登録・ログイン
2. 左メニューの**設定**をクリック
3. **API Key**に移動し、作成をクリックして、生成されたキーをコピー

<img src="presentation/app-screenshot/0.%20api-key/api-key-settings.png" alt="API Key取得" width="600">

> ⚠️ API Keyは安全に保管し、他人に共有しないでください。

---

<h2 id="use-in-openclaw">② OpenClaw（ロブスター）で使う</h2>

> 前提条件：[API Keyを取得済み](#get-api-key)

**1. プラグインをインストール**

```bash
openclaw plugins install @aitoearn/openclaw-plugin
```

**2. プラグインを設定**

```bash
openclaw aitoearn setup
```

プロンプトに従って環境を選択し、API Keyを入力してください。設定完了後、「小紅書に投稿して」などの指示を直接OpenClawに伝えるだけで使えます。

---

<h2 id="use-in-claude">③ Claude / Cursor / その他のAIアシスタントで使う</h2>

> 前提条件：[API Keyを取得済み](#get-api-key)

AiToEarnはMCPプロトコルに対応するすべてのAIアシスタントで動作します。一般的なツールの設定方法：

<details open>
<summary><b>Claude Desktop</b></summary>

`claude_desktop_config.json`を見つけて編集し、以下を追加：

```json
{
  "mcpServers": {
    "aitoearn": {
      "type": "http",
      "url": "https://aitoearn.ai/api/unified/mcp",
      "headers": {
        "x-api-key": "あなたのAPI-Key"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

CursorのMCP設定で以下を追加：

```
MCP URL: https://aitoearn.ai/api/unified/mcp
認証ヘッダー: x-api-key: あなたのAPI-Key
```

</details>

<details>
<summary><b>その他のAIアシスタント（汎用設定）</b></summary>

MCPプロトコル対応のツールなら、2つの情報だけでOK：

| 設定項目 | 値 |
|--------|------|
| **MCP URL** | `https://aitoearn.ai/api/unified/mcp` |
| **認証ヘッダー** | `x-api-key: あなたのAPI-Key` |

SSE接続もサポート：`https://aitoearn.ai/api/unified/sse`

</details>

> 💡 自己デプロイの場合は、`aitoearn.ai`をご自身のアドレス（例：`localhost:8080`）に置き換えてください。

---

<h2 id="use-docker">④ Dockerワンクリックデプロイ</h2>

> 前提条件：[Docker](https://docs.docker.com/get-docker/)がインストール済み

自分のサーバーでAiToEarnを運用したいチーム向け。3つのコマンドで完了、データベースの手動インストール不要：

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
docker compose up -d
```

起動後、**[http://localhost:8080](http://localhost:8080)** を開けば使用可能。

#### Relayの設定（強く推奨）

> **なぜRelayが必要？** コンテンツを公開するにはソーシャルメディアアカウント（TikTok、Instagram、YouTubeなど）へのログインが必要で、これらのプラットフォームのOAuthログインには開発者認証情報が必要です。Relayを設定すれば、公式aitoearn.aiの認証情報を直接借用して認証を完了できるため、**各プラットフォームで開発者アカウントを申請する必要がありません**。

`docker-compose.yml`の`aitoearn-server`サービスに以下を追加（API Keyの取得方法は[上記](#get-api-key)を参照）：

```yaml
RELAY_SERVER_URL: https://aitoearn.ai/api
RELAY_API_KEY: あなたのAPI-Key
RELAY_CALLBACK_URL: http://127.0.0.1:8080/api/plat/relay-callback
```

その後再起動：`docker compose restart aitoearn-server`

> 📖 完全なデプロイガイド（本番環境設定、AIサービス、OAuth、ストレージなど）：[DOCKER_DEPLOYMENT_EN.md](DOCKER_DEPLOYMENT_EN.md)を参照。

---

<h2 id="use-source">⑤ ソースコードから開発</h2>

<details>
<summary>🧪 バックエンドとフロントエンドを手動で実行（開発モード）</summary>

このモードは主にローカル開発とデバッグ用です。
Dockerを使用してMongoDB/Redisを実行するか、設定ファイルで独自のサービスを指定できます。

#### 1. バックエンドサービスを起動

```bash
cd project/aitoearn-backend
pnpm install
# ローカル開発用設定ファイルをコピー
cp apps/aitoearn-ai/config/config.js apps/aitoearn-ai/config/local.config.js
cp apps/aitoearn-server/config/config.js apps/aitoearn-server/config/local.config.js
pnpm nx serve aitoearn-ai
# 別のターミナルで
pnpm nx serve aitoearn-server
```

#### 2. フロントエンド `aitoearn-web` を起動

```bash
pnpm install
pnpm run dev
```

</details>

<details>
<summary>🖥️ Electronデスクトッププロジェクトを起動</summary>

```bash
# リポジトリをクローン
git clone https://github.com/yikart/AttAiToEarn.git

# ディレクトリに移動
cd AttAiToEarn

# 依存関係をインストール
npm install

# sqliteをコンパイル（better-sqlite3にはnode-gypとローカルPythonが必要）
npm run rebuild

# 開発を起動
npm run dev
```

ElectronプロジェクトはAiToEarnのデスクトップクライアントを提供します。

</details>

## 貢献ガイド

参加するには[貢献ガイド](./CONTRIBUTING.md)をご覧ください。

## お問い合わせ

利用中に困ったこと、使い方の質問、不具合がある場合は、まず [GitHub Issues](https://github.com/yikart/AiToEarn/issues) でご連絡ください。内容を一元管理し、順番に対応できます。

- Telegram: [https://t.me/harryyyy2025](https://t.me/harryyyy2025)
- WeChat：QRコードをスキャンして追加

<img src="presentation/wechat.jpg" alt="WeChat QRコード" width="200">

## 推奨

- [MuseTalk](https://github.com/TMElyralab/MuseTalk)
- [video_spider](https://github.com/5ime/video_spider)
- [CosyVoice](https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file)
- [facefusion](https://github.com/facefusion/facefusion)
- [NarratoAI](https://github.com/linyqh/NarratoAI)
- [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)
