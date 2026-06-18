# Config Editor API

配置管理接口模块，对接后端 `config-editor` 控制器。

## 文件清单

| 文件                     | 说明                                               |
| ------------------------ | -------------------------------------------------- |
| `config-editor.api.ts`   | 获取配置、校验配置、保存配置、重启服务、健康检查。 |
| `config-editor.types.ts` | 配置文件格式、配置响应与请求类型。                 |

## 接口清单

| 方法                                | 路径                   | 说明                                 |
| ----------------------------------- | ---------------------- | ------------------------------------ |
| `getConfigEditorConfigApi`          | `GET config`           | 获取当前配置对象与配置文件格式。     |
| `validateConfigEditorConfigApi`     | `POST config/validate` | 校验配置对象。                       |
| `saveConfigEditorConfigApi`         | `PUT config`           | 保存配置对象。                       |
| `restartConfigEditorServiceApi`     | `POST config/restart`  | 重启当前服务。                       |
| `checkConfigEditorServiceHealthApi` | `/health`              | 使用纯文本健康检查确认服务是否恢复。 |

## 维护规则

- 请求方法与类型定义保持分离。
- 配置编辑 UI 不直接调用 `fetch` 访问业务接口，统一通过本目录 API。
- `/health` 返回纯文本 `OK`，不走统一响应包裹，因此使用独立 `fetch`。
