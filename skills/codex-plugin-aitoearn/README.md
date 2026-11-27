# AiToEarn — Codex 插件包

这是可直接上架或本地安装的 Codex 插件包。插件通过 AiToEarn MCP 提供创作、媒体生产与全平台发布能力。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 Codex 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/codex-plugin-aitoearn 的插件包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装，引导我完成 OAuth 授权，最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn plugin package for Codex from https://github.com/yikart/AiToEarn/tree/main/skills/codex-plugin-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md to finish installation, guide me through OAuth authorization, and verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/codex-plugin-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 切换中国版 / 国际版

两个版本的授权不通用，只保留一个连接。切换步骤：

1. 移除当前连接：`codex mcp remove aitoearn-cn`（国际版为 `aitoearn`）；
2. 插件方式：直接改 `.mcp.json` 的 server 名与 URL 后重启认证；命令行方式（可选）按目标版本重新注册并登录：
   - 中国版：`codex mcp add aitoearn-cn --url https://aitoearn.cn/api/ai/agent/mcp`，然后 `codex mcp login aitoearn-cn --oauth-client-registration dcr`（dcr 参数必须保留，原因见上节）；
   - 国际版：`codex mcp add aitoearn --url https://aitoearn.ai/api/ai/agent/mcp`，然后 `codex mcp login aitoearn`（默认即可，无需 dcr）；
3. 桌面版用户也可在 设置 → 插件 → MCP 中删除旧 server，按上节重新添加（手动添加时类型选「流式 HTTP」）；中国版再把连接类型改为「动态客户端注册 (DCR)」后认证，国际版直接认证即可；
4. 以上登录即完成新版本的 OAuth 授权；完全退出并重启 Codex，发送「列出可用的发布渠道」验证。

## 更新已有安装

如果以前安装过 AiToEarn，先在 Codex 卸载旧的 `aitoearn` 插件，并删除旧的 AiToEarn MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除，然后再安装本包。

## OAuth MCP 配置

包内直接提供 `.mcp.json`，与插件清单的 `mcpServers` 引用一致。它预设中国版 `aitoearn-cn` 和 `https://aitoearn.cn/api/ai/agent/mcp`，**不包含静态凭证**。由 Codex 在连接时依据服务端 OAuth discovery 打开登录与授权流程；不要添加自定义请求头、环境变量或本地密钥文件。

## 完成 OAuth 认证

启用插件后，Codex 会**自动加载插件内 `.mcp.json` 声明的 MCP server，无需 `codex mcp add` 注册全局 MCP**——需要手动注册全局 MCP 的只有 Trae（见 Trae 包 README）。使用国际版时，先把 `.mcp.json` 的 server 名改为 `aitoearn`、URL 改为 `https://aitoearn.ai/api/ai/agent/mcp`。

剩下的一步是 OAuth 认证，必须用户主动完成，不能装完就结束：**设置 → 插件 → MCP**，找到 AiToEarn server——中国版把连接类型从「自动」改为「动态客户端注册 (DCR)」再点「进行身份验证」；国际版直接点「进行身份验证」（已实测默认方式可用，无需 DCR）。

习惯命令行的话，也可以走「全局注册 + login」的可选路径（与插件自动加载二选一，不要重复注册同名 server）：

```bash
# 中国版（dcr 参数必须保留，原因见下）
codex mcp add aitoearn-cn --url https://aitoearn.cn/api/ai/agent/mcp
codex mcp login aitoearn-cn --oauth-client-registration dcr

# 国际版（默认登录方式即可，已实测无需 dcr）
codex mcp add aitoearn --url https://aitoearn.ai/api/ai/agent/mcp
codex mcp login aitoearn
```

在 设置 → 插件 → MCP 手动添加自定义 MCP 时：**类型必须选「流式 HTTP」**（默认停在 STDIO 无法连接），只填名称与 URL，不填启动命令、参数或环境变量。

中国版的 `--oauth-client-registration dcr` 必须保留：Codex 默认的 CIMD 登录方式需要服务端拉取托管在 chatgpt.com 的客户端元数据文档，中国版服务端部署在国内、无法访问该域名，授权页会显示"应用配置错误"；DCR 动态注册由服务端直接签发 client_id，已实测可正常打开授权页。国际版已实测（2026-11-27）：默认登录方式即可正常打开授权页并完成授权，无需 dcr 参数。如果 `codex mcp add` 自动弹出的授权页显示"应用配置错误"，忽略该页面，继续执行上面的 dcr 登录命令即可。

登录完成后运行 `codex mcp list`，确认对应 server 显示为 `enabled`。不要同时注册中国版和国际版，也不要追加认证请求头、环境变量或 API Key。

如果 Codex 没有显示 OAuth 授权入口，必须明确报告“当前 Codex 环境无法完成 AiToEarn OAuth 连接”，停止配置，不得退回使用静态凭证。

## 本地安装与验证

将插件放入本地 marketplace 后启用 `aitoearn` 插件，按上节完成 OAuth 认证（插件自动加载 MCP，无需全局注册），然后完全退出并重启 Codex。新会话中发送「列出可用的发布渠道」验证：能列出渠道才表示 MCP 已连接；否则如实报告 OAuth 尚未完成或服务端不可用。
