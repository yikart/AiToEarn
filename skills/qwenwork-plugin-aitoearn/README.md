# AiToEarn — 千问办公插件包（免安装器版）

已按安装器逻辑组装：`.qwenwork-plugin/plugin.json` + `skills/aitoearn/`（完整技能包）+ `paste-config.json`（连接器导入 JSON 模板，`__AITOEARN_KEY__` 为占位符）。

## 第 0 步：获取 API Key（安装前置）

配置中的 `__AITOEARN_KEY__` 是占位符，**安装时必须向用户询问 AiToEarn API Key**
（获取方式：登录 aitoearn.cn（或国际站 aitoearn.ai）→ 设置 → API Key → 创建）后替换进去；
两站 Key 不通用。包里不预置任何真实 Key，可直接分发。

## 安装步骤（等价于安装器「千问办公」）

1. 把本目录复制到 `~/.qwenworkcn/plugins-custom/aitoearn`
2. 把 `paste-config.json` 中的 `__AITOEARN_KEY__` 替换为第 0 步询问到的 Key（国际站 Key 需同时把 URL 换成 `https://aitoearn.ai/api/ai/agent/mcp`）
3. **完全退出并重新打开千问办公**（不是关闭窗口），重启后「扩展」里才会出现本插件
4. 左侧「扩展 → 专家套件」打开全域内容运营助手
5. 左侧「扩展 → 连接器」→ 右上角「添加」→「导入 JSON」→ 粘贴替换好 Key 的 `paste-config.json` 内容
6. 新建任务，发送「列出可用的发布渠道」验证

如果以前手动添加过 AiToEarn 连接器，先在「扩展 → 连接器」里删掉旧的，避免重复。
卸载：删除 `~/.qwenworkcn/plugins-custom/aitoearn` 并在连接器列表删除 aitoearn-cn。

## 验证失败怎么办

如果重启后发送「列出可用的发布渠道」提示没有相关工具或连接失败，说明 **MCP 没有配好（只装技能不算完成）**。
请打开包内的 `安装提示词.md`，按其中「MCP 手动兜底」小节处理；自动配置搞不定时，改用官方「AiToEarn 全平台管理器」安装。
