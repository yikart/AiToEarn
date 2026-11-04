# AiToEarn — Kimi Work 插件包（免安装器版）

取自 `payload/kimi-plugin-aitoearn`（kimi.plugin.json + skills/aitoearn-growth + locales + icon），未改动源文件。
另附安装器生成的 `mcp.json` 模板（MCP 服务器 `aitoearn-cn`，`X-Api-Key` 为 `__AITOEARN_KEY__` 占位符；合并进 Kimi 运行时的 mcp.json，不要覆盖整个文件）。

## 第 0 步：获取 API Key（安装前置）

配置中的 `__AITOEARN_KEY__` 是占位符，**安装时必须向用户询问 AiToEarn API Key**
（获取方式：登录 aitoearn.cn（或国际站 aitoearn.ai）→ 设置 → API Key → 创建）后替换进去；
两站 Key 不通用。包里不预置任何真实 Key，可直接分发。

## 安装步骤（等价于安装器「Kimi Work」）

1. 把本目录复制到 `~/Library/Application Support/kimi-desktop/daimon-share/plugin-sources/personal/aitoearn-growth`
2. 把 `mcp.json` 中 `__AITOEARN_KEY__` 替换为第 0 步询问到的 Key（国际站 Key 同时换 URL），然后把 `aitoearn-cn` 条目合并进 `~/Library/Application Support/kimi-desktop/daimon-share/daimon/runtime/kimi-code/home/mcp.json`
3. 打开 Kimi Work → 插件 → 自定义插件（Plugin Builder）→ 导入该目录（或在「个人」页签中启用）
4. **完全退出并重新打开 Kimi Work**（不是关闭窗口），重启后「插件 → 已安装」里才会出现「全域内容运营助手」
5. 新会话里说「列出可用的发布渠道」验证

卸载：删除上述 plugin-sources 目录与已安装条目；MCP 条目从 mcp.json 删除。

## 验证失败怎么办

如果重启后发送「列出可用的发布渠道」提示没有相关工具或连接失败，说明 **MCP 没有配好（只装技能不算完成）**。
请打开包内的 `安装提示词.md`，按其中「MCP 手动兜底」小节处理；自动配置搞不定时，改用官方「AiToEarn 全平台管理器」安装。
