# AiToEarn — Codex 插件包

这是可直接上架或本地安装的 Codex 插件包。插件通过 AiToEarn MCP 提供创作、媒体生产与全平台发布能力。

## 更新已有安装

如果以前安装过 AiToEarn，先在 Codex 卸载旧的 `aitoearn` 插件，并删除旧的 AiToEarn MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除，然后再安装本包。

## OAuth MCP 配置

包内直接提供 `.mcp.json`，与插件清单的 `mcpServers` 引用一致。它预设中国版 `aitoearn-cn` 和 `https://aitoearn.cn/api/ai/agent/mcp`，**不包含静态凭证**。由 Codex 在连接时依据服务端 OAuth discovery 打开登录与授权流程；不要添加自定义请求头、环境变量或本地密钥文件。

## 注册全局 MCP（必需）

安装并启用插件后，还必须把 AiToEarn 注册到 Codex 的全局 MCP 配置。插件内的 `.mcp.json` 不能替代这一步。中国版执行：

```bash
codex mcp add aitoearn-cn --url https://aitoearn.cn/api/ai/agent/mcp
codex mcp login aitoearn-cn --oauth-client-registration dcr
```

国际版只保留一套连接时执行：

```bash
codex mcp add aitoearn --url https://aitoearn.ai/api/ai/agent/mcp
codex mcp login aitoearn --oauth-client-registration dcr
```

使用 Codex 桌面版时也可以不改命令行，**明确提示用户去 MCP 连接认证**：设置 → 插件 → MCP，找到 `aitoearn-cn`，把连接类型从「自动」改为「动态客户端注册 (DCR)」，再点「进行身份验证」完成浏览器授权。该选择只作用于当次登录，与命令行参数等价。

中国站的 `--oauth-client-registration dcr` 必须保留：Codex 默认的 CIMD 登录方式需要服务端拉取托管在 chatgpt.com 的客户端元数据文档，中国站服务端部署在国内、无法访问该域名，授权页会显示"应用配置错误"；DCR 动态注册由服务端直接签发 client_id，已实测可正常打开授权页。国际站未实测，若不带该参数也能正常打开授权页，可省略。如果 `codex mcp add` 自动弹出的授权页显示"应用配置错误"，忽略该页面，继续执行上面的 dcr 登录命令即可。

登录完成后运行 `codex mcp list`，确认对应 server 显示为 `enabled`。不要同时注册国内站和国际站，也不要追加认证请求头、环境变量或 API Key。

如果 Codex 没有显示 OAuth 授权入口，必须明确报告“当前 Codex 环境无法完成 AiToEarn OAuth 连接”，停止配置，不得退回使用静态凭证。

## 本地安装与验证

将插件放入本地 marketplace 后启用 `aitoearn` 插件，按上节注册全局 MCP 并完成 OAuth 登录，然后完全退出并重启 Codex。新会话中发送「列出可用的发布渠道」验证：能列出渠道才表示 MCP 已连接；否则如实报告 OAuth 尚未完成或服务端不可用。
