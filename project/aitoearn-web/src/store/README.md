# Store - 全局状态管理

基于 Zustand 的全局状态管理模块。这里只放跨页面、跨布局或跨业务域真实复用的状态；页面级状态优先下沉到页面或组件局部 `store/`。

## 目录结构

```text
src/store/
├── index.ts                 # 统一导出
├── account.ts               # 社交账户管理
├── user/                    # 用户登录态（store 与私有 utils）
├── system.ts                # 系统配置
├── settingsModal.ts         # 全局设置弹窗状态
├── configManagerDialog.ts   # 全局配置管理弹窗状态
├── login-dialog/            # 全局登录弹窗状态
├── platformMetadata/        # 客户端平台元数据、静态图标和场景过滤
├── publishDetailCache.ts    # 发布详情缓存
├── douyinPublishSession.ts  # 抖音 H5 发布会话缓存
├── thumbnailCache.ts        # 视频缩略图缓存
├── draft-box/               # 草稿箱共享业务状态
├── agent/                   # AI Agent 任务管理
└── plugin/                  # 浏览器插件
```

## Store 一览

| 文件/目录                 | Hook                                     | 功能                                                     | 持久化          |
| ------------------------- | ---------------------------------------- | -------------------------------------------------------- | --------------- |
| `account.ts`              | `useAccountStore`                        | 社交账户管理、账户分组、余额不足弹框                     | 否              |
| `user/`                   | `useUserStore`                           | 用户登录态、Credits 余额、语言、侧边栏                   | 是              |
| `system.ts`               | `useSystemStore`                         | 系统配置、Agent 测试提示、日历视图与日历节日过滤         | 是（IndexedDB） |
| `settingsModal.ts`        | `useSettingsModalStore`                  | 全局设置弹窗可见性、默认 Tab 与子 Tab                    | 否              |
| `configManagerDialog.ts`  | `useConfigManagerDialogStore`            | 全局配置管理弹窗可见性与触发来源                         | 否              |
| `login-dialog/`           | `useLoginDialogStore`                    | 全局登录弹窗、登录后跳转与邀请码                         | 否              |
| `platformMetadata/`       | `usePlatformMetadataStore`               | 客户端平台元数据、静态图标兜底、平台状态与场景过滤       | 否              |
| `publishDetailCache.ts`   | `usePublishDetailCache`                  | 发布详情缓存（5 分钟过期）                               | 是（IndexedDB） |
| `douyinPublishSession.ts` | `useDouyinPublishSessionStore`           | 抖音 H5 发布会话缓存（10 分钟恢复）                      | 是（IndexedDB） |
| `thumbnailCache.ts`       | `useThumbnailCacheStore`                 | 视频缩略图缓存                                           | 是              |
| `draft-box/`              | `usePlanDetailStore` / `usePlanTabStore` | 草稿箱计划、详情、AI 生成配置与媒体列表同步桥            | 部分 IndexedDB  |
| `agent/`                  | `useAgentStore`                          | AI Agent 任务管理（多任务隔离、SSE、工作流）             | 否              |
| `plugin/`                 | `usePluginStore`                         | 浏览器插件（安装检测、账号同步、发布、发布详情弹窗状态） | 否              |

## 关键边界

- 不要恢复任务广场、线下推广、运营工单、钱包会员、推广跳转等闭源 store。
- 单页面或单大型组件使用的状态放调用方局部 `store/`，不要提升到 `src/store`。
- 多字段联合取值时配合 `useShallow`，避免不必要重渲染。
- 持久化优先复用 `createPersistStore`，路径为 `src/utils/storage/createPersistStore.ts`。

## 重点 Store 说明

### `useUserStore` — 用户登录态

- 保存当前用户、登录状态、语言、Credits 余额和侧边栏折叠状态。
- 开源版保留 Seedance credits 兼容字段，但映射到普通 Credits / 本地 no-op，避免草稿箱 AI 组件断裂。

### `usePlatformMetadataStore` — 平台元数据

- 统一通过客户端请求加载平台数据，并支持按语言重新归一化已有数据。
- 提供平台 Map、静态图标兜底、启用平台、发布平台、任务平台等场景过滤能力。

### `useDouyinPublishSessionStore` — 抖音 H5 发布会话

- 用 IndexedDB 缓存 10 分钟发布会话，支持发布详情弹窗关闭后恢复轮询。
- 仅保存发布记录 ID、短链、作品链接、状态、错误信息和提交时间戳。

### `useSettingsModalStore` — 全局设置弹窗

- 设置弹窗由 layout Provider 挂载，页面和业务组件通过 `useSettingsModalStore` 打开。
- 开源版设置入口只保留 profile / general，不恢复闭源订阅、钱包、API Key、工单等 Tab。

### `useConfigManagerDialogStore` — 全局配置管理弹窗

- 配置管理弹窗由 layout Provider 挂载，侧边栏和全局错误提示通过 store 打开。
- Store 只维护弹框开关和触发来源，不承载配置表单数据。

## 技术栈

- 普通 store：`zustand` + `combine` 中间件。
- 持久化 store：`createPersistStore`，默认 `localStorage`，第 4 个参数传 `'indexedDB'` 启用 IndexedDB。
- 性能优化：使用 `useShallow` 避免不必要的重渲染。
