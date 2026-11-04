# AiToEarn — Claude Code 插件包（免安装器版）

本目录是从 AiToEarn 全平台管理器 payload 中拆分出的、可上架 Claude / Anthropic 生态的自包含插件包，
内容取自 `payload/doubao-skill-aitoearn`（13 个子技能的多技能格式，未改动任何源文件）。

## 目录结构

```
claude-plugin-aitoearn/
├── .claude-plugin/
│   └── plugin.json        # 插件清单（name/version/description/author）
├── .mcp.json.tpl          # MCP 配置模板（__AITOEARN_*__ 占位符，安装时替换）
├── README.md
└── skills/
    └── aitoearn/          # 入口技能 + 13 个子技能（原始嵌套结构，相对路径全部自洽）
        ├── SKILL.md       # 入口：路由表 + 核心规则
        ├── assets/icon.png
        ├── references/mcp-connector.md
        └── skills/        # 13 个子技能，每个含 SKILL.md（name/description frontmatter）
```

## 上架说明

- Claude Code 插件要求 `skills/<name>/SKILL.md`，frontmatter 仅需 `name` 与 `description`，均已满足；
  子技能里的 `requiredTools` 等扩展字段会被忽略，不影响加载。
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
