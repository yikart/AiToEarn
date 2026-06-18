# \_server API helper

本目录放服务端组件、`generateMetadata`、sitemap route 等 SSR 场景复用的公开 API 请求基础设施。这里不能依赖客户端 store、浏览器 API、`directTrans` 或命令式 UI 工具。

## 文件清单

| 文件              | 导出          | 说明                                                                                        |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `server-fetch.ts` | `serverFetch` | 服务端 GET 请求封装，自动拼接完整 API URL，支持 Next.js `fetch` 的 `revalidate` 和 `tags`。 |

## 使用规则

- 仅用于无需鉴权的公开 API。
- 具体业务 SSR helper 放回对应 API 模块，例如 `src/api/tasks/task.server.ts`、`src/api/channels/channel.server.ts`。
- 客户端请求继续使用 `src/utils/request`。
