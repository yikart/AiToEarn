# AiToEarn — Trae 技能包

本包包含 Trae 技能和无静态凭证的 `mcp.json`。中国版 MCP 地址是 `https://aitoearn.cn/api/ai/agent/mcp`；国际版为 `https://aitoearn.ai/api/ai/agent/mcp`。

## 更新已有安装

如果以前导入过 AiToEarn 技能或配置过 AiToEarn MCP，先删除旧技能和旧的 AiToEarn MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

将 `mcpServers.aitoearn-cn`（或国际版 server）合并进 Trae 的现有 MCP 配置，不得添加请求头、环境变量或本地密钥文件。重启 Trae 后，用户需要**到 MCP 设置/连接管理页对 AiToEarn 连接主动发起认证**，在浏览器完成 OAuth 授权。

若 Trae 未显示 OAuth 授权入口或授权未完成，必须报告 MCP 连接未完成；不要使用旧的静态鉴权方案。完成授权后，新对话发送「列出可用的发布渠道」验证。
