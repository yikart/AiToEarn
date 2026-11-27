# AiToEarn — Codex 插件包

这是可直接上架或本地安装的 Codex 插件包。插件通过 AiToEarn MCP 提供创作、媒体生产与全平台发布能力。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 Codex 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/codex-plugin-aitoearn 的插件包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装：自动检查并注册 MCP，已有同名且配置正确的连接直接复用，不存在才注册，不要限制或擅自转换连接类型。需要 OAuth 时自动发起登录并引导我主动授权，已有有效授权不要重复登录。最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn plugin package for Codex from https://github.com/yikart/AiToEarn/tree/main/skills/codex-plugin-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md: inspect and register the MCP connection automatically, reuse an existing matching connection, register only when it is missing, and do not restrict or convert its transport type. Start OAuth automatically when needed and guide me through explicit authorization; do not repeat login when valid authorization already exists. Finally, verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/codex-plugin-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 自动检查并注册 MCP

安装器必须自己完成注册，不能把 `codex mcp add` 命令交给用户手工执行，也不能只检查 `.mcp.json` 文件是否存在。

1. 确定目标版本：中国版使用 server 名 `aitoearn-cn` 与 `https://aitoearn.cn/api/ai/agent/mcp`；国际版使用 `aitoearn` 与 `https://aitoearn.ai/api/ai/agent/mcp`。两个版本只保留一个。
2. 先运行 `codex mcp get <name> --json`：
   - 已存在且 server 名、传输方式及 URL（或 stdio 启动配置）符合目标：直接复用，不删除、不重复注册、不主动重新授权；
   - 不存在：由安装器自动执行 `codex mcp add`；
   - 同名但配置不符：先展示差异并取得用户确认，再修正，不得静默覆盖。
3. 不把连接类型写死。先读取包内 `.mcp.json` 和当前 `codex mcp add --help`，按服务的实际声明注册：URL 服务使用 `codex mcp add <name> --url <URL>`；stdio 服务使用 `codex mcp add <name> -- <COMMAND> [ARGS...]`，需要时再使用 CLI 支持的 `--env`。不得把 stdio 擅自改成 URL，也不得把 URL 服务擅自改成 stdio；遇到当前 Codex 不支持的传输方式，如实报告，不猜测配置字段。
4. AiToEarn 官方服务当前使用 URL 连接，缺失时的注册命令为：

```bash
# 中国版
codex mcp add aitoearn-cn --url https://aitoearn.cn/api/ai/agent/mcp

# 国际版
codex mcp add aitoearn --url https://aitoearn.ai/api/ai/agent/mcp
```

5. 注册后必须再次运行 `codex mcp get <name> --json` 和 `codex mcp list`，确认目标 server 已出现且为 `enabled`。只看到插件声明或配置文件，不等于注册成功。

## OAuth MCP 配置与授权

包内 `.mcp.json` 与插件清单的 `mcpServers` 引用一致，预设中国版，**不包含静态凭证**。它用于声明目标连接；安装器仍须按上节检查并注册实际可用的 MCP。使用国际版时，安装副本中的 server 名应为 `aitoearn`，URL 应为 `https://aitoearn.ai/api/ai/agent/mcp`。不要添加自定义请求头、环境变量或本地密钥文件。

OAuth 必须由用户主动授权，但安装器应自动发起登录并打开或提供授权入口，不能让用户自己查找注册命令：

- 中国版：需要授权时运行 `codex mcp login aitoearn-cn --oauth-client-registration dcr`。`dcr` 必须保留，因为默认 CIMD 方式要求服务端访问 chatgpt.com 的客户端元数据，中国版部署环境无法访问该域名；DCR 由服务端直接签发 client_id。
- 国际版：需要授权时运行 `codex mcp login aitoearn`，使用默认注册方式，无需 DCR。
- 如果 `codex mcp add` 已自动进入 OAuth 流程，直接引导用户完成该流程，不重复执行 `login`。
- 已有有效授权时直接复用；不要仅因更新插件、重启 Codex 或重新安装而重复授权。只有服务明确返回未授权、授权已过期，或用户主动要求切换账号时，才重新发起授权。

桌面版可在 设置 → 插件 → MCP 中完成授权；中国版的 OAuth 客户端注册方式选择「动态客户端注册 (DCR)」，国际版使用默认方式。这里只用于授权，不要求用户手工选择 MCP 传输类型或填写启动命令。

如果没有 OAuth 授权入口或授权失败，必须明确报告“MCP 已注册，但 OAuth 尚未完成”，保留错误信息并停止；不得退回静态凭证，也不得把 `enabled` 当成已授权。

## 切换中国版 / 国际版

两个版本的授权不通用，只保留一个连接。切换版本属于用户明确要求的替换操作：

1. 移除当前 AiToEarn 连接：`codex mcp remove aitoearn-cn`（国际版为 `aitoearn`），不要删除其他 MCP 服务；
2. 按「自动检查并注册 MCP」注册目标版本；
3. 按「OAuth MCP 配置与授权」完成目标版本的授权；
4. 运行 `codex mcp list` 确认目标 server 为 `enabled`，完全退出并重启 Codex，再发送「列出可用的发布渠道」验证。

## 更新已有安装

更新插件时不默认删除 MCP。先通过 `codex mcp get` 检查并复用正确连接；只有用户明确要求清理重装、切换版本，或确认修正错误配置时，才移除对应的 `aitoearn`、`aitoearn-cn` 或旧 AiToEarn 地址条目。不要删除其他 MCP 服务，不要复制旧配置中的认证请求头、环境变量或 API Key。

## 本地安装与验证

将插件放入本地 marketplace 后启用 `aitoearn` 插件，由安装器按上节自动检查并注册 MCP，再在需要时引导用户完成 OAuth。完全退出并重启 Codex，在新会话中发送「列出可用的发布渠道」验证：只有工具实际出现并返回渠道列表，才能报告安装与连接均完成；否则分别报告插件、MCP 注册、OAuth 和渠道验证的实际状态。
