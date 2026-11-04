# AiToEarn — Claude Code 插件包（免安装器版）

本目录是可上架 Claude / Anthropic 生态的自包含插件包，内容取自 `payload/doubao-skill-aitoearn`，
已按官方 plugin 规范整理为扁平多技能结构（14 个技能平级位于 `skills/` 下）。

## 目录结构

```
claude-plugin-aitoearn/
├── .claude-plugin/
│   └── plugin.json        # 插件清单（name/version/description/author）
├── .mcp.json.tpl          # MCP 配置模板（__AITOEARN_*__ 占位符，安装时替换为 .mcp.json）
├── README.md
├── skills/
│   ├── aitoearn/          # 入口技能：路由表 + 核心规则
│   │   ├── SKILL.md
│   │   ├── assets/icon.png
│   │   └── references/mcp-connector.md
│   └── …/                 # 其余 13 个子技能与入口平级，每个为 <name>/SKILL.md 目录
```

即规范要求的 `skills/<name>/SKILL.md` 一层结构：14 个技能（入口 `aitoearn` + 13 个子技能）全部位于插件根 `skills/` 下，互相以 `../<name>/SKILL.md` 相对引用。

## 上架说明

- 插件规范要求 `skills/<name>/SKILL.md`（插件根下一层），14 个技能均已满足；frontmatter 含 `name` 与 `description`（必需），
  子技能另带规范内可选字段 `allowed-tools`（声明本技能需要的 MCP 工具）。
- MCP 接入使用 `.mcp.json.tpl`：安装时替换 `__AITOEARN_SERVER__`、`__AITOEARN_URL__`、
  `__AITOEARN_KEY__` 三个占位符后另存为 `.mcp.json`（Claude Code 的 MCP 配置文件名与 Codex 相同）。

## 第 0 步：获取 API Key（安装前置）

所有配置中的 `__AITOEARN_KEY__` 都是占位符，**安装时必须向用户询问 AiToEarn API Key**
（获取方式：登录 aitoearn.cn（或国际站 aitoearn.ai）→ 设置 → API Key → 创建），
拿到后替换进相应配置文件；两站 Key 不通用。需要国际站时同时把 URL 换成 `https://aitoearn.ai/api/ai/agent/mcp`。
包里不预置任何真实 Key，配置模板可直接分发。

## 本地手动使用（不经过安装器）

1. 将 `.mcp.json.tpl` 复制为 `.mcp.json` 并替换三个占位符（server 名 `aitoearn-cn`/`aitoearn`，URL 与 Key 按第 0 步）。
2. 作为本地插件使用：
   ```bash
   claude plugin marketplace add /Users/yika/codexOutPut/2026-11-04/codex-skill-codex/outputs/claude-plugin-aitoearn
   claude plugin install aitoearn@<marketplace-name>
   ```
   或直接把本目录复制到 `~/.claude/plugins/` 下，在 Claude Code 中启用；完全退出并重启 Claude Code 后新会话生效。

## 验证失败怎么办

如果重启后发送「列出可用的发布渠道」提示没有相关工具或连接失败，说明 **MCP 没有配好（只装技能不算完成）**。
请打开包内的 `安装提示词.md`，按其中「MCP 手动兜底」小节处理；自动配置搞不定时，改用官方「AiToEarn 全平台管理器」安装。
