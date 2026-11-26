# AiToEarn — Kimi Work 插件包

本包包含 Kimi Work 插件和不含静态凭证的 MCP 配置。中国版 URL 为 `https://aitoearn.cn/api/ai/agent/mcp`，国际版为 `https://aitoearn.ai/api/ai/agent/mcp`。

## 更新已有安装

如果以前安装或配置过 AiToEarn，先删除旧的 AiToEarn 插件和旧 MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

将 `mcp.json` 中的服务器条目合并进 Kimi 的 MCP 配置，保留现有服务器且不添加认证请求头。重启 Kimi Work 后，用户需要**到 MCP 连接管理页对 AiToEarn 连接主动发起认证**，在浏览器完成 OAuth 授权，然后使用「列出可用的发布渠道」验证。

如果当前 Kimi Work 没有 OAuth 入口，必须报告无法完成连接，不能改用旧鉴权方式。
