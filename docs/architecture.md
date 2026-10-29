# AiToEarn 架构总览

本文档用一张图说明 web、electron、backend、浏览器插件、MCP 五者的关系。

## 总体架构

```mermaid
flowchart TB
    subgraph 客户端
        WEB["aitoearn-web<br/>(Next.js 14)"]
        ELECTRON["aitoearn-electron<br/>(Electron 桌面端)"]
        EXT["浏览器插件<br/>(Chrome Extension，独立发布)"]
    end

    subgraph 服务端
        SERVER["aitoearn-server<br/>(NestJS，Nx monorepo)"]
        AI["aitoearn-ai<br/>(AI 服务)"]
        MCP["统一 MCP<br/>/api/unified/mcp（SSE）"]
    end

    subgraph 数据与基础设施
        MONGO[("MongoDB<br/>aitoearn / aitoearn_channel")]
        REDIS[("Redis<br/>队列 / 缓存 / Redlock")]
        OSS[("OSS / S3<br/>素材与作品存储")]
    end

    subgraph 外部平台
        PLATS["抖音 / 小红书 / 快手 / B站 / 视频号<br/>YouTube / TikTok / X / Facebook / Instagram<br/>Pinterest / LinkedIn / Threads 等"]
    end

    WEB -->|REST API /api/v2| SERVER
    ELECTRON -->|REST API| SERVER
    EXT -->|浏览器内自动化<br/>（发布/抓取，平台 Cookie 会话）| PLATS
    WEB -->|插件消息通道| EXT

    SERVER --> MCP
    MCP -->|工具调用：发布/评论/数据查询| SERVER
    SERVER --> AI
    SERVER --> MONGO
    SERVER --> REDIS
    SERVER --> OSS

    ELECTRON -->|浏览器控制原语<br/>模拟发布（无开放 API 的国内平台）| PLATS
    SERVER -->|官方 OAuth / 开放 API<br/>（海外平台）| PLATS
```

## 五者分工

| 组件 | 位置 | 职责 |
|------|------|------|
| Web 前端 | `project/aitoearn-web` | 用户主界面：发布、草稿箱、数据分析、Agent 对话 |
| Electron 桌面端 | `project/aitoearn-electron` | 桌面端发布宿主，通过浏览器控制原语操作国内平台 |
| 浏览器插件 | 独立扩展（web 侧 `src/store/plugin` 负责通信） | 浏览器内平台自动化，复用已登录的网页会话 |
| 后端服务 | `project/aitoearn-backend` | 业务核心：账号绑定、发布编排、任务系统、MCP 三域 |
| MCP | `core/unified-mcp`、`core/channels/mcp`、`core/content` | 把发布/评论/内容能力暴露给外部 Agent |

## 平台接入层（现状）

同一平台的接入逻辑当前有三个宿主实现，正在按 `docs/ecosystem-transformation-plan.md` Phase 2 收敛为统一的 Platform Pack：

| 宿主 | 代码位置 | 说明 |
|------|---------|------|
| Electron | `electron/plat/` | douyin、xhs、Kwai、bilibili、shipinhao |
| 浏览器插件 | `src/store/plugin/plats/` | douyin、xhs |
| 后端 Provider | `core/channels/platforms/` | 13 个平台，海外平台走官方 OAuth |

## 环境区分

- 中国版：`*.aitoearn.cn`，MCP `https://aitoearn.cn/api/unified/mcp`
- 国际版：`* .aitoearn.ai`，MCP `https://aitoearn.ai/api/unified/mcp`
- API Key 与所属环境必须匹配，不匹配会返回 401
