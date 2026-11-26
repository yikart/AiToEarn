# AiToEarn — 千问技能包

本技能通过 OAuth 连接 AiToEarn MCP。中国版连接 `https://aitoearn.cn/api/ai/agent/mcp`，国际版连接 `https://aitoearn.ai/api/ai/agent/mcp`。

## 更新已有安装

如果以前导入过 AiToEarn 技能或配置过 AiToEarn MCP，先删除旧技能和旧的 AiToEarn MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

在千问的「连接」中添加 AiToEarn HTTP MCP 服务时，只填写名称、传输方式与对应 URL；不要填写自定义请求头或静态凭证。添加后用户需要**在「连接」里对 AiToEarn 连接主动发起认证**，在浏览器完成 OAuth 登录，再新建会话验证「列出可用的发布渠道」。

如果当前千问版本没有 OAuth 授权入口，必须报告连接尚不受支持，不能回退到旧鉴权方式。
