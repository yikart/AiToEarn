# AiToEarn — Trae 技能包（免安装器版）

取自 `payload/trae-aitoearn`（合并包：SKILL.md + references/ 13 子技能 + scripts/），未改动源文件。
另附安装器会生成的两个配置文件模板：

- `mcp.json` — MCP 服务器 `aitoearn-cn`，`X-Api-Key` 为 `__AITOEARN_KEY__` 占位符（**注意是合并目标**：若 `~/.trae-cn/mcp.json` 已有其它服务器，把 `mcpServers.aitoearn-cn` 合并进去，不要整个覆盖）
- `skill-config.json` — 技能注册 `managedSkills.aitoearn = "user_upload"`（同样是合并目标）

## 第 0 步：获取 API Key（安装前置）

配置中的 `__AITOEARN_KEY__` 是占位符，**安装时必须向用户询问 AiToEarn API Key**
（获取方式：登录 aitoearn.cn（或国际站 aitoearn.ai）→ 设置 → API Key → 创建）后替换进去；
两站 Key 不通用。包里不预置任何真实 Key，可直接分发。

## 安装步骤（等价于安装器「Trae」）

1. 把本目录复制为 `~/.trae-cn/skills/aitoearn`
2. 把 `mcp.json` 中 `__AITOEARN_KEY__` 替换为第 0 步询问到的 Key（国际站 Key 同时换 URL），然后把 `aitoearn-cn` 条目合并进 `~/.trae-cn/mcp.json`；
   同时也合并进 `~/Library/Application Support/Trae CN/User/mcp.json`（Trae CN 用户级配置）
3. 把 `skill-config.json` 的 `managedSkills` 合并进 `~/.trae-cn/skill-config.json`
4. **完全退出并重新打开 Trae**（不是关闭窗口），重启后新对话才会加载技能与 MCP 连接
5. 新对话里说「列出可用的发布渠道」验证——能列出渠道说明技能与 MCP 都配好了；如果提示没有相关工具，说明 MCP 没配好（只装了技能），按下面的手动配置补上

## MCP 手动配置（自动配置失败时）

如果安装时无法写入 `~/.trae-cn/mcp.json` 和 Trae CN 用户级 mcp.json，在 Trae 客户端里手动添加 MCP 服务器：

1. Trae → 设置（齿轮图标）→ 「MCP」相关入口（MCP 工具 / MCP Servers / 模型上下文协议）
2. 添加服务器：名称 `aitoearn-cn`，URL `https://aitoearn.cn/api/ai/agent/mcp`（国际站 `https://aitoearn.ai/api/ai/agent/mcp`），Headers 加一条 `X-Api-Key = `第 0 步的 Key
3. 保存后新开对话重新验证

卸载：删除 `~/.trae-cn/skills/aitoearn`，并从上述两个 mcp.json 删除 aitoearn-cn 条目、从 skill-config.json 删除 aitoearn 注册。

## 验证失败怎么办

如果重启后发送「列出可用的发布渠道」提示没有相关工具或连接失败，说明 **MCP 没有配好（只装技能不算完成）**。
请打开包内的 `安装提示词.md`，按其中「MCP 手动兜底」小节处理；自动配置搞不定时，改用官方「AiToEarn 全平台管理器」安装。
