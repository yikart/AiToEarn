# UI 工具

命令式 UI 工具目录，封装跨页面复用的提示、通知、确认弹窗能力。这里只放低业务语义的 UI 基础能力，不放页面流程或业务组件。

## 文件清单

| 文件              | 导出           | 说明                                                                          |
| ----------------- | -------------- | ----------------------------------------------------------------------------- |
| `confirm.tsx`     | `confirm`      | 基于 shadcn/ui AlertDialog 的命令式确认弹窗，支持异步 `onOk` 与内部 loading。 |
| `toast.ts`        | `toast`        | 基于 sonner 的轻量 Toast 工具，兼容原 message 风格调用。                      |
| `notification.ts` | `notification` | 基于全局事件的通知工具，供自定义通知中心消费。                                |

## 使用规则

- 确认弹窗统一使用 `confirm`，需要 loading 时把异步逻辑放进 `onOk`。
- 普通 toast 使用 `toast`；需要接入全局通知中心时使用 `notification`。
- 新增命令式 UI 工具必须说明使用场景，并更新本 README 与 `src/utils/README.md`。
