# ConfigManagerDialog

全局配置管理弹框，由 `src/app/layout/Providers.tsx` 挂载，通过 `src/store/configManagerDialog.ts` 控制开关。

## 目录结构

| 目录/文件                      | 说明                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `index.tsx`                    | 弹框入口，负责加载、校验、保存、重启和健康检查流程。                               |
| `components/ConfigSectionNav/` | 左侧配置分组目录，跟随右侧滚动高亮，点击触发锚点滚动。                             |
| `components/ConfigFormPanel/`  | 右侧配置表单滚动区域，每个分组作为锚点节点。                                       |
| `components/ConfigField/`      | 可视化模式下的递归配置字段渲染，将对象、数组、字符串、数字、布尔值转换为表单控件。 |
| `hooks/useConfigSectionSpy.ts` | 弹框内部滚动监听与分组高亮逻辑。                                                   |
| `utils/configSections.ts`      | 配置分组定义与字段数量统计。                                                       |
| `utils/configPath.ts`          | 配置路径读写、稳定序列化和字段名格式化。                                           |
| `types/`                       | 弹框内部类型。                                                                     |

## 边界

- 只服务 layout 全局弹框，不被普通页面直接导入。
- 外部触发必须通过 `useConfigManagerDialogStore`，不要直接依赖本目录组件。
- 默认使用可视化配置表单；需要排查复杂配置时，可切换到 JSON 配置模式。
- 后端返回格式只作为数据解析来源，用户界面不展示 `yaml/json` 文件徽标。
