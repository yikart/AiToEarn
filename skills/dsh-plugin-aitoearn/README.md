# AiToEarn — DeepSeek Harness 插件包（免安装器版）

已按安装器逻辑组装：node 插件（`package.json` + `lib/index.js`）+ `skills/aitoearn/`（技能提供方）+ `cordis.patch.yml`（`__AITOEARN_KEY__` 为占位符；`cordis.patch.yml.tpl` 为原始模板）。

## 第 0 步：获取 API Key（安装前置）

配置中的 `__AITOEARN_KEY__` 是占位符，**安装时必须向用户询问 AiToEarn API Key**
（获取方式：登录 aitoearn.cn（或国际站 aitoearn.ai）→ 设置 → API Key → 创建）后替换进去；
两站 Key 不通用。包里不预置任何真实 Key，可直接分发。

## 安装步骤（等价于安装器「DeepSeek Harness」）

1. 把本目录复制到 `~/.dsh/plugins/dsh-plugin-aitoearn`
2. 把 `cordis.patch.yml` 中的 `__AITOEARN_KEY__` 替换为第 0 步询问到的 Key（国际站 Key 同时把 URL 换成 `https://aitoearn.ai/api/ai/agent/mcp`）
3. 编辑 `~/.dsh/profiles/desktop/package.json`：
   - `dependencies` 增加 `"dsh-plugin-aitoearn": "file:/Users/<你的用户名>/.dsh/plugins/dsh-plugin-aitoearn"`
   - `dsh.profile.bundles` 数组追加 `"dsh-plugin-aitoearn"`
   （若该文件不存在，先用最小骨架创建：name=dsh-profile-desktop、private=true、dependencies={}、bundles 含 @deepseek-ai/dsh-base 与 @deepseek-ai/dsh-web-app）
4. 创建符号链接：`ln -s ~/.dsh/plugins/dsh-plugin-aitoearn ~/.dsh/profiles/desktop/node_modules/dsh-plugin-aitoearn`
5. 若存在 `~/.dsh/profiles/desktop/cordis.patch.yml`，把本包 `cordis.patch.yml` 的两个条目（dsh-plugin-aitoearn、mcp-aitoearn）合并进去，避免 id 冲突
6. **完全退出并重新打开 DeepSeek Harness**（不是关闭窗口），重启后新会话才会加载插件与 MCP 连接
7. 新会话里说「列出可用的发布渠道」验证

卸载：反向操作——删依赖/ bundles 条目、删符号链接、删插件目录；`~/.dsh/skills/aitoearn` 旧形态如存在一并删除。

## 验证失败怎么办

如果重启后发送「列出可用的发布渠道」提示没有相关工具或连接失败，说明 **MCP 没有配好（只装技能不算完成）**。
请打开包内的 `安装提示词.md`，按其中「MCP 手动兜底」小节处理；自动配置搞不定时，改用官方「AiToEarn 全平台管理器」安装。
