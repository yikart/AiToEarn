# AiToEarn — Codex 插件包（免安装器版）

本目录是从 AiToEarn 全平台管理器 payload 中拆分出的、可直接上架 Codex 插件库的自包含插件包。
已按安装器原本会完成的组装步骤拼好：`skills/aitoearn/` 内是完整的合并技能包，根目录是插件清单。

## 目录结构

```
codex-plugin-aitoearn/
├── .codex-plugin/
│   └── plugin.json        # 插件清单（名称、版本、skills 路径、展示信息）
├── .mcp.json.tpl          # MCP 配置模板（__AITOEARN_*__ 占位符，安装时替换）
├── README.md
└── skills/
    └── aitoearn/          # 完整技能包（13 个子技能合并包）
        ├── SKILL.md       # 入口技能（路由表 + 核心规则）
        ├── icon.png
        ├── references/    # 13 个子技能的 SKILL.md 及其参考文档
        ├── scripts/       # aitoearn-bridge.mjs / aitoearn-mcp-setup.mjs
        └── evals/         # 评测样例
```

## 上架说明

- `plugin.json` 中 `"skills": "./skills/"` 指向技能目录，每个子目录为一个技能，已满足插件库要求。
- MCP 接入使用 `.mcp.json.tpl` 模板：上架时由插件安装流程（`authentication: ON_INSTALL`）
  将 `__AITOEARN_SERVER__` / `__AITOEARN_URL__` / `__AITOEARN_KEY__` 替换为实际值后生成 `.mcp.json`。
- 技能内引用的 `<this-skill-root>/scripts/` 已包含在 `skills/aitoearn/scripts/`，路径自洽。

## 第 0 步：获取 API Key（安装前置）

所有配置中的 `__AITOEARN_KEY__` 都是占位符，**安装时必须向用户询问 AiToEarn API Key**
（获取方式：登录 aitoearn.cn（或国际站 aitoearn.ai）→ 设置 → API Key → 创建），
拿到后替换进相应配置文件；两站 Key 不通用。需要国际站时同时把 URL 换成 `https://aitoearn.ai/api/ai/agent/mcp`。
包里不预置任何真实 Key，配置模板可直接分发。

## 本地手动使用（不经过安装器）

1. 将 `.mcp.json.tpl` 复制为 `.mcp.json`，替换三个占位符：
   - `__AITOEARN_SERVER__` → `aitoearn-cn`（国内站）或 `aitoearn`（国际站）
   - `__AITOEARN_URL__` → `https://aitoearn.cn/api/ai/agent/mcp` 或 `https://aitoearn.ai/api/ai/agent/mcp`
   - `__AITOEARN_KEY__` → 向用户询问获取
2. 注册本地 marketplace（清单文件名必须是 `.agents/plugins/marketplace.json`）：
   ```json
   {
     "name": "aitoearn-local",
     "plugins": [{ "name": "aitoearn",
       "source": { "source": "local", "path": "./plugins/aitoearn" },
       "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" } }]
   }
   ```
   插件目录放在该 marketplace 目录的 `plugins/aitoearn/` 下，并在 `~/.codex/config.toml` 增加
   `[marketplaces.aitoearn-local]` 与 `[plugins."aitoearn@aitoearn-local"] enabled = true`。
3. 执行 `codex plugin add aitoearn@aitoearn-local` 安装，完全退出并重启 Codex 后新会话生效。

## 验证失败怎么办

如果重启后发送「列出可用的发布渠道」提示没有相关工具或连接失败，说明 **MCP 没有配好（只装技能不算完成）**。
请打开包内的 `安装提示词.md`，按其中「MCP 手动兜底」小节处理；自动配置搞不定时，改用官方「AiToEarn 全平台管理器」安装。
