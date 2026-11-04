# AiToEarn — 豆包技能包（免安装器版）

取自 `payload/doubao-skill-aitoearn`，未改动源文件。入口 `SKILL.md` + 13 个子技能（`skills/`）+ 连接器说明（`references/mcp-connector.md`）。

## 第 0 步：获取 API Key（安装前置）

配置中的 `__AITOEARN_KEY__` 是占位符，**安装时必须向用户询问 AiToEarn API Key**
（获取方式：登录 aitoearn.cn（或国际站 aitoearn.ai）→ 设置 → API Key → 创建）后替换进去；
两站 Key 不通用。包里不预置任何真实 Key，可直接分发。

## 安装步骤（等价于安装器「豆包引导」）

1. 打开豆包 → 「技能」→ 导入技能 → 选择本目录
2. 豆包 → 「技能 / 连接器 / 伙伴」→ 新建自定义连接器：
   - 地址：`https://aitoearn.cn/api/ai/agent/mcp`（国际站用 `https://aitoearn.ai/api/ai/agent/mcp`）
   - 鉴权：自定义请求头 `X-Api-Key`，值为第 0 步询问到的 Key
3. 保存连接器后，**完全退出并重新打开豆包客户端**（不是关闭窗口），重启后新对话才会加载新技能和连接器
4. 开新对话，说「列出可用的发布渠道」验证

卸载：删除豆包里的连接器 + 删除本目录即可。

## 验证失败怎么办

如果重启后发送「列出可用的发布渠道」提示没有相关工具或连接失败，说明 **MCP 没有配好（只装技能不算完成）**。
请打开包内的 `安装提示词.md`，按其中「MCP 手动兜底」小节处理；自动配置搞不定时，改用官方「AiToEarn 全平台管理器」安装。
