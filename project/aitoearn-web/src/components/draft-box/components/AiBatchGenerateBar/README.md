# AiBatchGenerateBar

草稿箱 AI 批量生成输入栏。该目录只放当前组件私有实现，外部调用方只应引用组件入口 `index.tsx`。

## 目录结构

| 目录          | 说明                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `components/` | 当前输入栏私有 UI 子组件，例如提示词输入区、工具栏、媒体堆叠、弹窗和提示浮层。                                        |
| `hooks/`      | 当前输入栏私有 Hook，例如入口 controller、模型派生、计费校验、平台文案、上传校验、拖拽粘贴、媒体 mention 和提交流程。 |
| `store/`      | 当前输入栏私有局部 store，按 `configKey` 隔离工具栏、提示词和生成参数状态。                                           |
| `types/`      | 当前输入栏私有 props、状态模型和辅助类型。                                                                            |
| `utils/`      | 当前输入栏私有纯函数、模型参数计算、平台限制、媒体持久化和提示词 token 工具。                                         |
| `styles/`     | 当前输入栏入口样式；子组件私有样式仍保留在对应子组件目录。                                                            |

## Hook 分层

| 文件                                 | 说明                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `useAiBatchGenerateBarController.ts` | 入口 controller，只负责串联局部 store、业务 hooks 和视图 props，不直接渲染 JSX。 |
| `useAiBatchCreditState.ts`           | 视频编辑态、数量派生、模型参数派生和 duration 自动修正。                         |
| `useAiBatchPlatformPromptState.ts`   | 平台兼容性、有效平台、平台限制和系统文案默认值同步。                             |

## 维护规则

- `index.tsx` 只负责组合编排，不再直接追加大段上传、提交、模型派生或 UI 区块逻辑。
- 新增子组件放入 `components/<PascalCase>/index.tsx`。
- 新增组件私有 Hook 放入 `hooks/useXxx.ts`。
- 新增组件私有纯函数或常量放入 `utils/`。
- 新增组件私有类型放入 `types/`，不要和组件、hooks 或 utils 混写。
- 多个私有子组件共享可写状态或出现多层 props 透传时，优先在 `store/` 建立局部 store。
- 如果某个能力被 `AiBatchGenerateBar` 之外的多个草稿箱组件复用，再评估提升到 `src/components/draft-box/hooks`、`src/components/draft-box/utils` 或更高层公共目录。
