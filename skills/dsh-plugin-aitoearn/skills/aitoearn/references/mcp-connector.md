# AiToEarn MCP 连接器说明

AiToEarn 的内容生成（文案、图片、视频）与全平台发布能力通过 MCP 服务提供。
本插件在 DeepSeek Harness 内直接连接远端 Streamable HTTP 端点，使用 OAuth 2.1 授权。

## 连接方式

- 插件加载 `cordis.patch.yml` 后，用配置里的 `url` 连接 MCP 端点：
  - 国内站（默认）：`https://aitoearn.cn/api/ai/agent/mcp`
  - 海外站：`https://aitoearn.ai/api/ai/agent/mcp`
- 每次请求前从 `~/.aitoearn/oauth.json` 取访问令牌并加 `Authorization: Bearer`；
  令牌临近过期时自动用刷新令牌续期，收到 401/403 时强制刷新并重试一次。
- 默认授权国内站。海外站在 `cordis.patch.yml` 写 `site: ai`，或登录时加 `--site ai`。两站授权不通用。

## OAuth 授权

```bash
# 市场安装：<profile> 与 dsh plugin --profile 相同，dsh web 一般是 web
~/.dsh/profiles/<profile>/node_modules/.bin/aitoearn login

# 手工复制到 ~/.dsh/plugins 时
node ~/.dsh/plugins/dsh-plugin-aitoearn/scripts/aitoearn.mjs login
```

登录默认打开 https://aitoearn.cn 。海外站加 `--site ai`，打开 https://aitoearn.ai 。

脚本按以下顺序工作：

1. 通过 MCP 端点的 `/.well-known/oauth-protected-resource` 与授权服务器的
   `/.well-known/oauth-authorization-server` 自动发现端点。
2. 优先使用设备码流程（`device_authorization_endpoint`）；否则在本地
   `127.0.0.1` 起回调服务，走授权码 + PKCE（S256）。
3. 需要时用动态客户端注册（RFC 7591）获取 public client；也可用
   `AITOEARN_OAUTH_CLIENT_ID` 指定已有客户端。
4. 令牌写入 `~/.aitoearn/oauth.json`（chmod 600），并立即调用一次
   `tools/list` 验证。

其他子命令：

```bash
~/.dsh/profiles/<profile>/node_modules/.bin/aitoearn status
~/.dsh/profiles/<profile>/node_modules/.bin/aitoearn refresh
~/.dsh/profiles/<profile>/node_modules/.bin/aitoearn logout
```

## 无 OAuth 元数据时

如果部署尚未开启 OAuth（发现不到授权服务器），可用环境变量显式指定端点：

```bash
AITOEARN_OAUTH_ISSUER=https://your-issuer.example.com \
AITOEARN_OAUTH_AUTHORIZE_URL=https://your-issuer.example.com/oauth/authorize \
AITOEARN_OAUTH_TOKEN_URL=https://your-issuer.example.com/oauth/token \
AITOEARN_OAUTH_REGISTRATION_URL=https://your-issuer.example.com/oauth/register \
AITOEARN_OAUTH_CLIENT_ID=your-public-client \
~/.dsh/profiles/<profile>/node_modules/.bin/aitoearn login
```

支持的环境变量：`AITOEARN_OAUTH_STORE`、`AITOEARN_OAUTH_ISSUER`、
`AITOEARN_OAUTH_AUTHORIZE_URL`、`AITOEARN_OAUTH_TOKEN_URL`、
`AITOEARN_OAUTH_REGISTRATION_URL`、`AITOEARN_OAUTH_DEVICE_AUTHORIZATION_URL`、
`AITOEARN_OAUTH_CLIENT_ID`、`AITOEARN_OAUTH_CLIENT_SECRET`、
`AITOEARN_OAUTH_SCOPE`、`AITOEARN_OAUTH_CALLBACK_PORT`、
`AITOEARN_OAUTH_OPEN_BROWSER=0`、`AITOEARN_MCP_URL`。

## 故障排查

- 会话里看不到 aitoearn 工具：先运行 `status` 确认已授权，再新开一个会话；
  插件也会在检测到 `oauth.json` 变化后自动重新同步工具。
- 调用返回 `-32001`：令牌缺失或过期。运行 `login` 重新授权；不要手工编辑令牌文件。
- 工具数量明显偏少或调用 401/403：重新执行 `aitoearn login`。国内站用 aitoearn.cn 账号，海外站加 `--site ai` 后用 aitoearn.ai 账号。两站授权不能混用。
- 授权脚本报“未发现 OAuth 授权服务器”：按上一节显式指定端点，或联系部署方开启 OAuth。
