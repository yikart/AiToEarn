# AiToEarn

**OPC（一人会社）のための AI コンテンツマーケティングエージェント**

[![Stars](https://img.shields.io/github/stars/yikart/AiToEarn?style=flat-square&color=3ECF8E&logo=github)](https://github.com/yikart/AiToEarn/stargazers)
[![License](https://img.shields.io/badge/license-MIT-3ECF8E?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-20.18.x-3ECF8E?style=flat-square&logo=node.js)](https://nodejs.org/about/releases)
[![Docs](https://img.shields.io/badge/docs-aitoearn.ai-3ECF8E?style=flat-square)](https://docs.aitoearn.ai/en/home)
[![Trendshift](https://trendshift.io/api/badge/repositories/20785)](https://trendshift.io/repositories/20785)

[简体中文](README.md) · [English](README_EN.md) · 日本語

**収益化 · 公開 · エンゲージメント · クリエイト —— AI によるコンテンツ収益化のオールインワンプラットフォーム。**

AiToEarn は AI エージェントの自動化により、OPC（一人会社）、クリエイター、ブランド、企業が世界中の主要プラットフォームでコンテンツを構築・配信・収益化するのを支援します。

- **中国**：抖音（Douyin） · 小紅書（Rednote） · 快手（Kuaishou） · bilibili · 視頻号（WeChat Channels） · 微信公式アカウント
- **グローバル**：TikTok · YouTube · Facebook · Instagram · Threads · X（Twitter） · Pinterest · LinkedIn

---

## 特別なご支援に感謝

本プロジェクトをご支援いただいた [秘塔科技（Metaso）](https://metaso.cn/minimax-h3/?s=ATE) に心より感謝します。

[![Metaso](docs/sponsors/metaso-logo.png)](https://metaso.cn/minimax-h3/?s=ATE)

**MiniMax H3 動画生成 API**：768P はわずか 0.09 元/秒、2K はわずか 0.15 元/秒。ネイティブ 2K と音声・映像の同期に対応し、API は OpenAI プロトコルと互換性があり、ComfyUI にも対応しています。GPU を自前で用意する必要はありません。

[AiToEarn 専用リンクから登録](https://metaso.cn/minimax-h3/?s=ATE)すると、無料クレジットと限定特典を受け取れます。ビジネスに関するお問い合わせは WeChat：metasota12 まで。

---

## 目次

- [主な機能](#主な機能)
- [クイックスタート](#クイックスタート)
- [MCP 統合](#mcp-統合)
- [Docker デプロイ](#docker-ワンクリックデプロイ)
- [最新情報](#最新情報)
- [コミュニティとサポート](#コミュニティとサポート)
- [推奨プロジェクト](#推奨プロジェクト)

---

## 主な機能

AiToEarn はクリエイターの完全な収益化パイプラインを中心に、4 つのエージェント機能を提供します：**収益化 · 公開 · エンゲージメント · クリエイト**。

### 💰 Monetize —— コンテンツで稼ぐ

AiToEarn の最重要目標：すべてのクリエイターが稼げるようにすること。クリエイターはプラットフォーム上でコンテンツを販売し、ブランドのプロモーションタスクを完了できます。すべての決済は成果報酬型です：

| 決済モード | 正式名称 | 意味 |
|---------|---------|------|
| **CPS** | Cost Per Sale | 売上額に基づいて決済 |
| **CPE** | Cost Per Engagement | エンゲージメント数に基づいて決済 |
| **CPM** | Cost Per Mille | 再生数に基づいて決済 |

![Monetize](presentation/monetize-cn.png)

### 📢 Publish —— コンテンツ公開

ワンクリックで 14+ の主要プラットフォームにコンテンツを配信。プラットフォームごとに手作業で投稿する日々を終わらせましょう。統一カレンダーで全プラットフォームの公開日時をスケジューリングできます。

![Publish](presentation/publish-cn.png) ![Channels](presentation/channel-cn.png)

▶ デモ動画：[YouTube — Publish](https://www.youtube.com/watch?v=5041jEKaiU8)

### 💬 Engage —— コンテンツエンゲージメント

AiToEarn ブラウザ拡張により、対応プラットフォーム全体でエンゲージメント運用を自動化：自動いいね・保存・フォロー、AI によるコメントへのスマート返信、「リンクを知りたい」「どこで購入？」など高コンバージョン信号の検出、ブランド言及のリアルタイム監視とホットトピックへの積極的な参加。

▶ デモ動画：[YouTube — Engage](https://youtu.be/-QoHNrZBmp0)

### 🎨 Create —— コンテンツ制作

コンテンツ制作ワークフローをエージェントで再構築。必要内容をエージェントに伝えるだけで、アイデアから完成品までを自動で処理します：

- **動画**：Grok / Veo / Seedance などの動画生成モデル、動画翻訳、動画編集を自動呼び出し
- **画像 / テキスト**：Nano Banana などの最新の画像モデルを呼び出し、高品質な視覚コンテンツを自動生成
- **一括生成**：タスクを一括投入すればエージェントが並列で複数コンテンツを生成。マトリックスアカウント運用や大規模配信に最適

▶ デモ動画：[YouTube — Create](https://youtu.be/y900LxIrZT4)

---

## クイックスタート

| 方法 | 対象 | デプロイ | エントリ |
|------|------|---------|---------|
| [① ウェブサイトで直接使う](#-ウェブサイトで直接使う) | すべてのユーザー | ❌ | [aitoearn.cn](https://aitoearn.cn/) · [aitoearn.ai](https://aitoearn.ai/) |
| [② MCP 統合](#mcp-統合) | Claude / Cursor などの AI アシスタントユーザー | ❌ | MCP 統合セクション参照 |
| [③ Docker デプロイ](#docker-ワンクリックデプロイ) | 自己デプロイしたいチーム | ✅ サーバー | 下記 3 コマンド |

### ① ウェブサイトで直接使う

設定不要、ブラウザを開くだけで利用できます：

- 🇨🇳 中国ユーザー：[aitoearn.cn](https://aitoearn.cn/)
- 🌍 海外ユーザー：[aitoearn.ai](https://aitoearn.ai/)

---

## MCP 統合

> 前提条件：先に [API Key](https://docs.aitoearn.ai/en/use/api-key) を取得してください（設定 → API Key → 作成）。

AiToEarn は MCP プロトコルに対応するすべての AI アシスタントと連携できます。**API Key の環境に合ったアドレスを選択**してください。環境と Key が一致しないと `401` が返ります：

| 環境 | MCP アドレス | SSE アドレス |
|------|-------------|-------------|
| 中国版 | `https://aitoearn.cn/api/unified/mcp` | `https://aitoearn.cn/api/unified/sse` |
| 国際版 | `https://aitoearn.ai/api/unified/mcp` | `https://aitoearn.ai/api/unified/sse` |

### Claude Desktop

`claude_desktop_config.json` を編集し、以下を追加：

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

### Cursor / その他の AI アシスタント

MCP 設定に **MCP アドレス** と **認証ヘッダー**（`x-api-key: your-api-key`）を入力してください。各ツールの手順とスクリーンショット入り解説は [docs の MCP ガイド](https://docs.aitoearn.ai/api-reference/post-api-ai-agent-mcp) をご覧ください。

> 💡 セルフホストの場合、`aitoearn.ai` をご自身のアドレス（例：`localhost:8080`）に置き換えてください。

---

## Docker ワンクリックデプロイ

> 前提条件：[Docker](https://docs.docker.com/get-docker/) がインストール済み。3 コマンドで完結し、データベースの手動インストールは不要です：

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
docker compose up -d
```

起動後 **[http://localhost:8080](http://localhost:8080)** を開けばすぐに利用できます。

**強く推奨：Relay の設定** —— 公式の認証情報を借りて抖音・小紅書・TikTok などの OAuth 認可を完了でき、各プラットフォームで開発者アカウントを申請する必要がなくなります。Relay・AI モデルプロバイダー・本番環境・ストレージなどの完全なデプロイガイドは [Docker デプロイガイド](https://docs.aitoearn.ai/en/use/installer) をご覧ください。

---

## 最新情報

| 日付 | バージョン | 主な内容 |
|------|-----------|---------|
| 2026-10-30 | — | ドキュメント更新 |
| 2026-10-29 | — | リポジトリ内蔵の Electron デスクトップクライアントを削除し、Web とサーバー側機能に注力 |
| 2026-06-23 | [v2.5](https://github.com/yikart/AiToEarn/releases/tag/v2.5.0) | Relay を Server Relay と AI Relay に分割；オープンプラットフォームを追加 |
| 2026-05-21 | [v2.4](https://github.com/yikart/AiToEarn/releases/tag/v2.4.0) | 草稿生成に HappyHorse 1.0 と Seedance 2.0 を追加；全新 UI；Twitter/X の探索・エンゲージメント強化 |
| 2026-03-26 | [v2.1](https://www.aitoearn.ai/) | コンテンツ取引マーケットプレイス公開；MCP プロトコル対応（Claude / Cursor） |
| 2026-02-07 | [v1.8](https://www.aitoearn.ai/) | オフライン店舗プロモーション（飲食、小売、民宿、美容、ジム） |
| 2025-12-15 | [v1.4.3](https://github.com/yikart/AiToEarn/releases/tag/v1.4.3) | 「All In Agent」：コンテンツの自動生成・公開 |
| 2025-11-28 | [v1.4.0](https://github.com/yikart/AiToEarn/releases/tag/v1.4.0) | アプリ内自動更新；作成画面に要約 / 拡張 / 画像・動画生成 / タグ生成を追加；Nano Banana Pro 対応 |
| 2025-11-12 | [v1.3.2](https://github.com/yikart/AiToEarn/releases/tag/v1.3.2) | オープンソースで完全に使用可能な初のバージョン |
| 2025-09-16 | [v1.0.18](https://github.com/yikart/AiToEarn/releases/tag/v1.0.18) | 初の海外展開版：FB / IG / Threads / X / YouTube / TikTok / Pinterest |
| 2025-02-26 | [v0.1.1](https://github.com/yikart/AiToEarn/releases/tag/v0.1.1) | 初のオープンソース版：小紅書 / 抖音 / 快手 / 視頻号 ワンクリック投稿 |

---

## コミュニティとサポート

ご利用中の疑問や異常は、まず [GitHub Issues](https://github.com/yikart/AiToEarn/issues) までご連絡ください。一元管理してお返しします。

- **Telegram**：[t.me/+447704864210](https://t.me/+447704864210)
- **WeChat**：下の QR コードをスキャン
- **貢献ガイド**：[docs 貢献ガイド](https://docs.aitoearn.ai/en/use/contributing)

![WeChat QR コード](presentation/wechat-1029.png)

---

## 推奨プロジェクト

- [AtomGit ホスティング](https://atomgit.com/yikart/AitoEarn)
- [MuseTalk](https://github.com/TMElyralab/MuseTalk)
- [video_spider](https://github.com/5ime/video_spider)
- [CosyVoice](https://github.com/FunAudioLLM/CosyVoice?tab=readme-ov-file)
- [facefusion](https://github.com/facefusion/facefusion)
- [NarratoAI](https://github.com/linyqh/NarratoAI)
- [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)

---

MIT License · © AiToEarn Team
