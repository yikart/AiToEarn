# Config Editor API

配置管理接口模块，对接后端 `config-editor` 控制器。

## 文件清单

| 文件                     | 说明                                                         |
| ------------------------ | ------------------------------------------------------------ |
| `config-editor.api.ts`   | 按服务目标获取配置、校验配置、保存配置、重启服务、健康检查。 |
| `config-editor.types.ts` | 配置文件格式、服务目标、配置响应与请求类型。                 |

## 接口清单

| 方法                                | 路径                                          | 说明                                   |
| ----------------------------------- | --------------------------------------------- | -------------------------------------- |
| `getConfigEditorConfigApi`          | `GET config` / `GET ai/config`                | 获取指定服务配置对象与配置文件格式。   |
| `validateConfigEditorConfigApi`     | `POST config/validate` / `ai/config/validate` | 校验指定服务配置对象。                 |
| `saveConfigEditorConfigApi`         | `PUT config` / `PUT ai/config`                | 保存指定服务配置对象。                 |
| `restartConfigEditorServiceApi`     | `POST config/restart` / `ai/config/restart`   | 重启指定服务。                         |
| `checkConfigEditorServiceHealthApi` | `/health`                                     | 使用纯文本健康检查确认主服务是否恢复。 |
| `checkConfigEditorConfigReadyApi`   | `/health` / `GET ai/config`                   | 按服务目标确认配置接口是否恢复可用。   |

## 维护规则

- 请求方法与类型定义保持分离。
- 配置编辑 UI 不直接调用 `fetch` 访问业务接口，统一通过本目录 API。
- 主服务 `/health` 返回纯文本 `OK`，不走统一响应包裹，因此使用独立 `fetch`。
- AI 服务配置入口通过网关路径 `ai/config` 访问，重启后使用带鉴权的配置读取确认恢复。
