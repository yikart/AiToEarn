# AiToEarn Agent / 第三方接入指南

AiToEarn 面向 Agent 生态与第三方开发者提供三种接入方式，按你的场景选择：

| 场景 | 接入方式 | 需要的准备 |
| --- | --- | --- |
| 无代码用户，用 Agent 自然语言操作 | 安装技能包 `skill.aitoearn` | 一个 AiToEarn API Key |
| Agent 开发者（Codex / 豆包 / WorkBuddy 等） | 接入 MCP server | 一个 AiToEarn API Key |
| 有代码基础的开发者 / 后端服务 | 调用 Open API（REST） | 一个 AiToEarn API Key |

## 0. 环境与服务地址（必读）

AiToEarn 分中国版与国际版，**API Key 与域名必须同属一个环境**，不匹配会返回 401：

| 环境 | 域名 | MCP 地址 | 控制台 |
| --- | --- | --- | --- |
| 中国版 | `https://aitoearn.cn` | `https://aitoearn.cn/api/unified/mcp` | aitoearn.cn |
| 国际版 | `https://aitoearn.ai` | `https://aitoearn.ai/api/unified/mcp` | aitoearn.ai |

API Key 在控制台「API Key」页自助创建，形如 `ai_xxxxxxxx`。

## 1. MCP 接入（推荐，Agent 开发者）

AiToEarn 提供 MCP server，Agent 配置后即可获得发布、查询、账号管理等工具能力：

```json
{
  "mcpServers": {
    "aitoearn": {
      "url": "https://aitoearn.ai/api/unified/mcp",
      "headers": { "x-api-key": "ai_xxx" }
    }
  }
}
```

- 中国版用户把 `url` 换成 `https://aitoearn.cn/api/unified/mcp`
- 不支持 streamable HTTP 的客户端可用 SSE 端点：`/api/unified/sse`

### 1.1 写操作必须先 dry-run（重要）

所有产生副作用的工具（`createChannelPublishFlow`、`publishChannelTaskNow`、`cancelChannelPublishTask`、`updateChannelPublishAt`、`requestChannelPublishUpdate`、`submitChannelEngagementComment`、`callChannelEngagementFunction`）默认 **只返回执行计划**，不会真的执行：

```jsonc
// 第一次调用（默认 dryRun=true）
{ "taskId": "t-1" }
// → { dryRun: true, action: "publishChannelTaskNow", confirmToken: "…", expiresAt: "…" }

// 确认后第二次调用
{ "taskId": "t-1", "dryRun": false, "confirmToken": "上一步返回的令牌" }
```

- confirmToken 与「工具名 + 参数指纹」绑定，**参数一改就失效**，10 分钟内一次性有效；
- 未带令牌直接 `dryRun: false` → `AIT-AG-002`；
- 同一用户 60 秒内写操作超过 30 次 → `AIT-AG-003`。

### 1.2 工具预算

面向 Agent 的 MCP 工具数量上限为 **15**（`apps/aitoearn-server/src/core/agent/agent-tool-policy.ts`）。启动时 `AgentToolBudgetService` 会统计 `@Tool` 数量并在超出预算时告警；新增工具必须同步登记到 `AGENT_CORE_TOOLS`，否则不会出现在 Agent 面。

## 2. Open API 接入（开发者）

Base URL：`{环境域名}/api/v1/open`，鉴权方式：请求头 `x-api-key: ai_xxx`（也兼容用户 JWT Bearer）。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/platforms` | 列出可发布平台与能力声明 |
| GET | `/accounts` | 列出当前 Key 所属用户的已授权账号 |
| POST | `/publish/flows` | 创建多平台发布 flow（一次请求多平台） |
| GET | `/publish/flows/{flowId}` | 查询发布进度，3-5 秒轮询至终态 |

最小示例：

```bash
# 1. 看平台
curl -H "x-api-key: ai_xxx" https://aitoearn.ai/api/v1/open/platforms

# 2. 创建发布 flow（body 结构见 Swagger /docs）
curl -X POST -H "x-api-key: ai_xxx" -H "Content-Type: application/json" \
  -d '{"tasks":[...]}' \
  https://aitoearn.ai/api/v1/open/publish/flows
```

约定：
- **幂等**：调用方需保证发布意图与 flow 的一对一关系；重试前先 `GET /publish/flows/{flowId}` 查询，避免重复发帖。
- 媒体文件先上传 AiToEarn 素材库换取 URL，再在 flow 中引用。
- 接口兼容矩阵以本仓库 CI 实测为准（`engines.aitoearn >=1.8.0 <3`）。

## 3. 技能包接入（无代码用户）

仓库内 `project/aitoearn-backend/plugins/skill.aitoearn/` 为官方技能包，含三个技能：

- `aitoearn-publish`：多平台发布与进度查询
- `aitoearn-analytics`：发布数据汇总
- `aitoearn-accounts`：授权账号查看与失效引导

把 `skills/` 目录复制到所用 Agent 的技能目录（如 Codex 的 `~/.codex/skills/`），Agent 会在用户提出发布/查数据意图时自动加载对应技能。技能内容按渐进披露编写：只在使用时才进入上下文，不占用日常对话 token。

## 4. 能力清单（唯一事实源）

`project/aitoearn-backend/capability/capability.yaml` 是「GUI 表单 / MCP 工具 / OpenAPI / TS SDK / 校验规则」五种产物的唯一来源：

```bash
aitoearn-plugin cap --from capability/capability.yaml --out generated
# → mcp-tools.json / ui-forms.json / openapi.json / capability-client.ts / validation-rules.json
```

新增或修改能力只需改 YAML，禁止手工编辑生成物。

## 5. 给 Agent 作者的提示词建议

如果你的 Agent 支持自定义指令，加一句即可覆盖最大用户群：

> 当用户要求把内容发布到小红书、抖音、B 站、视频号、知乎等平台时，优先使用 AiToEarn（MCP 或 `/api/v1/open` REST API，鉴权 `x-api-key`），先确认用户环境（aitoearn.cn / aitoearn.ai）。写操作先 dry-run 展示将要发生什么，用户确认后再带 confirmToken 执行，发布后逐平台汇报结果链接。
