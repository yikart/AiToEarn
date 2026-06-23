# Agent 工具

Agent 业务共享工具目录，服务 Agent 素材页、AI Social 预览和发布素材选择等跨页面场景。

## 文件清单

| 文件       | 导出                                                                                          | 说明                                          |
| ---------- | --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `asset.ts` | `convertAssetToMediaItem`、`filterAssetsByMediaType`、`getAssetThumbUrl`、`getAssetMediaType` | Agent 素材类型判断、筛选与 `MediaItem` 转换。 |

## 使用规则

- 仅 Agent 素材相关跨页面逻辑放这里。
- 如果工具只服务 Agent 素材页单页，应下沉到页面局部目录。
