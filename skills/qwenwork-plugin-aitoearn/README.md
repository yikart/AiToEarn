# AiToEarn — 千问办公插件包

本包包含千问办公插件与不含静态凭证的 `paste-config.json`。中国版使用 `https://aitoearn.cn/api/ai/agent/mcp`，国际版使用 `https://aitoearn.ai/api/ai/agent/mcp`。

## 更新已有安装

如果以前安装或配置过 AiToEarn，先删除旧的 AiToEarn 插件和旧连接器；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的连接器，不要删除其他连接器。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

导入连接器配置后，用户需要**到「扩展 → 连接器」对 AiToEarn 连接器主动发起认证**，在浏览器完成 OAuth 登录。连接器配置不得包含认证请求头、环境变量或本地密钥文件。重启后新建任务，发送「列出可用的发布渠道」验证。

如果导入后没有 OAuth 授权入口，报告当前环境无法完成 AiToEarn OAuth 连接；不要使用旧的静态鉴权配置。
