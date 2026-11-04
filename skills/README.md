# AI 助手技能插件包（按平台）

本目录收录 AiToEarn 全域内容运营技能在各 AI 助手平台的安装包。每个平台一个文件夹，**两种安装方式任选**：

1. **插件包安装**：按包内 `README.md` 的步骤把文件放到指定位置；
2. **提示词安装**：把包内 `安装提示词.md` 的内容（或让 AI 读取该文件）交给对应平台的 AI 助手，它会引导完成安装——自动索取 API Key、写配置、验证，无需编程基础。

> 前置条件：AiToEarn API Key（登录 aitoearn.cn → 设置 → API Key → 创建；国际站为 aitoearn.ai，两站 Key 不通用）。
> 所有配置中的 `__AITOEARN_KEY__` 均为占位符，安装时替换为实际 Key。

## 平台列表

| 目录 | 平台 | 形态 |
| --- | --- | --- |
| `codex-plugin-aitoearn/` | Codex | 插件库标准包（.codex-plugin + skills + MCP 配置模板） |
| `claude-plugin-aitoearn/` | Claude Code | 插件标准包（.claude-plugin + skills + MCP 配置模板） |
| `trae-skill-aitoearn/` | Trae | 技能目录 + mcp.json / skill-config.json 模板 |
| `qwenwork-plugin-aitoearn/` | 千问办公 | 插件目录（.qwenwork-plugin + skills）+ 连接器导入 JSON |
| `qwen-skill-aitoearn/` | 千问（通义千问 App） | 技能目录 + 技能清单登记条目 |
| `dsh-plugin-aitoearn/` | DeepSeek Harness | node 插件（lib + skills + cordis.patch.yml 模板） |
| `kimi-plugin-aitoearn/` | Kimi Work | 插件目录（kimi.plugin.json + skills）+ mcp.json 模板 |
| `doubao-skill-aitoearn/` | 豆包 | 技能目录 + 连接器手动配置引导 |

安装后需完全退出并重启对应客户端，新会话发送「列出可用的发布渠道」验证。
