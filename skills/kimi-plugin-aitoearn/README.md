# AiToEarn — Kimi Work 插件包

本包包含 Kimi Work 插件和不含静态凭证的 MCP 配置。中国版 URL 为 `https://aitoearn.cn/api/ai/agent/mcp`，国际版为 `https://aitoearn.ai/api/ai/agent/mcp`。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 Kimi Work 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/kimi-plugin-aitoearn 的插件包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装，引导我完成 OAuth 授权，最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn plugin package for Kimi Work from https://github.com/yikart/AiToEarn/tree/main/skills/kimi-plugin-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md to finish installation, guide me through OAuth authorization, and verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/kimi-plugin-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 切换中国版 / 国际版

两个版本的授权不通用，只保留一个连接。切换步骤：

1. 在 Kimi 的 MCP 配置中删除当前 AiToEarn 条目，按目标版本重新添加（只含 `url`）：中国版 `aitoearn-cn` + `https://aitoearn.cn/api/ai/agent/mcp`；国际版 `aitoearn` + `https://aitoearn.ai/api/ai/agent/mcp`；
2. 重启 Kimi Work，到 MCP 连接管理页对新连接**主动发起认证**，完成 OAuth 登录；
3. 发送「列出可用的发布渠道」验证。

## 更新已有安装

如果以前安装或配置过 AiToEarn，先删除旧的 AiToEarn 插件和旧 MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

将 `mcp.json` 中的服务器条目合并进 Kimi 的 MCP 配置，保留现有服务器且不添加认证请求头。重启 Kimi Work 后，用户需要**到 MCP 连接管理页对 AiToEarn 连接主动发起认证**，在浏览器完成 OAuth 授权，然后使用「列出可用的发布渠道」验证。

如果当前 Kimi Work 没有 OAuth 入口，必须报告无法完成连接，不能改用旧鉴权方式。
