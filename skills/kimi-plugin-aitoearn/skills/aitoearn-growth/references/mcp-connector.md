# AiToEarn MCP 连接器说明（Codex 版）

AiToEarn 的内容生成（文案、图片、视频）与全平台发布能力通过 MCP 服务提供。本技能在 Codex 中通过 stdio 桥接远端 Streamable HTTP 端点。

## 已完成的注册（安装时配置）

`~/.codex/config.toml` 中已注册两个 MCP 服务器：

```toml
[mcp_servers.aitoearn]
command = "node"
args = ["/Users/yika/.codex/skills/aitoearn/scripts/aitoearn-bridge.mjs", "--url", "https://aitoearn.ai/api/ai/agent/mcp", "--env-key", "AITOEARN_API_KEY"]

[mcp_servers.aitoearn-cn]
command = "node"
args = ["/Users/yika/.codex/skills/aitoearn/scripts/aitoearn-bridge.mjs", "--url", "https://aitoearn.cn/api/ai/agent/mcp", "--env-key", "AITOEARN_CN_API_KEY"]
```

桥接脚本按以下顺序解析 API Key（先到先用）：

1. 进程环境变量 `AITOEARN_API_KEY` / `AITOEARN_CN_API_KEY`
2. `$AITOEARN_CONFIG` 指定的配置文件
3. `~/.aitoearn/config.json`，形如 `{ "AITOEARN_API_KEY": "...", "AITOEARN_CN_API_KEY": "..." }`

注意：从 macOS 图形界面启动的 Codex 不会读取 `~/.zshrc` 里的 `export`，因此推荐把 Key 写入 `~/.aitoearn/config.json`（setup 脚本自动完成，chmod 600），而不是只放在 shell 环境变量里。

## 替代方案：HTTP 直连

若本机没有 node，可改用原生 HTTP 连接（Key 需另行注入，例如 launchd 环境）：

```toml
[mcp_servers.aitoearn-cn]
url = "https://aitoearn.cn/api/ai/agent/mcp"
http_headers = { Authorization = "Bearer ${AITOEARN_CN_API_KEY}" }
```

## API Key 获取

- 登录 aitoearn.ai（国际站）或 aitoearn.cn（中国站），在设置 / 开发者页面创建 AiToEarn API Key。
- 两个站点的账号与 Key 相互独立：国际站 Key 只能连国际站 URL，中国站 Key 只能连中国站 URL。
- 不要把 API Key 写进技能文件或对话内容；只保存在 `~/.aitoearn/config.json` 或连接器鉴权配置中。

## 故障排查

- 会话中看不到 aitoearn 工具：新开一个 Codex 会话（MCP 服务器在会话启动时连接）；确认 `node --version` 可用。
- 调用返回 `-32001`（missing/invalid key）：运行 `node <技能根>/scripts/aitoearn-mcp-setup.mjs <API_KEY> [cn|ai]` 重新写入并验证 Key。
- 工具数量明显偏少或全部调用 401：多半是站点与 Key 不匹配（cn / ai 两站 Key 不通用）。
- 验收参考：本包 `evals/` 目录下有 4 个子技能的评测用例（来自 WorkBuddy 打包，版本 0.0.4）。
