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
│   ├── sse.handlers.ts   # SSE 消息处理器
│   └── action.handlers.ts # Action 处理器
├── utils/                # 工具函数目录
│   ├── index.ts          # 工具导出
│   ├── refs.ts           # Refs 管理
│   ├── workflow.ts       # 工作流工具
│   ├── message.ts        # 消息工具
│   └── progress.ts       # 进度工具
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

#### SSE 处理器 (sse.handlers.ts)

使用职责链模式处理 SSE 消息：

```typescript
import { SSEHandlerRegistry } from '@/store/agent'

// 注册自定义处理器
SSEHandlerRegistry.register({
  name: 'custom',
  canHandle: (msg) => msg.type === 'custom_type',
  handle: (msg, ctx) => {
    // 处理逻辑
  },
})
```

内置处理器：

- `init` - 初始化消息
- `keep_alive` - 心跳消息
- `message_start` - 新消息开始
- `tool_use_start` - 工具调用开始
- `text_delta` - 流式文本
- `input_json_delta` - 工具参数
- `assistant_message` - 工具调用完成
- `user_message` - 工具结果
- `text` - 文本消息
- `error` - 错误消息

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

#### workflow.ts - 工作流工具

管理 AI 工作流步骤：

```typescript
import { createWorkflowUtils } from '@/store/agent'

const workflowUtils = createWorkflowUtils({ refs, set, get })
workflowUtils.startNewStep()
workflowUtils.addWorkflowStep(step)
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

进度计算和状态配置：

```typescript
import { calculateProgress, getStatusConfig } from '@/store/agent'

const newProgress = calculateProgress(currentProgress, status, isNewStatus)
const config = getStatusConfig('THINKING')
```

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
    })),
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

### 添加 SSE 处理器

1. 在 `handlers/sse.handlers.ts` 中添加：

```typescript
export const customHandler: ISSEHandler = {
  name: 'custom',
  canHandle: (msg) => msg.type === 'custom',
  handle: (msg, ctx) => {
    // 处理逻辑
  },
}
```

2. 添加到处理器数组或运行时注册：

```typescript
SSEHandlerRegistry.register(customHandler)
```

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

在使用工厂函数（如 `createStoreMethods`、`createWorkflowUtils`）返回对象字面量时，如果方法内部使用 `this` 来调用其他方法，当这些方法被作为回调函数传递时，`this` 的上下文会丢失。

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
      this.methodA()  // TypeError: Cannot read properties of undefined
    },
  }
}

// 使用场景（会出错）
const methods = createMethods()
someAsyncFunction((data) => {
  methods.methodB()  // 正常工作
})

// 或者
someAsyncFunction(methods.methodB)  // this 丢失！
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
