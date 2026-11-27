# AiToEarn — 千问技能包

本技能通过 OAuth 连接 AiToEarn MCP。中国版连接 `https://aitoearn.cn/api/ai/agent/mcp`，国际版连接 `https://aitoearn.ai/api/ai/agent/mcp`。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 千问 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/qwen-skill-aitoearn 的技能包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装，引导我完成 OAuth 授权，最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn skill package for 千问 from https://github.com/yikart/AiToEarn/tree/main/skills/qwen-skill-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md to finish installation, guide me through OAuth authorization, and verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/qwen-skill-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 切换中国版 / 国际版

两个版本的授权不通用，只保留一个连接。切换步骤：

1. 在「连接」中删除当前 AiToEarn 连接，按目标版本重新添加 HTTP MCP 服务（只填名称、传输方式与 URL）：中国版 `https://aitoearn.cn/api/ai/agent/mcp`；国际版 `https://aitoearn.ai/api/ai/agent/mcp`；
2. 对新连接**主动发起认证**，在浏览器完成 OAuth 登录；
3. 新建会话发送「列出可用的发布渠道」验证。

## 更新已有安装

如果以前导入过 AiToEarn 技能或配置过 AiToEarn MCP，先删除旧技能和旧的 AiToEarn MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

在千问的「连接」中添加 AiToEarn HTTP MCP 服务时，只填写名称、传输方式与对应 URL；不要填写自定义请求头或静态凭证。添加后用户需要**在「连接」里对 AiToEarn 连接主动发起认证**，在浏览器完成 OAuth 登录，再新建会话验证「列出可用的发布渠道」。

如果当前千问版本没有 OAuth 授权入口，必须报告连接尚不受支持，不能回退到旧鉴权方式。
