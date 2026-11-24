# Aitoearn — DeepSeek Harness 插件

自媒体运营增长变现专家。帮你生成文案/图文/短视频，一键分发抖音、快手、小红书、公众号、bilibili、Facebook、TikTok 等海内外平台，覆盖从内容创作、内容发布到内容变现全链路。

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
├── cordis.patch.yml.tpl      # 国内站配置模板
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

鉴权默认使用国内站 `https://aitoearn.cn/api/ai/agent/mcp`。

市场安装后，用装进该 profile 的命令。`<profile>` 与安装时的 `--profile` 相同，`dsh web` 一般是 `web`：

```bash
~/.dsh/profiles/<profile>/node_modules/.bin/aitoearn login
```

手工复制到 `~/.dsh/plugins/dsh-plugin-aitoearn` 时：

```bash
node ~/.dsh/plugins/dsh-plugin-aitoearn/scripts/aitoearn.mjs login
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

## 验证

```bash
node scripts/aitoearn.mjs status
npm pack --dry-run
```

`npm pack --dry-run` 应包含 `lib/`、`scripts/`、`skills/`、`locale/`、`cordis.patch.yml`、`安装提示词.md` 与 `registry/`。

## 上架 DSH 插件目录

1. **插件达标**：`package.json` 已声明 `dsh.bundle.patch`，`cordis.patch.yml` 引用的文件全部在发布产物内
2. **仓库达标**：
   - 本包位于 AiToEarn 的 `skills/dsh-plugin-aitoearn/`
   - 仓库地址：`https://github.com/yikart/AiToEarn`
   - 仓库已有 `dsh-plugin` topic，创建已超过 1 天
3. **提 PR** 到 `awesome-dsh-plugin/awesome-dsh-plugin`：
   - 提交文件：`data/plugins/yikart__AiToEarn--skills-dsh-plugin-aitoearn.yml`
   - 一个 PR 最多 3 条，README 由脚本生成，不要手改

## 卸载

删除 `~/.dsh/plugins/dsh-plugin-aitoearn`、profile 里的依赖 / bundles 条目与符号链接。
如需清除授权：`aitoearn logout`。
