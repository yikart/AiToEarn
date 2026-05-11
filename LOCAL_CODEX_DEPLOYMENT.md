# AiToEarn 本地 Codex 接入与使用说明

这份文档给接手本目录的人使用：目标是在本机运行 AiToEarn，并让 AiToEarn 的 AI 聊天能力走当前用户系统里的 Codex API 服务，模型固定为 `gpt-5.5`，推理强度固定为 `xhigh`。

## 适用场景

- 想在本机完整使用 AiToEarn Web 控制台。
- 想让 AiToEarn 调用本机 Codex 的 OpenAI 兼容 API，而不是在仓库里保存真实 OpenAI Key。
- 想把本机 AiToEarn 暴露给浏览器、MCP 客户端或其他内部服务调用。

## 组件关系

```text
Browser / MCP client / local API caller
        |
        | http://localhost:18080
        v
Nginx in Docker Compose
        |
        | /api/ai/* -> aitoearn-ai
        | /api/*    -> aitoearn-server
        v
AiToEarn services
        |
        | OPENAI_BASE_URL=http://host.docker.internal:52032/v1
        v
scripts/codex-openai-proxy.mjs
        |
        | reads ~/.codex/config.toml and ~/.codex/auth.json
        v
Local Codex API service
        |
        | model=gpt-5.5, reasoning_effort=xhigh
        v
OpenAI-compatible response
```

仓库不会保存真实 Codex API Key。代理启动时从当前用户的 `~/.codex/auth.json` 读取 Key，从 `~/.codex/config.toml` 读取 `codex_local_access` 的 `base_url`。

## 前置条件

- Node.js 可用。本机已验证 Node `v22.22.0` 可运行代理脚本。
- 当前用户已经配置好 Codex API Key 模式，且 `~/.codex/config.toml` 中存在 `model_providers.codex_local_access`。
- 容器运行时可用。推荐 Docker Compose，因为原项目已经提供完整编排。
- Apple Silicon 机器必须安装 arm64 版 Docker Desktop。Intel 版 Docker Desktop 会启动失败。

## 本地默认端口

`scripts/start-local-codex.sh` 会导出一组不冲突的宿主机端口。容器内部端口保持原项目默认值不变，只改变宿主机映射。

| 服务 | 容器内部端口 | 本地默认宿主机端口 | 可覆盖环境变量 |
| --- | --- | --- | --- |
| Web / Nginx | `80` | `18080` | `AITOEARN_HTTP_PORT` |
| RustFS S3 proxy | `9000` | `19000` | `AITOEARN_RUSTFS_PORT` |
| RustFS console | `9001` | `19001` | `AITOEARN_RUSTFS_CONSOLE_PORT` |
| MongoDB | `27017` | `27018` | `AITOEARN_MONGODB_PORT` |
| Redis | `6379` | `6380` | `AITOEARN_REDIS_PORT` |
| Codex OpenAI proxy | `52032` | `52032` | `CODEX_OPENAI_PROXY_PORT` |

如需覆盖端口，在启动命令前传入对应环境变量即可，例如：

```bash
AITOEARN_HTTP_PORT=28080 ./scripts/start-local-codex.sh
```

## 一条命令启动

在仓库根目录运行：

```bash
./scripts/start-local-codex.sh
```

脚本会做这些事：

- 启动 Docker Desktop；如果已安装 Colima，则优先启动 Colima。
- 启动本机 Codex OpenAI 兼容代理：`http://127.0.0.1:52032/v1`。
- 用 `docker-compose.yml` 加 `docker-compose.codex.yml` 启动 AiToEarn。
- 让容器里的 `aitoearn-ai` 和 `aitoearn-server` 使用 `OPENAI_BASE_URL=http://host.docker.internal:52032/v1`。

启动完成后打开：

```text
http://localhost:18080
```

## 给别人怎么使用

普通用户直接打开 Web：

```text
http://localhost:18080
```

AI 助手或 MCP 客户端连接本机 AiToEarn：

```text
http://localhost:18080/api/unified/mcp
```

SSE 连接地址：

```text
http://localhost:18080/api/unified/sse
```

认证方式沿用 AiToEarn 的 API Key 机制。启动后在 Web 里进入设置创建 API Key，然后客户端请求带上：

```text
x-api-key: <AiToEarn API Key>
```

AI 聊天模型列表接口：

```bash
curl http://localhost:18080/api/ai/models/chat
```

这个接口是公开接口，能用来确认 `gpt-5.5` 已经出现在 AiToEarn 可选模型中。真正调用 `/api/ai/chat` 或 `/api/ai/chat/stream` 需要登录态或用户 token，普通使用建议从 Web 界面发起。

## Codex 代理单独验证

只验证 Codex 接入，不启动 Docker：

```bash
node scripts/codex-openai-proxy.mjs
```

另一个终端执行：

```bash
curl -s http://127.0.0.1:52032/health
```

预期能看到代理配置，例如：

```json
{"ok":true,"upstream":"http://127.0.0.1:52031/v1","model":"gpt-5.5","reasoningEffort":"xhigh"}
```

聊天冒烟测试：

```bash
curl -s http://127.0.0.1:52032/v1/chat/completions \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer dummy' \
  -d '{"model":"anything","messages":[{"role":"user","content":"Reply with exactly OK"}],"max_tokens":20}'
```

这里传入的 `model` 会被代理强制改成 `gpt-5.5`，并补上 `reasoning_effort: xhigh`。

## 可调环境变量

```bash
CODEX_OPENAI_PROXY_PORT=52032
CODEX_OPENAI_MODEL=gpt-5.5
CODEX_OPENAI_REASONING_EFFORT=xhigh
CODEX_MODEL_PROVIDER=codex_local_access
CODEX_OPENAI_FORCE_MODEL=1
```

常用变体：

- `CODEX_OPENAI_FORCE_MODEL=0`：不强制覆盖上游传入的模型，只在模型为空时使用 `gpt-5.5`。
- `CODEX_OPENAI_HOST=host.lima.internal`：使用 Colima 时让容器访问宿主机代理。
- `DOCKER_BIN=/path/to/docker`：指定 Docker CLI 路径。

Colima 示例：

```bash
CODEX_OPENAI_HOST=host.lima.internal ./scripts/start-local-codex.sh
```

## 常见问题

`Docker Desktop is not running or not ready.`

检查 Docker daemon 是否能工作：

```bash
docker info
```

如果是 Apple Silicon 且日志提示 `This is the Intel version of Docker Desktop`，需要安装 arm64 版 Docker Desktop 后再运行启动脚本。

`Codex OpenAI proxy did not become healthy.`

检查日志：

```bash
tail -80 .local/codex-openai-proxy.log
```

常见原因是 `~/.codex/auth.json` 没有 `OPENAI_API_KEY`，或者 `~/.codex/config.toml` 中没有 `model_providers.codex_local_access.base_url`。

AI 功能报模型不可用。

先确认模型列表：

```bash
curl http://localhost:18080/api/ai/models/chat
```

应能看到 `gpt-5.5`，显示名为 `GPT-5.5 Codex xhigh`。如果没有，重启 AI 服务：

```bash
docker compose -f docker-compose.yml -f docker-compose.codex.yml restart aitoearn-ai
```

## 相关文件

- `scripts/start-local-codex.sh`：本地一键启动入口。
- `scripts/codex-openai-proxy.mjs`：Codex 到 OpenAI 兼容接口的本机代理。
- `docker-compose.codex.yml`：Docker Compose 覆盖文件，负责把 AiToEarn AI 请求指到本机代理。
- `project/aitoearn-backend/apps/aitoearn-ai/config/config.js`：AiToEarn AI 模型配置，已加入 `gpt-5.5`。
