# AiBatchGenerateBar Store

当前目录放置 `AiBatchGenerateBar` 私有局部 store，用于承接工具栏、提示词和生成参数等跨子组件共享状态。

## 当前实现

| 文件                                    | 说明                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `aiBatchGenerateBarStore.ts`            | zustand + `combine` store，按 `configKey` 隔离每个草稿箱的本地 UI/生成参数状态。 |
| `aiBatchGenerateBarStore.types.ts`      | 局部状态、patch、字段 setter 和初始化参数类型。                                  |
| `useAiBatchGenerateBarStoreBindings.ts` | 面向组件的绑定 Hook，提供当前 `configKey` 的状态读取和字段 setter。              |
| `index.ts`                              | 当前 store 目录统一导出。                                                        |

## 状态边界

- 只保存 `AiBatchGenerateBar` 私有状态，例如提示词、模型选择、比例、时长、数量、平台、文案要求展开状态。
- 持久化仍由 `useDraftBoxConfigStore` 负责；本 store 是局部 UI/编排状态源，不直接写 IndexedDB。
- 外部 API 数据、余额、上传媒体和生成流程状态仍由对应 hooks 或全局业务 store 管理。

## 维护规则

- 多个子组件共享或透传过多的状态优先放到本目录 store。
- 新增字段必须同步更新 `AiBatchGenerateBarLocalState` 和 `buildAiBatchGenerateBarInitialState`。
- 组件读取 2 个及以上字段时必须配合 `useShallow`。
- 不要把只服务当前组件的状态提升到全局 `src/store`。
