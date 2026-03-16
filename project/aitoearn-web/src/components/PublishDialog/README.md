# PublishDialog 组件架构文档

## 概述

PublishDialog 是发布作品的核心弹框组件，支持多平台、多账号同时发布内容。

## ⚠️ 重要提醒：双端架构

**本组件采用 PC 端和移动端分离的架构，修改或新增功能时必须同时考虑两端！**

| 端     | 入口文件                                    | 说明                               |
| ------ | ------------------------------------------- | ---------------------------------- |
| PC 端  | `index.tsx` + `DesktopPublishContent`       | 完整功能，包含 AI 助手、预览面板等 |
| 移动端 | `compoents/mobile/MobilePublishContent.tsx` | 精简版，无 AI 助手和预览           |

### 判断逻辑（index.tsx）

```tsx
const isMobile = useIsMobile()

if (isMobile) {
  return <MobilePublishContent ... />  // 移动端渲染
}

// PC 端渲染
return <DesktopPublishContent ... />
```

## 目录结构

```
PublishDialog/
├── index.tsx                          # 主入口（状态管理 + 双端判断）
├── README.md                          # 本文档
├── publishDialog.type.ts              # 类型定义
├── PublishDialog.util.ts              # 工具函数
├── usePublishDialog.ts                # 核心状态管理 store
├── usePublishDialogData.ts            # 数据处理 hooks
├── usePublishDialogStorageStore.tsx   # 持久化存储 store
├── publishDialogTransition.css        # 动画样式
│
├── hooks/                             # 业务逻辑 hooks
│   ├── usePublishState.ts             # 弹窗状态管理（loading、modal显示状态）
│   ├── useContentModeration.ts        # 内容安全检测逻辑
│   ├── usePlatformAuth.ts             # 平台授权跳转逻辑
│   ├── usePublishActions.ts           # 发布操作核心逻辑
│   ├── useAISync.ts                   # AI内容同步到编辑器
│   ├── useUploadSync.ts               # 上传结果同步到发布参数
│   └── usePubParamsVerify.tsx         # 参数校验 hook（双端共用）
│
├── compoents/
│   ├── mobile/
│   │   └── MobilePublishContent.tsx   # 【移动端】完整内容组件
│   │
│   ├── DesktopPublishContent/         # 【PC端】主内容组件
│   │   └── index.tsx
│   ├── AccountSelector/               # 账户选择器组件
│   │   └── index.tsx
│   ├── PublishFooter/                 # 底部操作栏（发布按钮、内容检测等）
│   │   └── index.tsx
│   ├── PublishModals/                 # 弹窗组件集合（下载App、Facebook页面等）
│   │   └── index.tsx
│   │
│   ├── ErrorSummary/                  # 错误汇总组件（双端共用）
│   ├── PlatParamsSetting/             # 平台参数设置（双端共用）
│   ├── PublishDatePicker/             # 发布时间选择器（双端共用）
│   ├── PubParmasTextarea/             # 发布内容编辑器（双端共用）
│   │
│   ├── PublishDialogAi.tsx            # AI 助手面板（仅 PC 端）
│   ├── PublishDialogPreview.tsx       # 预览面板（仅 PC 端）
│   ├── TextSelectionToolbar.tsx       # 划词工具栏（仅 PC 端）
│   │
│   ├── Choose/                        # 选择器组件
│   ├── DouyinQRCodeModal.tsx          # 抖音二维码弹窗
│   ├── DraftSelectionModal/           # 草稿选择弹窗
│   ├── MaterialSelectionModal/        # 素材选择弹窗
│   └── PublishManageUpload/           # 上传管理
│
└── svgs/                              # SVG 图标资源
```

## Hooks 职责说明

| Hook                   | 职责                                              |
| ---------------------- | ------------------------------------------------- |
| `usePublishState`      | 管理弹窗内各种临时状态（loading、modal显隐）      |
| `useContentModeration` | 内容安全检测功能，返回检测结果和状态              |
| `usePlatformAuth`      | 处理离线账户点击时的平台授权跳转                  |
| `usePublishActions`    | 发布操作核心逻辑，包含 API 发布和插件发布         |
| `useAISync`            | AI 生成内容同步到编辑器（划词、图生图、内容填充） |
| `useUploadSync`        | 监听上传完成，同步 ossUrl 到发布参数              |
| `usePubParamsVerify`   | 校验发布参数，返回错误和警告信息                  |

## 双端功能对照表

| 功能         | PC 端 | 移动端         | 共用组件               |
| ------------ | ----- | -------------- | ---------------------- |
| 账号选择     | ✅    | ✅             | `AccountSelector`      |
| 错误汇总展示 | ✅    | ✅             | `ErrorSummary`         |
| 平台参数设置 | ✅    | ✅             | `PlatParamsSetting`    |
| 内容编辑器   | ✅    | ✅             | `PubParmasTextarea`    |
| 发布时间选择 | ✅    | ✅             | `PublishDatePicker`    |
| AI 助手      | ✅    | ❌             | `PublishDialogAi`      |
| 预览面板     | ✅    | ❌             | `PublishDialogPreview` |
| 划词工具     | ✅    | ❌             | `TextSelectionToolbar` |
| 图生图       | ✅    | ❌ (toast提示) | -                      |

## 外部触发发布流程

### 方式一：URL 参数触发（推荐）

通过跳转到 `/accounts` 页面并携带特定参数，可以自动打开发布弹框并预填内容。

**必需参数：**

| 参数          | 类型     | 说明                                           |
| ------------- | -------- | ---------------------------------------------- |
| `aiGenerated` | `'true'` | **必需**，标识为 AI 生成内容，触发自动发布流程 |

**可选参数：**

| 参数          | 类型       | 说明                                  |
| ------------- | ---------- | ------------------------------------- |
| `description` | `string`   | 发布内容描述（需 URL 编码）           |
| `title`       | `string`   | 发布标题（需 URL 编码）               |
| `tags`        | `string`   | 标签数组的 JSON 字符串（需 URL 编码） |
| `medias`      | `string`   | 媒体数组的 JSON 字符串（需 URL 编码） |
| `accountId`   | `string`   | 指定发布的账号 ID                     |
| `platform`    | `PlatType` | 指定发布平台类型                      |
| `taskId`      | `string`   | 关联的任务 ID                         |

**使用示例：**

```tsx
// 从分享模块跳转到发布
const params = new URLSearchParams()
params.set('aiGenerated', 'true')
params.set('description', encodeURIComponent('分享内容描述'))
params.set('title', encodeURIComponent('标题'))
params.set('tags', encodeURIComponent(JSON.stringify(['tag1', 'tag2'])))
params.set('accountId', 'account-123')

router.push(`/accounts?${params.toString()}`)
```

**处理逻辑位置：** `src/app/[lng]/accounts/accountCore.tsx` 第 250-330 行

### 方式二：直接调用组件

```tsx
import PublishDialog from '@/components/PublishDialog'

;<PublishDialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  accounts={accountList}
  defaultAccountIds={['account-1', 'account-2']}
  onPubSuccess={() => console.log('发布成功')}
/>
```

### 方式三：通过 Store 预设数据

```tsx
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'

// 预设发布数据
usePublishDialogStorageStore.getState().setPubData({
  title: '标题',
  description: '描述内容',
  tags: ['tag1', 'tag2'],
  medias: [{ url: '...', type: 'image' }],
})

// 然后打开发布弹框，数据会自动填充
```

## 开发规范

### 1. 新增功能必须检查双端

新增任何展示组件或功能时，**必须**检查：

- [ ] PC 端是否需要该功能？→ 修改 `DesktopPublishContent`
- [ ] 移动端是否需要该功能？→ 修改 `MobilePublishContent.tsx`
- [ ] 是否可以抽取为共用组件？

### 2. 共用组件设计原则

共用组件应支持 `isMobile` prop 进行适配：

```tsx
interface Props {
  isMobile?: boolean // 移动端标识
}

const MyComponent = ({ isMobile }: Props) => {
  return <div className={isMobile ? 'mobile-style' : 'pc-style'}>...</div>
}
```

### 3. 状态管理

双端共用同一个 store（`usePublishDialog`），确保状态同步。

### 4. 业务逻辑抽离

将复杂的业务逻辑抽离到 `hooks/` 目录下的独立 hook 中：

```tsx
// ❌ 错误：在组件中直接写大量业务逻辑
const Component = () => {
  // 100+ 行的业务逻辑...
}

// ✅ 正确：抽离到独立 hook
const Component = () => {
  const { handlePublish, loading } = usePublishActions(...)
}
```

### 5. 典型错误案例

**错误示例**：只在 PC 端添加 `ErrorSummary`，忘记在移动端添加。

```tsx
// ❌ 错误：只在 DesktopPublishContent 中添加
<ErrorSummary ... />

// ✅ 正确：同时在 MobilePublishContent.tsx 中添加
<ErrorSummary ... />
```

## 核心数据流

```
┌─────────────────────────────────────────────────────────────┐
│                    usePublishDialog (store)                  │
│  ├── pubList          - 所有可发布账号列表                     │
│  ├── pubListChoosed   - 已选中的账号列表                       │
│  ├── step             - 当前步骤 (0: 统一编辑, 1: 单独编辑)      │
│  ├── expandedPubItem  - 当前展开编辑的账号                      │
│  ├── commonPubParams  - 统一参数（多账号时）                    │
│  └── pubTime          - 发布时间                              │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌──────────────────────┐       ┌──────────────────────┐
      │       PC 端          │       │       移动端          │
      │ DesktopPublishContent│       │ MobilePublishContent │
      └──────────────────────┘       └──────────────────────┘
```

## 外部触发流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        外部调用方                                │
│  (ShareModal / Agent结果 / 任务页面 / 素材库)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ router.push('/accounts?aiGenerated=true&...')
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    accountCore.tsx                               │
│  1. 检测 aiGenerated=true 参数                                   │
│  2. 解析 description/title/tags/medias 等参数                    │
│  3. 调用 usePublishDialogStorageStore.setPubData()              │
│  4. 选择目标账号（accountId 或 platform 匹配）                    │
│  5. 设置 aiGeneratedData 状态                                    │
│  6. 清除 URL 参数                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ aiGeneratedData 变化触发
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PublishDialog                                 │
│  1. 检测到 aiGeneratedData                                       │
│  2. 从 storage store 恢复数据                                    │
│  3. 自动打开弹框并填充内容                                        │
└─────────────────────────────────────────────────────────────────┘
```

## 参数校验流程

```
usePubParamsVerify(pubListChoosed)
         │
         ▼
  ┌─────────────────┐
  │  errParamsMap   │  ← 错误信息 Map<accountId, error>
  │  warningParamsMap│  ← 警告信息 Map<accountId, warning>
  └─────────────────┘
         │
         ▼
  ┌─────────────────┐
  │  ErrorSummary   │  ← 统一展示错误/警告（双端）
  └─────────────────┘
```

## 文件职责说明

| 文件                               | 职责                                                |
| ---------------------------------- | --------------------------------------------------- |
| `index.tsx`                        | 主入口，整合所有 hooks 和状态，根据设备类型分发渲染 |
| `usePublishDialog.ts`              | 核心状态管理，包含所有发布相关状态和方法            |
| `usePublishDialogStorageStore.tsx` | 发布数据的持久化存储（IndexedDB）                   |
| `publishDialog.type.ts`            | 类型定义，包括 PubItem、发布参数等                  |
| `hooks/usePublishActions.ts`       | 发布操作核心逻辑（API发布 + 插件发布）              |
| `hooks/useContentModeration.ts`    | 内容安全检测逻辑                                    |
| `hooks/useAISync.ts`               | AI 内容同步（划词、图生图、内容填充）               |
| `compoents/DesktopPublishContent/` | PC 端主内容渲染组件                                 |
| `compoents/AccountSelector/`       | 账户选择器 UI 组件                                  |
| `compoents/PublishFooter/`         | 底部操作栏 UI 组件                                  |
| `compoents/PublishModals/`         | 各种弹窗组件集合                                    |

## 更新记录

- 2026-01-06：重构组件架构，拆分业务逻辑到独立 hooks，主文件从 1500 行精简至 543 行
- 2026-01-06：新增 `hooks/` 目录，包含 6 个业务逻辑 hooks
- 2026-01-06：新增 `DesktopPublishContent`、`AccountSelector`、`PublishFooter`、`PublishModals` 组件
- 2026-01-06：添加外部触发发布流程文档
- 2026-01-06：添加 `ErrorSummary` 组件到移动端
- 2026-01-06：创建架构文档
