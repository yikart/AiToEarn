# AiToEarn — Claude Code 插件包

这是面向 Claude Code 的自包含插件包，包含入口技能与子技能。AiToEarn MCP 使用 OAuth 鉴权，不使用静态凭证。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 Claude Code 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/claude-plugin-aitoearn 的插件包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装，引导我完成 OAuth 授权，最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn plugin package for Claude Code from https://github.com/yikart/AiToEarn/tree/main/skills/claude-plugin-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md to finish installation, guide me through OAuth authorization, and verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/claude-plugin-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 切换中国版 / 国际版

两个版本的授权不通用，只保留一个连接。切换步骤：

1. 编辑插件包内的 `.mcp.json`：中国版用 `aitoearn-cn` + `https://aitoearn.cn/api/ai/agent/mcp`；国际版把 server 名改为 `aitoearn`、URL 改为 `https://aitoearn.ai/api/ai/agent/mcp`；
2. 完全退出并重启 Claude Code；
3. 输入 `/mcp` 打开面板，对新的 AiToEarn server **主动发起认证**，在浏览器完成 OAuth 登录；
4. 发送「列出可用的发布渠道」验证。

## 更新已有安装

如果以前安装或配置过 AiToEarn，先删除旧的 AiToEarn 插件，再删除 Claude Code 中旧的 AiToEarn MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除，然后再安装本包。

## OAuth MCP 配置

包内已直接提供 `.mcp.json`，Claude Code 会在插件根目录自动加载它，预设中国版 server `aitoearn-cn` 与 `https://aitoearn.cn/api/ai/agent/mcp`。使用国际版时，把 server 名改为 `aitoearn`、URL 改为 `https://aitoearn.ai/api/ai/agent/mcp`。

配置只能保留传输类型和 URL。Claude Code 应在连接时按服务端 discovery 启动 OAuth 授权；不得添加认证请求头、环境变量或本地密钥文件。

重启 Claude Code 后，用户需要在 `/mcp` 面板选择 AiToEarn server **主动发起认证**，在浏览器完成 OAuth 授权，然后新会话发送「列出可用的发布渠道」。仅当工具真实可用时才可报告安装成功；没有 OAuth 入口时应报告该环境暂不支持连接，不能使用旧鉴权方式替代。
