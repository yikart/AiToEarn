# AiToEarn — 豆包技能包

本包为豆包提供 AiToEarn 的内容运营技能。AiToEarn MCP 使用 OAuth：中国版 `https://aitoearn.cn/api/ai/agent/mcp`，国际版 `https://aitoearn.ai/api/ai/agent/mcp`。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 豆包 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/doubao-skill-aitoearn 的技能包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装，引导我完成 OAuth 授权，最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn skill package for 豆包 from https://github.com/yikart/AiToEarn/tree/main/skills/doubao-skill-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md to finish installation, guide me through OAuth authorization, and verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/doubao-skill-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 切换中国版 / 国际版

两个版本的授权不通用，只保留一个连接器。切换步骤：

1. 在豆包中删除当前 AiToEarn 连接器，重新手动新增连接器，只填名称、传输方式与目标版本 URL：中国版 `https://aitoearn.cn/api/ai/agent/mcp`；国际版 `https://aitoearn.ai/api/ai/agent/mcp`；
2. 在新连接器上**主动点击连接/授权**，在浏览器完成 OAuth 登录；
3. 重启并新开对话，发送「列出可用的发布渠道」验证。

## 更新已有安装

如果以前导入过 AiToEarn 技能或配置过 AiToEarn MCP，先在豆包中删除旧技能和旧连接器；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的连接器，不要删除其他连接器。旧条目中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

## 手动新增连接器

导入本技能包后，用户需要在豆包内**手动新增自定义 MCP 连接器**；技能包不会自动创建连接器。连接器只填写名称、传输方式与对应 URL，不添加自定义认证请求头。连接器创建后不会自动完成授权：用户需要**在该连接器上主动点击连接/授权**，在浏览器完成 OAuth 登录，重启并新开对话发送「列出可用的发布渠道」验证。

如果豆包当前不提供 OAuth 授权入口，必须报告无法完成 MCP 连接；不得使用旧的静态鉴权方式。
