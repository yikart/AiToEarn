# Aitoearn — DeepSeek Harness 插件

自媒体运营增长变现专家。帮你生成文案/图文/短视频，一键分发抖音、快手、小红书、公众号、bilibili、Facebook、TikTok 等海内外平台，覆盖从内容创作、内容发布到内容变现全链路。

## 一键安装提示词 / One-click install prompt

把下面任一段完整复制，发给 DeepSeek Harness 的 AI 助手即可开始安装。**默认中国版**；装国际版时把「中国版」改为「国际版」（英文段把 China version 改为 International version），其余不变。

中文：

```
帮我安装 https://github.com/yikart/AiToEarn/tree/main/skills/dsh-plugin-aitoearn 的插件包（中国版）。只下载该目录（例如 git sparse checkout，或只解压仓库压缩包中的这个子目录），不要克隆整个仓库。下载后按包内 README.md 和 安装提示词.md 完成安装，引导我完成 OAuth 授权，最后用「列出可用的发布渠道」验证。
```

English:

```
Install the AiToEarn plugin package for DeepSeek Harness from https://github.com/yikart/AiToEarn/tree/main/skills/dsh-plugin-aitoearn (China version). Download only that directory (e.g. git sparse checkout, or extract just this subdirectory from the repository archive) — do NOT clone the whole repository. Then follow the package's README.md and 安装提示词.md to finish installation, guide me through OAuth authorization, and verify with "List my available publishing channels".
```

如果 AI 助手无法联网下载，请手动下载该目录（仓库页面 Code → Download ZIP 后只取 `skills/dsh-plugin-aitoearn`，或用 sparse checkout），再把包内 `安装提示词.md` 的内容发给它。

## 功能

- **OAuth 2.1 鉴权**：授权码 + PKCE（S256），设备码兜底，令牌自动刷新
- **动态客户端注册**（RFC 7591），也可用 `AITOEARN_OAUTH_CLIENT_ID` 指定已有客户端
- **MCP 连接**：插件自维护 Streamable HTTP 客户端，逐请求注入 Authorization 头，401/403 时强制刷新并重试
- **自动工具同步**：检测到令牌变化后自动重新同步，无需重装
- **13 个子技能**：文案生成、图片创作、视频生成/剪辑、语音转写、多平台发布等

## 目录结构

```
dsh-plugin-aitoearn/
├── package.json              # dsh.bundle，从 GitHub 子目录安装，不发布 npm
├── cordis.patch.yml          # bundle patch
├── cordis.patch.yml.tpl      # 中国版配置模板
├── 安装提示词.md              # 交给 AI 执行的安装指令
├── locale/                   # 插件管理面板元数据
├── lib/
│   ├── index.js              # 技能提供方 + MCP 生命周期
│   ├── oauth.js              # 发现 / DCR / PKCE / 设备码 / 刷新 / 存储
│   ├── mcp.js                # Streamable HTTP MCP 客户端
│   └── tool-bridge.js        # 工具命名与注册
├── scripts/aitoearn.mjs      # login / status / refresh / logout
├── skills/aitoearn/          # 技能与子技能
└── registry/data/plugins/    # awesome-dsh-plugin 收录条目
```

## 安装

本插件不发布到 npm。它在 AiToEarn 仓库的 `skills/dsh-plugin-aitoearn`。仓库根目录没有 `dsh.bundle`，不要安装根目录。

### 更新已有安装

如果以前安装或配置过 AiToEarn，先删除旧的 `dsh-plugin-aitoearn` 插件及 profile 中对应的依赖、bundle 和符号链接，再删除 `cordis.patch.yml` 中旧的 AiToEarn MCP 条目；仅处理 `aitoearn`、`aitoearn-cn` 或指向旧 AiToEarn 地址的条目，不要删除其他服务。旧条目中的旧版 MCP 地址、认证请求头、环境变量和 API Key 也必须移除，然后再按下方步骤安装。

```bash
dsh plugin --profile desktop add "github:yikart/AiToEarn#path:/skills/dsh-plugin-aitoearn"
```

`desktop` 换成实际使用的 profile 名。`dsh web` 一般是 `web`。源码已经是可运行的 JavaScript，不需要先构建。

### 手动拉取

```bash
git clone https://github.com/yikart/AiToEarn.git
```

插件目录是克隆结果里的 `skills/dsh-plugin-aitoearn`。

1. 把这个子目录复制到 `~/.dsh/plugins/dsh-plugin-aitoearn`
2. 编辑 `~/.dsh/profiles/desktop/package.json`：
   - `dependencies` 增加 `"dsh-plugin-aitoearn": "file:$HOME/.dsh/plugins/dsh-plugin-aitoearn"`
   - `dsh.profile.bundles` 追加 `"dsh-plugin-aitoearn"`
3. 建立符号链接：
   `ln -sfn ~/.dsh/plugins/dsh-plugin-aitoearn ~/.dsh/profiles/desktop/node_modules/dsh-plugin-aitoearn`
4. 若 `cordis.patch.yml` 已存在，合并本包的条目（id 不要重复）
5. 完全退出并重新打开 DeepSeek Harness

也可以交给 AI 安装：把 `安装提示词.md` 发给支持文件读写的客户端。

## OAuth 授权

登录前请用户自己选择版本。两个版本的授权不能混用。

| 版本 | 地址 | 登录参数 |
| --- | --- | --- |
| 中国版 | `https://aitoearn.cn/api/ai/agent/mcp` | 不加参数，或 `--site cn` |
| 国际版 | `https://aitoearn.ai/api/ai/agent/mcp` | `--site ai` |

未指定版本时默认中国版。

市场安装后，用装进该 profile 的命令。`<profile>` 与安装时的 `--profile` 相同，`dsh web` 一般是 `web`：

```bash
# 中国版
~/.dsh/profiles/<profile>/node_modules/.bin/aitoearn login

# 国际版
~/.dsh/profiles/<profile>/node_modules/.bin/aitoearn login --site ai
```

手工复制到 `~/.dsh/plugins/dsh-plugin-aitoearn` 时：

```bash
# 中国版
node ~/.dsh/plugins/dsh-plugin-aitoearn/scripts/aitoearn.mjs login

# 国际版
node ~/.dsh/plugins/dsh-plugin-aitoearn/scripts/aitoearn.mjs login --site ai
```

令牌写入 `~/.aitoearn/oauth.json`（0600），内容不会打印。其他命令：`status`、`refresh`、`logout`。

### 环境变量

| 变量 | 用途 |
|---|---|
| `AITOEARN_OAUTH_STORE` | 令牌文件路径，默认 `~/.aitoearn/oauth.json` |
| `AITOEARN_OAUTH_ISSUER` | 授权服务器 issuer |
| `AITOEARN_OAUTH_AUTHORIZE_URL` | 授权端点（覆盖自动发现） |
| `AITOEARN_OAUTH_TOKEN_URL` | 令牌端点（覆盖自动发现） |
| `AITOEARN_OAUTH_REGISTRATION_URL` | 动态客户端注册端点 |
| `AITOEARN_OAUTH_DEVICE_AUTHORIZATION_URL` | 设备码端点 |
| `AITOEARN_OAUTH_CLIENT_ID` / `_CLIENT_SECRET` | 使用已有客户端 |
| `AITOEARN_OAUTH_SCOPE` | 授权 scope |
| `AITOEARN_OAUTH_CALLBACK_PORT` | 本地回调固定端口，默认随机 |
| `AITOEARN_OAUTH_OPEN_BROWSER=0` | 不自动打开浏览器 |
| `AITOEARN_MCP_URL` | 覆盖 MCP 端点 |

## 切换中国版 / 国际版

两个版本的授权不通用。切换步骤：

1. 清除当前授权：`aitoearn logout`（手工安装为 `node ~/.dsh/plugins/dsh-plugin-aitoearn/scripts/aitoearn.mjs logout`）；
2. 重新登录目标版本完成 OAuth 授权：中国版（`https://aitoearn.cn/api/ai/agent/mcp`）用 `aitoearn login`（或不加参数 / `--site cn`）；国际版（`https://aitoearn.ai/api/ai/agent/mcp`）用 `aitoearn login --site ai`；
3. 如需长期固定版本，把 `cordis.patch.yml` 中的 `site` 改为 `cn` 或 `ai`；
4. 新开会话发送「列出可用的发布渠道」验证。

## 验证

```bash
node scripts/aitoearn.mjs status
npm pack --dry-run
```

`npm pack --dry-run` 应包含 `lib/`、`scripts/`、`skills/`、`locale/`、`cordis.patch.yml`、`安装提示词.md` 与 `registry/`。

## 卸载

删除 `~/.dsh/plugins/dsh-plugin-aitoearn`、profile 里的依赖 / bundles 条目与符号链接。
如需清除授权：`aitoearn logout`。
