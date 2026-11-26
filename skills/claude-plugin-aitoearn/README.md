# AiToEarn — Claude Code 插件包

这是面向 Claude Code 的自包含插件包，包含入口技能与子技能。AiToEarn MCP 使用 OAuth 鉴权，不使用静态凭证。

## 更新已有安装

如果以前安装或配置过 AiToEarn，先删除旧的 AiToEarn 插件，再删除 Claude Code 中旧的 AiToEarn MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除，然后再安装本包。

## OAuth MCP 配置

安装时从 `.mcp.json.tpl` 创建 `.mcp.json`：

- 中国版：server `aitoearn-cn`，URL `https://aitoearn.cn/api/ai/agent/mcp`
- 国际版：server `aitoearn`，URL `https://aitoearn.ai/api/ai/agent/mcp`

配置只能保留传输类型和 URL。Claude Code 应在连接时按服务端 discovery 启动 OAuth 授权；不得添加认证请求头、环境变量或本地密钥文件。

重启 Claude Code 后，用户需要在 `/mcp` 面板选择 AiToEarn server **主动发起认证**，在浏览器完成 OAuth 授权，然后新会话发送「列出可用的发布渠道」。仅当工具真实可用时才可报告安装成功；没有 OAuth 入口时应报告该环境暂不支持连接，不能使用旧鉴权方式替代。
