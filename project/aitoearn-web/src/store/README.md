# Store - 全局状态管理

基于 [Zustand](https://github.com/pmndrs/zustand) 的全局状态管理模块。

## 目录结构

```
src/store/
├── index.ts                 # 统一导出
├── account.ts               # 社交账户管理
├── user.ts                  # 用户登录态
├── system.ts                # 系统配置
├── notification.ts          # 通知管理
├── publishDetailCache.ts    # 发布详情缓存
├── thumbnailCache.ts        # 视频封面缓存
├── agent/                   # AI Agent 任务管理
│   ├── index.ts             # 主入口 & 导出
│   ├── agent.types.ts       # 类型定义
│   ├── agent.constants.ts   # 常量
│   ├── agent.state.ts       # 初始状态
│   ├── agent.methods.ts     # 核心方法
│   ├── handlers/            # Action 处理器
│   ├── utils/               # 工具函数（Refs、消息、进度）
│   └── task-instance/       # 任务实例（SSE、工作流）
└── plugin/                  # 浏览器插件
    ├── index.ts             # 统一导出
    ├── store.ts             # Store 定义
    ├── hooks.ts             # React Hooks
    ├── constants.ts         # 常量
    ├── utils.ts             # 工具函数
    ├── types/               # 类型定义
    └── plats/               # 平台交互（抖音、小红书）
```

## Store 一览

| 文件                    | Hook                    | 功能                                         | 持久化          |
| ----------------------- | ----------------------- | -------------------------------------------- | --------------- |
| `account.ts`            | `useAccountStore`       | 社交账户管理、账户分组                       | 否              |
| `user.ts`               | `useUserStore`          | 用户登录态、语言、侧边栏                     | 是              |
| `system.ts`             | `useSystemStore`        | 系统配置（日历视图、日历节日过滤等）         | 是（IndexedDB） |
| `publishDetailCache.ts` | `usePublishDetailCache` | 发布详情缓存（5 分钟过期）                   | 是（IndexedDB） |
| `thumbnailCache.ts`     | `useThumbnailCache`     | 视频封面缓存                                 | 是（IndexedDB） |
| `notification.ts`       | `useNotificationStore`  | 通知列表、未读数、无限滚动、乐观更新         | 否              |
| `agent/`                | `useAgentStore`         | AI Agent 任务管理（多任务隔离、SSE、工作流） | 否              |
| `plugin/`               | `usePluginStore`        | 浏览器插件（安装检测、账号同步、发布）       | 否              |

## 各 Store 详细说明

### `useAccountStore` — 社交账户管理

**主要状态：**

- `accountList` / `accountMap` / `accountAccountMap` — 账户列表及多种索引
- `accountLoading` / `accountListInitialized` — 账户列表加载状态与首轮加载完成标记
- `accountGroupList` / `accountGroupMap` — 账户分组
- `accountActive` — 当前选中的账户
- `activeSpaceId` — 当前空间 ID

**主要方法：**

- `getAccountList()` — 获取账户列表（含超时兜底），同时触发插件初始化
- `getAccountGroup()` — 获取分组数据并将账户分配到组
- `accountInit()` — 初始化入口（后台异步）

---

### `useUserStore` — 用户登录态

**持久化：** `createPersistStore`（localStorage），其中 URL query token 登录状态通过 `partialize` 排除持久化。

**主要状态：**

- `token` — 登录令牌
- `userInfo` — 用户信息
- `lang` — 当前语言
- `sidebarCollapsed` — 侧边栏收起状态
- `hasEverLoggedIn` — 是否曾登录过

**主要方法：**

- `appInit()` — 应用初始化（获取用户信息 + 账户）
- `setToken()` — 设置令牌
- `logout()` — 登出并跳转首页

---

### `useSystemStore` — 系统配置

**持久化：** `createPersistStore`（IndexedDB）

**主要状态：**

- `calendarViewType` — 日历视图类型（`'month'` | `'week'`）
- `calendarShowSolarFestivals` — 月视图是否显示公历节日
- `calendarShowSolarTerms` — 月视图是否显示二十四节气
- `dismissSeedanceBanner` — 是否已关闭 Seedance 公告横幅
- `githubStars` / `githubStarsUpdatedAt` — GitHub Stars 缓存值及更新时间
- `mobileNavExpanded` — 移动端导航区域是否展开
- `skipTwitterExploreConfirm` — 是否跳过 Twitter 探索积分确认

**主要方法：**

- `setCalendarViewType()` — 设置日历视图类型
- `setCalendarShowSolarFestivals()` — 设置月视图公历节日显示状态
- `setCalendarShowSolarTerms()` — 设置月视图二十四节气显示状态
- `setDismissSeedanceBanner()` — 设置 Seedance 公告横幅关闭状态
- `setGitHubStars()` — 设置 GitHub Stars 缓存
- `setMobileNavExpanded()` — 设置移动端导航区域展开状态
- `setSkipTwitterExploreConfirm()` — 设置 Twitter 探索积分确认跳过状态

> **注意：** AI 批量生成配置（比例、时长、数量、模型等）已迁移到 `useDraftBoxConfigStore`（`src/app/[lng]/draft-box/draftBoxConfigStore.ts`），按草稿箱 groupId 隔离持久化。

### `usePublishDetailCache` — 发布详情缓存

**持久化：** `createPersistStore`（IndexedDB）

**主要状态：**

- `cache` — `flowId → PublishRecordItem` 映射
- `timestamps` — `flowId → 最后更新时间戳`

**主要方法：**

- `fetchAndCache(flowId, forceRefresh?)` — 获取并缓存详情（5 分钟有效期）
- `getDetail()` / `setDetail()` — 读写缓存
- `isExpired()` — 检查缓存是否过期
- `clearCache()` / `clearAllCache()` — 清除缓存

---

### `useThumbnailCache` — 视频封面缓存

**持久化：** `createPersistStore`（IndexedDB）

**主要状态：**

- `cache` — `videoUrl → thumbnailUrl` 映射

**主要方法：**

- `fetchThumbnail(videoUrl)` — 获取并缓存视频封面，内置并发控制与请求去重

---

### `useNotificationStore` — 通知管理

**主要状态：**

- `notifications` — 累积通知列表（无限滚动追加）
- `loading` / `loadingMore` — 初始加载 / 加载更多状态
- `unreadCount` — 未读数量
- `pagination` — 分页信息（page, pageSize, total, hasMore）

**主要方法：**

- `resetAndFetch()` — 重置列表并拉取第一页 + 未读数
- `loadMore()` — 加载下一页（追加到列表）
- `fetchUnreadCount()` — 获取未读数
- `markAsRead(id)` — 乐观更新：立即标记已读，API 失败回滚
- `markAllAsRead()` — 乐观更新：全部标记已读
- `deleteNotification(id)` — 乐观更新：立即移除，API 失败回滚

---

### `useAgentStore` — AI Agent 任务管理

**主要状态：**

- `currentTaskId` — 当前活跃任务 ID
- `taskMessages` — 按 taskId 隔离的消息存储（消息列表、Markdown、工作流步骤、流式文本、进度）
- `currentCost` — 当前花费
- `pendingTask` — 待处理任务

**外部管理（store 外部 Map）：**

- `getTaskInstance()` / `getOrCreateTaskInstance()` — 获取/创建任务实例
- `removeTaskInstance()` / `migrateTaskInstance()` — 删除/迁移任务实例
- `clearAllTaskInstances()` — 清理所有实例

**导出：** `ActionRegistry`、`TaskInstance`、`createAgentRefs`、`createMessageUtils` 等

---

### `usePluginStore` — 浏览器插件

**主要状态：**

- `status` — 插件状态（`UNKNOWN` / `NOT_INSTALLED` / `CHECKING` / `INSTALLED_NO_PERMISSION` / `READY`）
- `isInitializing` — 正在初始化
- `isPublishing` / `publishingPlatforms` — 发布状态（支持多账号同时发布）
- `publishProgress` / `platformProgress` — 发布进度
- `publishTasks` — 发布任务列表
- `platformAccounts` — 各平台账号信息
- `pluginModalVisible` — 插件弹框可见性
- `publishDetailModalOpenCount` — 当前打开中的发布详情弹框数量，用于控制全局悬浮入口显示
- `pluginVersion` / `pluginVersionStatus` — 当前插件版本及版本获取状态
- `pluginNeedsUpdate` — 当前插件是否需要更新

**主要方法：**

- `init()` — 初始化（检测插件 → 检查权限 → 刷新账号）
- `checkPlugin()` / `checkPermission()` — 插件检测 & 权限检查
- `fetchPluginVersion()` / `clearPluginVersion()` — 获取/重置插件版本状态
- `startPolling()` / `stopPolling()` — 状态轮询
- `login()` — 登录指定平台
- `publish()` — 发布到指定平台
- `executePluginPublish()` — 批量发布（并行执行，支持定时发布）
- `registerPublishDetailModalOpen()` / `unregisterPublishDetailModalOpen()` — 同步发布详情弹框可见状态
- `syncAccountToDatabase()` — 同步插件账号到数据库
- `refreshAllPlatformAccounts()` — 刷新所有平台账号在线状态

**Hooks：** `usePlugin()`、`usePluginLogin()`、`usePluginPublish()`、`usePluginWorkflow()`

---

## 技术栈

- **普通 store：** `zustand` + `combine` 中间件
- **持久化 store：** `createPersistStore`（`/src/utils/createPersistStore.ts`）
  - 默认使用 `localStorage`
  - 第 4 个参数传 `'indexedDB'` 启用 IndexedDB 存储
- **性能优化：** 使用 `useShallow` 避免不必要的重渲染
