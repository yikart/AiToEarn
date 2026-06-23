# Storage 工具

浏览器存储与 zustand 持久化工具目录。只放跨 store 复用的存储适配器和持久化 store 工厂。

## 文件清单

| 文件                    | 导出                    | 说明                                                                                       |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `localStorage.ts`       | 内部 `appLocalStorage`  | SSR 安全的 zustand `StateStorage` localStorage 适配器，仅供 `createPersistStore` 使用。    |
| `indexedDBStorage.ts`   | 内部 `indexedDBStorage` | SSR 安全的 IndexedDB 存储适配器，失败时回退 localStorage，仅供 `createPersistStore` 使用。 |
| `createPersistStore.ts` | `createPersistStore`    | zustand + persist + combine 的项目级持久化 store 工厂。                                    |

## 使用规则

- 需要持久化的 store 优先复用 `createPersistStore`。
- 只有多个 store 共用的存储能力放这里；单个 store 私有缓存逻辑放对应 store 目录。
- 新增存储适配器必须说明 SSR 行为、降级策略和适用场景。
