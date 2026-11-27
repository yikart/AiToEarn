# AiToEarn — Trae 技能包

本包包含 Trae 技能和无静态凭证的 `mcp.json`。中国版 MCP 地址是 `https://aitoearn.cn/api/ai/agent/mcp`；国际版为 `https://aitoearn.ai/api/ai/agent/mcp`。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 Trae 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/trae-skill-aitoearn 的技能包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装，引导我完成 OAuth 授权，最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn skill package for Trae from https://github.com/yikart/AiToEarn/tree/main/skills/trae-skill-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md to finish installation, guide me through OAuth authorization, and verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/trae-skill-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 重要：Trae 不会自动加载技能包里的 mcp.json

Trae 官方的技能目录（`~/.trae-cn/skills/`、`<项目>/.trae/skills/`）只识别 `SKILL.md` 及其资源文件，**不会读取技能包内的 `mcp.json`**。MCP Server 只能通过以下官方方式之一配置（三选一）。

另外注意：Trae 真正加载的全局配置文件是**用户数据目录下的 `mcp.json`**（macOS 为 `~/Library/Application Support/Trae CN/User/mcp.json`；Windows/Linux 为 Trae 用户数据目录下的 `User/mcp.json`），**不是** `~/.trae-cn/mcp.json`。写到后者不会生效，也不会出现在 设置 > MCP 列表中。

### 方式一：一键安装链接（推荐）

把下面的链接粘贴到浏览器地址栏并回车，确认打开 TRAE，在弹出的「手动配置」窗口中确认即可：

中国版（aitoearn-cn）：

```
trae-cn://trae.ai-ide/mcp-import?type=http&name=aitoearn-cn&config=eyJ1cmwiOiJodHRwczovL2FpdG9lYXJuLmNuL2FwaS9haS9hZ2VudC9tY3AifQ%3D%3D
```

国际版（aitoearn）：

```
trae-cn://trae.ai-ide/mcp-import?type=http&name=aitoearn&config=eyJ1cmwiOiJodHRwczovL2FpdG9lYXJuLmFpL2FwaS9haS9hZ2VudC9tY3AifQ%3D%3D
```

链接格式来自 Trae 官方文档「MCP Server 安装链接」；`config` 为 `{"url":"..."}` 的 Base64 编码，不含任何凭证。国际版客户端是否注册同一 schema 未验证；如链接无法唤起，请用方式二。

### 方式二：手动添加 / 直接写全局配置（全局生效）

前往 **设置 > MCP > 添加 > 手动添加**，粘贴本包 `mcp.json` 中 `mcpServers` 的对应条目（中国版 `aitoearn-cn` 或国际版 `aitoearn`），点击确认。

也可以由 AI 或脚本直接编辑上面的全局 `mcp.json`，在 `mcpServers` 中加入同一条目；写入后必须**完全退出并重启 Trae**，并以 **设置 > MCP** 列表出现该条目为准——只看到文件内容写对不算成功。

两种方式都不得添加请求头、环境变量或本地密钥文件。

### 方式三：项目级配置（仅当前项目生效）

在项目根目录创建 `.trae/mcp.json`，内容为本包的 `mcp.json`；并在 **设置 > MCP** 中打开「启用项目级 MCP」开关（界面说明为「允许自动从项目根目录下的 .trae/mcp.json 中加载 MCP 配置」），确认项目目录已信任。Trae 会在需要时自动从该文件加载。

## 完成 OAuth 认证

配置完成后重启 Trae，用户需要**到 MCP 设置/连接管理页对 AiToEarn 连接主动发起认证**，在浏览器完成 OAuth 授权。服务端已改为仅支持 OAuth，不再支持 API Key。

注意：Trae CN 自 v3.3.51（2026-04-14）起支持完整的 MCP OAuth 授权流程（官方更新日志），请使用该版本或更高版本。服务端已按 MCP 授权规范提供 401 + WWW-Authenticate、OAuth discovery 和动态客户端注册（DCR），并已用 Trae 的注册报文实测 DCR 成功。若授权仍未完成，必须报告 MCP 连接未完成；不要使用旧的静态鉴权方案。完成授权后，新对话发送「列出可用的发布渠道」验证。

## 切换中国版 / 国际版

两个版本的授权不通用，只保留一个连接。切换步骤：

1. 在 **设置 > MCP** 中删除当前 AiToEarn 条目（`aitoearn-cn` 或 `aitoearn`）；
2. 按目标版本重新添加（上文三种方式任选）：中国版 `aitoearn-cn` + `https://aitoearn.cn/api/ai/agent/mcp`；国际版 `aitoearn` + `https://aitoearn.ai/api/ai/agent/mcp`；
3. 完全退出并重启 Trae，在 **设置 > MCP** 对新连接**主动发起认证**，完成 OAuth 登录；
4. 发送「列出可用的发布渠道」验证。

## 更新已有安装

如果以前导入过 AiToEarn 技能或配置过 AiToEarn MCP，先删除旧技能和旧的 AiToEarn MCP 服务条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他 MCP 服务。旧配置中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除。

然后按上面三种方式之一重新配置 MCP，并完成 OAuth 认证。
