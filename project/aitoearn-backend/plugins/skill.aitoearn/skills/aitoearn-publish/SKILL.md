---
name: aitoearn-publish
description: 通过 AiToEarn 把内容一键发布到小红书、抖音、B 站、视频号、知乎等多个平台，并查询发布进度
when_to_use: 用户要求把文章、图文或视频发布/分发到多个内容平台，或询问"发到小红书/抖音/全网发布"时
version: 1.0.0
apiVersion: ^1.0.0
allowed-tools: ["list_accounts", "create_draft", "validate_content", "publish_post", "schedule_post", "revoke_post"]
---

# AiToEarn 多平台发布

## 第一步：确认环境（关键，选错会 401）

向用户确认其 AiToEarn 账号所属环境，或使用用户提供的 baseUrl：

| 环境 | baseUrl | API Key 特征 |
| --- | --- | --- |
| 中国版 | `https://aitoearn.cn` | 在 aitoearn.cn 控制台创建 |
| 国际版 | `https://aitoearn.ai` | 在 aitoearn.ai 控制台创建 |

Key 与域名不匹配一定返回 401，遇到 401 首先排查环境是否配对。

## 第二步：鉴权

所有请求带 header：`x-api-key: <用户的 AiToEarn API Key>`。
Key 由用户在 AiToEarn 控制台「API Key」页自助创建（`ai_` 开头）。

## 第三步：选择账号与平台

1. `GET {baseUrl}/api/v1/open/accounts` —— 列出用户已授权账号，记录要用的 `id`（账号 ID）与平台。
2. `GET {baseUrl}/api/v1/open/platforms` —— 查看平台能力声明（是否支持视频/定时等）。
   若目标平台不在列表或账号未授权，引导用户先到 AiToEarn 完成平台授权，不要伪造发布结果。

## 第四步：创建发布任务

`POST {baseUrl}/api/v1/open/publish/flows`

要点：
- 一次请求可携带多个账号/平台任务，实现"一次编辑、全网分发"。
- **幂等**：调用方必须为每次发布生成稳定的唯一键。重复执行同一用户的同一发布意图时，先查询是否已有 flow，避免重复发帖。
- 媒体文件需先上传至 AiToEarn 素材库获得 URL，再在 flow 中引用。

## 第五步：轮询发布状态

`GET {baseUrl}/api/v1/open/publish/flows/{flowId}`，每 3-5 秒轮询一次，直到所有任务到达终态（成功/失败）。
向用户汇报时逐平台给出结果链接；失败任务透传失败原因，并说明可在 AiToEarn 内重试。

## 备选：MCP 接入

若当前 Agent 支持 MCP，优先使用 AiToEarn 官方 MCP server（中国版 `https://aitoearn.cn/api/unified/mcp`，国际版 `https://aitoearn.ai/api/unified/mcp`）。
工具名与 allowed-tools 一致（方案 §12.2 冻结契约）：发布用 `publish_post`（默认 dryRun，确认后才真发），定时用 `schedule_post`，
5 分钟内撤回用 `revoke_post`，热点选题用 `hot_topics`；上述工具不可用（返回未实现）时回退到本技能的 HTTP 步骤。
