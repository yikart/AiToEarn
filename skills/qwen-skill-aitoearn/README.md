# AiToEarn — 千问（通义千问 App）技能包（免安装器版）

技能本体取自 `payload/qwenwork-aitoearn`（与千问办公同源），放在 `aitoearn/` 子目录。
另附安装器会生成的 `cloud-skills-entry.json`：千问技能清单 `.cloud-skills.json` 中需要合并的登记条目
（`localPath` 需改成实际路径；同时把 `recordRevisionCounter` +1、`generatedAt`/`installedAt`/`updatedAt`/`lastCheckedAt` 改为当前 UTC 时间）。

## 第 0 步：获取 API Key（安装前置）

配置中的 `__AITOEARN_KEY__` 是占位符，**安装时必须向用户询问 AiToEarn API Key**
（获取方式：登录 aitoearn.cn（或国际站 aitoearn.ai）→ 设置 → API Key → 创建）后替换进去；
两站 Key 不通用。包里不预置任何真实 Key，可直接分发。

## 安装步骤（等价于安装器「千问」）

1. 先打开一次千问桌面端并登录（生成技能库目录）
2. 把 `aitoearn/` 复制到 `~/Library/Application Support/Qianwen/qwen-agent/<你的账号目录>/skills/aitoearn`
3. 编辑同目录的 `.cloud-skills.json`，合并 `cloud-skills-entry.json` 中的条目（注意改 localPath 和时间戳）
4. **完全退出并重新打开千问桌面端**（不是关闭窗口），重启后「技能 → 已安装」应出现「全域内容运营助手」
5. 千问「连接」→ 添加：名称 AiToEarn，HTTP，URL `https://aitoearn.cn/api/ai/agent/mcp`（国际站 `https://aitoearn.ai/api/ai/agent/mcp`），Header `X-Api-Key = `第 0 步询问到的 Key
6. **新建任务**（旧任务不加载新连接器），发送「使用全域内容运营助手技能，列出可用的发布渠道」验证

卸载：删除技能目录与清单条目；连接器在千问「连接」里手动删除。

## 验证失败怎么办

如果重启后发送「列出可用的发布渠道」提示没有相关工具或连接失败，说明 **MCP 没有配好（只装技能不算完成）**。
请打开包内的 `安装提示词.md`，按其中「MCP 手动兜底」小节处理；自动配置搞不定时，改用官方「AiToEarn 全平台管理器」安装。
