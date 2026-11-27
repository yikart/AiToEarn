# AI 助手插件与技能包（按平台）

本目录收录 AiToEarn 全域内容运营能力在各 AI 助手平台的安装包：`*-plugin-aitoearn` 为**插件**包，`*-skill-aitoearn` 为**技能**包。每个平台一个文件夹，**两种安装方式任选**：

1. **插件/技能包安装**：按包内 `README.md` 的步骤把文件放到指定位置；
2. **提示词安装**：把包内 `安装提示词.md` 的内容（或让 AI 读取该文件）交给对应平台的 AI 助手，它会引导完成安装、OAuth 授权与验证，无需编程基础；
3. **一键安装提示词**：每个包的 `README.md` 顶部都有「一键安装提示词 / One-click install prompt」（中英双语），复制发给对应客户端的 AI 助手即可——提示词要求只下载该包目录（sparse checkout 或只解压子目录），不克隆全仓，并需在提示词中写明安装中国版还是国际版。

> 所有包均使用 AiToEarn MCP OAuth 鉴权，不填写、不保存、也不回退使用 API Key。
> 中国版连接 `https://aitoearn.cn/api/ai/agent/mcp`，国际版连接 `https://aitoearn.ai/api/ai/agent/mcp`；两套环境分别完成 OAuth 授权。
> 若宿主没有显示 OAuth 授权入口，必须明确报告该客户端当前无法连接，不能改用自定义静态请求头。
> 版本命名统一为「中国版」（aitoearn.cn）与「国际版」（aitoearn.ai）。
> 安装提示词已提供中英双语版本；后续主仓 README 将以英文为默认语言。
> 切换版本：两个版本的授权不通用。在客户端删除当前 AiToEarn 连接/连接器，按目标版本地址重新添加并重新完成 OAuth 授权；各包 README 的「切换中国版 / 国际版」一节有对应客户端的具体步骤。

## 更新已有安装

如果以前安装或配置过 AiToEarn，请先在对应客户端删除旧的 AiToEarn 插件/技能，再删除旧的 AiToEarn MCP 服务或连接器条目。仅清理名称为 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目；不要删除其他 MCP 服务。

旧条目中若有旧版 MCP 地址、自定义认证请求头、环境变量或 API Key，也必须一并移除。随后重新安装本目录的当前包，并且每个客户端只保留一套 AiToEarn 插件/技能和一个对应版本的 MCP 连接。

豆包不会从技能包自动创建 MCP 连接器：导入技能后，用户仍需在豆包内手动新增 AiToEarn 连接器。

安装完成后，用户需要到对应客户端的 MCP/连接器管理页面，对 AiToEarn 连接**主动发起认证**（连接/授权/进行身份验证按钮），在浏览器完成 OAuth 登录；不要被动等待客户端自动弹出授权窗口。

## 平台列表

| 目录 | 平台 | 类型 | 形态 |
| --- | --- | --- | --- |
| `codex-plugin-aitoearn/` | Codex | 插件 | 插件库标准包（.codex-plugin + skills + `.mcp.json`） |
| `claude-plugin-aitoearn/` | Claude Code | 插件 | 插件标准包（.claude-plugin + skills + `.mcp.json`） |
| `trae-skill-aitoearn/` | Trae | 技能 | 技能目录 + mcp.json / skill-config.json |
| `qwenwork-plugin-aitoearn/` | 千问办公 | 插件 | 插件目录（.qwenwork-plugin + skills）+ 连接器导入 JSON |
| `qwen-skill-aitoearn/` | 千问（通义千问 App） | 技能 | 技能目录 + 技能清单登记条目 |
| `dsh-plugin-aitoearn/` | DeepSeek Harness | 插件 | node 插件。鉴权走 aitoearn.cn 的 OAuth，不使用 API Key |
| `kimi-plugin-aitoearn/` | Kimi Work | 插件 | 插件目录（kimi.plugin.json + skills）+ mcp.json |
| `doubao-skill-aitoearn/` | 豆包 | 技能 | 技能目录 + 连接器手动配置引导 |

安装后需完全退出并重启对应客户端，新会话发送「列出可用的发布渠道」验证。
