# AiToEarn — 豆包技能包

本包为豆包提供 AiToEarn 的内容运营技能。AiToEarn MCP 使用 OAuth：中国版 `https://aitoearn.cn/api/ai/agent/mcp`，国际版 `https://aitoearn.ai/api/ai/agent/mcp`。

## 更新已有安装

如果以前导入过 AiToEarn 技能或配置过 AiToEarn MCP，先在豆包中删除旧技能和旧连接器；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的连接器，不要删除其他连接器。旧条目中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

## 手动新增连接器

导入本技能包后，用户需要在豆包内**手动新增自定义 MCP 连接器**；技能包不会自动创建连接器。连接器只填写名称、传输方式与对应 URL，不添加自定义认证请求头。连接器创建后不会自动完成授权：用户需要**在该连接器上主动点击连接/授权**，在浏览器完成 OAuth 登录，重启并新开对话发送「列出可用的发布渠道」验证。

如果豆包当前不提供 OAuth 授权入口，必须报告无法完成 MCP 连接；不得使用旧的静态鉴权方式。
