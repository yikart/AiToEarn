# AiToEarn — 千问办公插件包

本包包含千问办公插件与不含静态凭证的 `paste-config.json`。中国版使用 `https://aitoearn.cn/api/ai/agent/mcp`，国际版使用 `https://aitoearn.ai/api/ai/agent/mcp`。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 千问办公 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/qwenwork-plugin-aitoearn 的插件包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装，引导我完成 OAuth 授权，最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn plugin package for 千问办公 from https://github.com/yikart/AiToEarn/tree/main/skills/qwenwork-plugin-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md to finish installation, guide me through OAuth authorization, and verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/qwenwork-plugin-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 切换中国版 / 国际版

两个版本的授权不通用，只保留一个连接器。切换步骤：

1. 在「扩展 → 连接器」删除当前 AiToEarn 连接器，按目标版本重新导入配置：中国版 `https://aitoearn.cn/api/ai/agent/mcp`；国际版 `https://aitoearn.ai/api/ai/agent/mcp`；
2. 对新连接器**主动发起认证**，在浏览器完成 OAuth 登录；
3. 新建任务发送「列出可用的发布渠道」验证。

## 更新已有安装

如果以前安装或配置过 AiToEarn，先删除旧的 AiToEarn 插件和旧连接器；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的连接器，不要删除其他连接器。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

导入连接器配置后，用户需要**到「扩展 → 连接器」对 AiToEarn 连接器主动发起认证**，在浏览器完成 OAuth 登录。连接器配置不得包含认证请求头、环境变量或本地密钥文件。重启后新建任务，发送「列出可用的发布渠道」验证。

如果导入后没有 OAuth 授权入口，报告当前环境无法完成 AiToEarn OAuth 连接；不要使用旧的静态鉴权配置。
