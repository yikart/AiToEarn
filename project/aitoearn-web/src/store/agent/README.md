# Agent Store

全局 AI Agent 任务状态管理模块。

## 目录结构

```text
src/store/agent/
├── index.ts              # 主入口，组装 store 并导出
├── agent.types.ts        # 类型定义
├── agent.constants.ts    # 常量定义
├── agent.state.ts        # 初始状态
├── agent.methods.ts      # 核心方法
├── handlers/             # 处理器目录
│   ├── index.ts          # 处理器导出
│   └── action.handlers.ts # Action 处理器
├── utils/                # 工具函数目录
│   ├── index.ts          # 工具导出
│   ├── refs.ts           # Refs 管理
│   ├── message.ts        # 消息工具
│   └── progress.ts       # 进度工具
├── task-instance/        # 任务实例目录
│   ├── index.ts              # 模块导出
│   ├── task-instance.types.ts # 类型定义
│   ├── TaskInstance.ts       # 核心类（代理层）
│   ├── message.handler.ts    # 消息处理逻辑
│   ├── workflow.handler.ts   # 工作流处理逻辑
│   └── sse.handler.ts        # SSE 消息处理逻辑
└── README.md             # 本文档
```

## 模块说明

### index.ts - 主入口

组装 store 并导出所有模块：

```typescript
import { useAgentStore } from '@/store/agent'

const { isGenerating, messages, createTask, stopTask } = useAgentStore()
```

### handlers/ - 处理器目录

#### Action 处理器 (action.handlers.ts)

使用策略模式处理任务结果：

```typescript
import { ActionRegistry } from '@/store/agent'

// 注册自定义 Action
ActionRegistry.register({
  type: 'customAction',
  canHandle: (taskData) => taskData.action === 'customAction',
  execute: async (taskData, context) => {
    // 处理逻辑
  },
})
```

内置 Action：

- `navigateToPublish` - 导航到发布页面
- `navigateToDraft` - 导航到草稿箱
- `saveDraft` - 保存草稿
- `updateChannel` - 更新频道授权
- `loginChannel` - 登录频道

### utils/ - 工具目录

#### refs.ts - Refs 管理

管理内部引用变量，避免闭包问题：

```typescript
import { createAgentRefs, resetAgentRefs } from '@/store/agent'

const refs = createAgentRefs()
resetAgentRefs(refs) // 重置 refs
```

#### message.ts - 消息工具

消息创建和状态管理：

```typescript
import { createMessageUtils } from '@/store/agent'

const messageUtils = createMessageUtils({ refs, set, get })
const userMsg = messageUtils.createUserMessage('Hello', [])
messageUtils.markMessageDone()
```

#### progress.ts - 进度工具

进度计算和状态配置（内部使用）。

### task-instance/ - 任务实例目录

TaskInstance 是解决多任务消息混乱问题的核心架构。每个 Agent 任务对应一个独立的 TaskInstance 实例，确保消息状态完全隔离。

#### 模块拆分结构

| 文件                     | 行数 | 职责                               |
| ------------------------ | ---- | ---------------------------------- |
| `task-instance.types.ts` | ~100 | 类型定义（上下文接口、回调接口等） |
| `message.handler.ts`     | ~250 | 消息处理（创建、更新、状态管理）   |
| `workflow.handler.ts`    | ~260 | 工作流处理（步骤管理、工具调用）   |
| `sse.handler.ts`         | ~290 | SSE 消息分发和处理                 |
| `TaskInstance.ts`        | ~415 | 核心类（代理层，整合各模块）       |

#### TaskInstance.ts - 核心类

**核心设计：**

- **instanceId**: 实例唯一标识（创建时生成，不可变）
- **taskId**: 任务ID（可从临时ID迁移到真实ID）
- **实例级 refs**: 每个实例有独立的 `currentAssistantMessageId`、`streamingText`、`currentStepWorkflow` 等
- **SSE 回调绑定**: SSE 回调绑定到具体 TaskInstance，消除多任务切换时的竞态条件
- **代理模式**: TaskInstance 作为门面，代理到各个 handler 模块

#### message.handler.ts - 消息处理

提供消息创建和状态更新功能：

```typescript
// 消息创建
createUserMessage(content, medias?)     // 创建用户消息
createAssistantMessage(ctx)             // 创建 AI 回复消息

// 消息状态更新
markMessageDone(ctx)                    // 标记完成
markMessageError(ctx, error)            // 标记错误
updateMessageContent(ctx, content)      // 更新内容
updateMessageWithActions(ctx, content, actions)  // 更新带 actions
```

#### workflow.handler.ts - 工作流处理

处理工作流步骤和工具调用：

```typescript
startNewStep(ctx) // 开始新步骤
addWorkflowStep(ctx, step) // 添加工作流步骤
updateLastWorkflowStep(ctx, updater) // 更新最后一步
handleToolCallComplete(ctx, name, input) // 处理工具调用完成
handleToolResult(ctx, resultText) // 处理工具结果
```

#### sse.handler.ts - SSE 消息处理

处理来自服务端的 SSE 事件：

```typescript
handleSSEMessage(ctx, msg, callbacks?)  // SSE 消息处理主入口
// 内部处理: stream_event, assistant, user, result, error, done
```

**使用示例：**

```typescript
import { TaskInstance, getTaskInstance, getOrCreateTaskInstance } from '@/store/agent'

// 创建任务实例上下文
const instanceContext: ITaskInstanceContext = {
  syncToStore: (taskId, updater) => updateTaskData(taskId, updater),
  getData: (taskId) => getTaskData(taskId),
  migrateTaskData: (fromTaskId, toTaskId) => {
    /* 迁移数据 */
  },
  setCurrentTaskId: (taskId) => set({ currentTaskId: taskId }),
}

// 创建新的任务实例
const instance = new TaskInstance(tempTaskId, instanceContext)

// 设置翻译函数和 Action 上下文
instance.setTranslation(t)
instance.setActionContext(actionContext)

// 通过实例添加消息
const userMessage = instance.createUserMessage(prompt, medias)
instance.addMessage(userMessage)

// 通过实例处理 SSE 消息
instance.handleSSEMessage(sseMessage, callbacks)

// 获取或创建任务实例
const instance = getOrCreateTaskInstance(taskId, context)

// 获取现有实例
const existing = getTaskInstance(taskId)
```

**核心 API：**

| 方法                                    | 说明                             |
| --------------------------------------- | -------------------------------- |
| `createUserMessage(content, medias?)`   | 创建用户消息                     |
| `createAssistantMessage()`              | 创建 AI 回复消息                 |
| `addMessage(message)`                   | 添加消息到当前任务               |
| `handleSSEMessage(message, callbacks?)` | 处理 SSE 消息                    |
| `markMessageDone()`                     | 标记当前消息完成                 |
| `markMessageError(error)`               | 标记当前消息错误                 |
| `setIsGenerating(value)`                | 设置生成状态                     |
| `setProgress(value)`                    | 设置进度                         |
| `migrateToRealTaskId(newTaskId)`        | 更新任务ID（临时ID迁移到真实ID） |
| `resetForNewRound()`                    | 重置实例状态（新一轮对话）       |
| `abort()`                               | 中止 SSE 连接                    |

## 使用示例

### 基础使用

```tsx
import { useAgentStore } from '@/store/agent'
import { useShallow } from 'zustand/react/shallow'

function ChatPage() {
  const { messages, isGenerating, createTask, setActionContext } = useAgentStore(
    useShallow((state) => ({
      messages: state.messages,
      isGenerating: state.isGenerating,
      createTask: state.createTask,
      setActionContext: state.setActionContext,
    }))
  )

  const router = useRouter()
  const { t } = useTranslation()

  // 设置 action 上下文
  useEffect(() => {
    setActionContext({ router, lng: 'zh-CN', t })
  }, [router, t])

  const handleSend = async (prompt: string) => {
    await createTask({ prompt, t })
  }

  return <div>{/* ... */}</div>
}
```

### 继续对话

```tsx
const { continueTask } = useAgentStore()

const handleContinue = async (prompt: string, taskId: string) => {
  await continueTask({ prompt, taskId, t })
}
```

## 扩展指南

### 添加 Action 处理器

1. 在 `handlers/action.handlers.ts` 中添加：

```typescript
const customActionHandler: IActionHandler = {
  type: 'customAction',
  canHandle: (taskData) => taskData.action === 'customAction',
  execute: async (taskData, context) => {
    // 处理逻辑
  },
}
```

2. 添加到处理器数组或运行时注册：

```typescript
ActionRegistry.register(customActionHandler)
```

### 添加工具函数

在 `utils/` 目录下创建新文件，并在 `utils/index.ts` 中导出。

## 注意事项

1. **消息 ID 匹配**：消息更新使用 ID 精确匹配，避免更新错误消息。
2. **Refs vs State**：频繁更新的数据使用 ref，避免闭包问题。
3. **Action 上下文**：使用 action 前需要调用 `setActionContext`。
4. **插件发布**：小红书/抖音需要浏览器插件支持。

## ⚠️ 重要：避免 `this` 上下文丢失问题

### 问题描述

在使用工厂函数（如 `createStoreMethods`）返回对象字面量时，如果方法内部使用 `this` 来调用其他方法，当这些方法被作为回调函数传递时，`this` 的上下文会丢失。

### 错误示例

```typescript
// ❌ 错误：在对象字面量中使用 this
function createMethods() {
  return {
    methodA() {
      console.log('A')
    },
    methodB() {
      // 当 methodB 作为回调传递时，this 会丢失
      this.methodA() // TypeError: Cannot read properties of undefined
    },
  }
}

// 使用场景（会出错）
const methods = createMethods()
someAsyncFunction((data) => {
  methods.methodB() // 正常工作
})

// 或者
someAsyncFunction(methods.methodB) // this 丢失！
```

### 正确做法

将方法定义为独立的闭包函数，然后在返回对象中引用它们：

```typescript
// ✅ 正确：使用闭包引用
function createMethods() {
  // 先定义为独立函数
  function methodA() {
    console.log('A')
  }

  function methodB() {
    // 直接调用闭包中的函数，不依赖 this
    methodA()
  }

  // 返回方法对象
  return {
    methodA,
    methodB,
  }
}
```

### 检查清单

编写新方法时，请检查：

1. 方法是否会作为回调函数传递？
2. 方法内部是否调用了同一对象的其他方法？
3. 如果是，是否使用了 `this`？

如果满足以上条件，请使用闭包模式而非 `this`。
