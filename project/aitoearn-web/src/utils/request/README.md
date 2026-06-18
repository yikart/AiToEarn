# Request 工具

客户端请求基础设施目录，只放前端运行时 API 请求封装，不放具体业务接口。具体 API 方法应放在 `src/api/<module>/`。

## 文件清单

| 文件              | 导出                                                         | 说明                                                                                   |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `index.ts`        | `request`、默认 `http`、`RequestOptions`                     | 请求模块入口，仅 re-export `client.ts` 与基础类型。                                    |
| `client.ts`       | `request`、默认 `http`、`RequestOptions`                     | 统一客户端请求实现，负责鉴权头、语言头、错误提示与登出处理。                           |
| `FetchService.ts` | 内部 `FetchService`                                          | 底层 fetch 封装，处理 baseURL、query、body、FormData 与拦截器；仅供 `client.ts` 使用。 |
| `types.ts`        | `RequestParams`、`RequestData`、`RequestQuery`、内部配置类型 | 请求基础类型。                                                                         |

## 使用规则

- 业务接口禁止直接调用 `fetch`，优先在 `src/api/<module>/*.api.ts` 中复用 `http` 或 `request`。
- 新增 API 前先阅读 `src/api/README.md` 与目标模块 README。
- 服务端组件、metadata、sitemap 的公开 GET 请求使用 `src/api/_server/server-fetch.ts`，不要复用客户端 `request`。
- 修改请求基础设施后必须运行 `npx tsc --noEmit`。
