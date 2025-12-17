# Chat 对话详情页

对话详情页模块，支持实时模式（从首页跳转）和历史模式（刷新或从任务列表进入）。

## 目录结构

```text
src/app/[lng]/chat/[taskId]/
├── page.tsx                        # 主页面，负责组装组件
├── components/                     # 页面私有组件
│   ├── ChatHeader/                 # 顶部导航栏
│   │   └── index.tsx
│   ├── ChatMessageList/            # 消息列表
│   │   └── index.tsx
│   ├── ChatLoadingSkeleton/        # 加载骨架屏
│   │   └── index.tsx
│   └── index.ts                    # 组件统一导出
├── hooks/                          # 页面私有 Hooks
│   ├── useScrollControl.ts         # 滚动控制
│   ├── useTaskPolling.ts           # 任务轮询
│   ├── useChatState.ts             # 聊天状态管理
│   └── index.ts                    # Hooks 统一导出
├── utils/                          # 页面私有工具函数
│   ├── taskStatus.ts               # 任务状态检测
│   ├── convertMessages.ts          # 消息格式转换
│   └── index.ts                    # 工具统一导出
└── README.md                       # 本文档
```

## 模块说明

### page.tsx - 主页面

主页面只负责组装组件和处理用户交互，不包含复杂的业务逻辑。

```tsx
import { ChatHeader, ChatMessageList, ChatLoadingSkeleton } from './components'
import { useScrollControl, useChatState } from './hooks'
```

### components/ - 页面私有组件

#### ChatHeader - 顶部导航栏

显示返回按钮、标题、生成状态指示器。

```tsx
import { ChatHeader } from './components'

<ChatHeader
  title={task?.title}
  defaultTitle="新对话"
  isGenerating={isGenerating}
  progress={progress}
  thinkingText="思考中..."
  onBack={handleBack}
/>
```

**Props：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `title` | `string?` | 任务标题 |
| `defaultTitle` | `string` | 默认标题（标题为空时显示） |
| `isGenerating` | `boolean` | 是否正在生成 |
| `progress` | `number` | 生成进度 (0-100) |
| `thinkingText` | `string` | 思考中文案 |
| `onBack` | `() => void` | 返回按钮点击回调 |

#### ChatMessageList - 消息列表

渲染消息气泡列表，包含回到底部按钮。

```tsx
import { ChatMessageList } from './components'

<ChatMessageList
  messages={displayMessages}
  workflowSteps={workflowSteps}
  isGenerating={isGenerating}
  containerRef={containerRef}
  bottomRef={bottomRef}
  showScrollButton={showScrollButton}
  onScroll={handleScroll}
  onScrollToBottom={() => scrollToBottom(true)}
  scrollToBottomText="回到底部"
/>
```

**Props：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `messages` | `IDisplayMessage[]` | 消息列表 |
| `workflowSteps` | `IWorkflowStep[]` | 工作流步骤 |
| `isGenerating` | `boolean` | 是否正在生成 |
| `containerRef` | `RefObject<HTMLDivElement>` | 消息容器 ref |
| `bottomRef` | `RefObject<HTMLDivElement>` | 底部占位 ref |
| `showScrollButton` | `boolean` | 是否显示回到底部按钮 |
| `onScroll` | `() => void` | 滚动事件回调 |
| `onScrollToBottom` | `() => void` | 点击回到底部回调 |
| `scrollToBottomText` | `string` | 按钮文案 |

#### ChatLoadingSkeleton - 加载骨架屏

页面初始加载时显示的骨架屏。

```tsx
import { ChatLoadingSkeleton } from './components'

if (isLoading) {
  return <ChatLoadingSkeleton />
}
```

### hooks/ - 页面私有 Hooks

#### useScrollControl - 滚动控制

管理消息列表的智能滚动行为。

```tsx
import { useScrollControl } from './hooks'

const {
  containerRef,      // 消息容器 ref
  bottomRef,         // 底部占位 ref
  isNearBottom,      // 用户是否在底部附近
  showScrollButton,  // 是否显示回到底部按钮
  scrollToBottom,    // 滚动到底部函数
  handleScroll,      // 滚动事件处理函数
} = useScrollControl({
  nearBottomThreshold: 150,   // 可选，底部附近阈值
  showButtonThreshold: 300,   // 可选，显示按钮阈值
  scrollResetDelay: 150,      // 可选，滚动状态重置延迟
})
```

#### useTaskPolling - 任务轮询

在页面刷新后任务未完成时，通过轮询获取最新状态。

```tsx
import { useTaskPolling } from './hooks'

const { isPolling, startPolling, stopPolling } = useTaskPolling({
  taskId: 'xxx',
  isActiveTask: false,
  pollingInterval: 3000,  // 可选，轮询间隔
  onMessagesUpdate: (messages, rawMessages) => { ... },
  onTaskUpdate: (task) => { ... },
})
```

#### useChatState - 聊天状态管理

整合 Store 状态和本地状态，统一对外提供。

```tsx
import { useChatState } from './hooks'

const {
  task,                 // 任务详情
  displayMessages,      // 当前显示的消息列表
  workflowSteps,        // 工作流步骤
  isLoading,            // 是否正在加载
  isGenerating,         // 是否正在生成
  progress,             // 进度百分比
  isActiveTask,         // 是否为活跃任务
  setLocalMessages,     // 更新本地消息
  setLocalIsGenerating, // 设置本地生成状态
} = useChatState({
  taskId: 'xxx',
  t: t,  // 翻译函数
})
```

### utils/ - 页面私有工具函数

#### isTaskCompleted - 任务状态检测

检测任务是否已完成。

```tsx
import { isTaskCompleted } from './utils'

if (isTaskCompleted(messages)) {
  console.log('任务已完成')
}
```

#### convertMessages - 消息格式转换

将后端消息格式转换为前端显示格式。

```tsx
import { convertMessages } from './utils'

const displayMessages = convertMessages(rawMessages)
```

## 扩展指南

### 添加新组件

1. 在 `components/` 目录下创建组件目录：

```bash
components/
├── NewComponent/
│   └── index.tsx
```

2. 在 `components/index.ts` 中导出：

```tsx
export { NewComponent } from './NewComponent'
```

3. 在 `page.tsx` 中使用：

```tsx
import { NewComponent } from './components'
```

### 添加新 Hook

1. 在 `hooks/` 目录下创建文件：

```bash
hooks/
├── useNewFeature.ts
```

2. 在 `hooks/index.ts` 中导出：

```tsx
export { useNewFeature } from './useNewFeature'
```

3. 在 `page.tsx` 中使用：

```tsx
import { useNewFeature } from './hooks'
```

### 添加新工具函数

1. 在 `utils/` 目录下创建文件：

```bash
utils/
├── newUtil.ts
```

2. 在 `utils/index.ts` 中导出：

```tsx
export { newUtilFunction } from './newUtil'
```

## 数据流

```text
┌─────────────────────────────────────────────────────────────┐
│                        page.tsx                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  useChatState   │  │ useScrollControl│                   │
│  │                 │  │                 │                   │
│  │ - Store 状态    │  │ - 滚动状态      │                   │
│  │ - 本地状态      │  │ - Refs          │                   │
│  │ - 轮询管理      │  │                 │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────────────────────────────────┐            │
│  │              Components                      │            │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────┐ │            │
│  │  │ChatHeader│ │ChatMessageList│ │ChatInput │ │            │
│  │  └──────────┘ └──────────────┘ └──────────┘ │            │
│  └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │     Agent Store        │
              │  (全局状态管理)         │
              └────────────────────────┘
```

## 注意事项

1. **组件职责单一**：每个组件只负责一件事，避免组件过于臃肿。

2. **状态管理**：
   - 全局状态使用 `useAgentStore`
   - 页面级状态使用 `useChatState` 封装
   - 临时状态使用 `useState`

3. **国际化**：所有文案都使用 `t()` 函数，key 格式为 `chat.xxx`。

4. **类型安全**：所有 Props 和返回值都有完整的 TypeScript 类型定义。

5. **公共组件**：
   - `ChatInput`、`ChatMessage` 等通用组件位于 `@/components/Chat/`
   - 页面私有组件位于 `./components/`

