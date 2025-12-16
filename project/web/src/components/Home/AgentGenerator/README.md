# AgentGenerator 组件

AI Agent 内容生成组件，支持 SSE 流式对话、多媒体上传、多平台发布。

## 功能特性

- 🤖 **AI 对话**: SSE 实时流式响应，支持多轮对话
- 📷 **媒体上传**: 支持图片/视频上传到 OSS
- 📝 **内容生成**: AI 自动生成标题、描述、标签
- 🚀 **多平台发布**: 支持小红书、抖音、快手等平台
- 💾 **草稿管理**: 支持保存到草稿箱

## 目录结构

```
AgentGenerator/
├── index.tsx                  # 主组件
├── agentGenerator.module.scss # 样式文件
├── agentStore.ts              # 局部 Store
├── agentStore.types.ts        # 类型定义
├── actionHandlers.ts          # Action 处理器
└── README.md                  # 组件文档
```

## 使用方式

```tsx
import AgentGenerator from '@/components/Home/AgentGenerator'

function MyPage() {
  return (
    <AgentGenerator 
      onLoginRequired={() => setLoginModalOpen(true)}
      promptToApply={promptData}  // 可选：外部传入的提示词
    />
  )
}
```

## Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `onLoginRequired` | `() => void` | 否 | 需要登录时的回调 |
| `promptToApply` | `{ prompt: string; image?: string } \| null` | 否 | 外部传入的提示词（如从模板选择） |

## Ref 方法

组件暴露以下方法供父组件调用：

```tsx
const agentRef = useRef<IAgentGeneratorRef>(null)

// 重置所有状态
agentRef.current?.reset()

// 开始新对话
agentRef.current?.newConversation()
```

## 架构设计

### Store 状态管理

使用 Zustand 实现局部状态管理，状态分为以下几类：

- **会话状态**: `taskId`, `sessionId`, `prompt`
- **生成状态**: `isGenerating`, `progress`, `streamingText`
- **媒体状态**: `uploadedImages`, `isUploading`
- **消息状态**: `completedMessages`, `pendingMessages`, `markdownMessages`
- **UI 状态**: `selectedMode`, `currentCost`, `showFixedInput`

### Action Handler 策略模式

使用策略模式处理不同的任务结果，便于扩展：

```typescript
interface IActionHandler {
  type: ActionType
  canHandle: (taskData: ITaskData) => boolean
  execute: (taskData: ITaskData, context: IActionContext) => Promise<void>
}
```

**内置 Handler：**

| Handler | 说明 |
|---------|------|
| `navigateToPublishPluginHandler` | 处理小红书、抖音等插件平台发布 |
| `navigateToPublishOtherHandler` | 处理快手等其他平台发布 |
| `navigateToDraftHandler` | 跳转到草稿箱 |
| `saveDraftHandler` | 保存内容到草稿箱 |
| `updateChannelHandler` | 处理频道授权过期 |
| `loginChannelHandler` | 处理频道登录 |

### 扩展 Action Handler

如需添加新的 Action 处理逻辑：

```typescript
import { ActionRegistry } from '@/components/Home/AgentGenerator/actionHandlers'

// 1. 创建新的 Handler
const myCustomHandler: IActionHandler = {
  type: 'myCustomAction',
  canHandle: (taskData) => taskData.action === 'myCustomAction',
  execute: async (taskData, context) => {
    // 实现自定义逻辑
    const { router, lng, t } = context
    // ...
  }
}

// 2. 注册到 ActionRegistry
ActionRegistry.register(myCustomHandler)
```

## SSE 消息处理

组件处理以下 SSE 消息类型：

| 类型 | 说明 |
|------|------|
| `init` | 初始化消息，包含 taskId |
| `keep_alive` | 心跳消息 |
| `stream_event` | 流式内容更新 |
| `status` | 状态更新（THINKING, GENERATING 等） |
| `text` | 文本消息 |
| `error` | 错误消息 |
| `result` | 最终结果 |

## 依赖

- `zustand`: 状态管理
- `react-markdown`: Markdown 渲染
- `@ant-design/icons`: 图标
- `driver.js`: 新手引导（可选）

## 样式

样式使用 CSS Modules，主题色为紫色系 (`#a66ae4`)。

支持响应式设计，移动端自适应布局。

