# skill.aitoearn

AiToEarn 官方 Agent 技能包：让 Codex、豆包、WorkBuddy 等任意 Agent 获得多平台发布能力。

## 面向用户（无代码）

把 `skills/` 下的技能目录复制到你所用 Agent 的技能目录即可，之后用自然语言说"帮我把这篇发到小红书和抖音"。

## 面向开发者（有代码）

直接调用 Open API（`/api/v1/open/*`），用 `x-api-key` 鉴权：

```bash
curl -H "x-api-key: ai_xxx" https://aitoearn.ai/api/v1/open/platforms
```

或接入 MCP server：中国版 `https://aitoearn.cn/api/unified/mcp`，国际版 `https://aitoearn.ai/api/unified/mcp`。

注意：中国版 Key 只能配 `aitoearn.cn`，国际版 Key 只能配 `aitoearn.ai`。
