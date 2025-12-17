# Chat 对话详情页

## 功能说明

对话详情页支持实时模式和历史模式，可以显示 AI 生成任务的完整对话历史。

## 消息格式支持

### 1. 普通文本消息

```
将图片换成红色风格生成图文内容发布到抖音小红书推特
```

### 2. Markdown 引用格式

支持在消息中使用 Markdown 引用格式来附加媒体文件：

```
将图片换成红色风格生成图文内容发布到抖音小红书推特

[image]: https://aitoearn.s3.ap-southeast-1.amazonaws.com/68abbe6af812ccb3e1a53d68/f646899220b7f9b0cc9bfe2b27ad0d571671121320.jpeg
```

支持的媒体类型：
- `[image]: url` - 图片
- `[video]: url` - 视频
- `[document]: url` - 文档

### 3. Claude Prompt 格式

支持 Claude API 的标准 prompt 格式（JSON 数组）：

```json
[
  {
    "type": "text",
    "text": "将图片换成红色风格生成图文内容发布到抖音小红书推特"
  },
  {
    "type": "image",
    "source": {
      "type": "url",
      "url": "https://aitoearn.s3.ap-southeast-1.amazonaws.com/68abbe6af812ccb3e1a53d68/f646899220b7f9b0cc9bfe2b27ad0d571671121320.jpeg"
    }
  },
  {
    "type": "video",
    "source": {
      "type": "url",
      "url": "https://example.com/video.mp4"
    }
  },
  {
    "type": "document",
    "source": {
      "type": "url",
      "url": "https://example.com/document.pdf"
    },
    "cache_control": {
      "type": "ephemeral"
    }
  }
]
```

支持的内容类型：
- `text` - 文本内容
- `image` - 图片（需要 source.url）
- `video` - 视频（需要 source.url）
- `document` - 文档（需要 source.url）

可选字段：
- `cache_control` - 缓存控制配置

## 工作流展示

每条 AI 消息都可以包含多个步骤（steps），每个步骤可以有自己的工作流（workflowSteps）：

- 工具调用（tool_call）
- 工具结果（tool_result）
- 思考过程（thinking）

工作流会自动展开/收起，活跃步骤默认展开，非活跃步骤默认收起。

## 技术实现

### 核心文件

1. **page.tsx** - 页面主文件
2. **components/** - 页面私有组件
   - ChatHeader - 顶部导航栏
   - ChatMessageList - 消息列表
   - ChatLoadingSkeleton - 加载骨架屏
3. **hooks/** - 页面私有 hooks
   - useChatState - 聊天状态管理
   - useScrollControl - 滚动控制
   - useTaskPolling - 任务轮询
4. **utils/** - 工具函数
   - convertMessages - 消息格式转换
   - parseMessageContent - 消息内容解析（支持多种格式）
   - taskStatus - 任务状态判断

### 消息解析流程

1. 接收后端消息（TaskMessage[]）
2. 使用 `parseUserMessageContent` 解析用户消息内容
   - 自动识别格式（普通文本/Markdown引用/Claude Prompt）
   - 提取文本和媒体文件
3. 使用 `convertMessages` 转换为显示格式（IDisplayMessage[]）
4. 在 ChatMessage 组件中渲染

### 类型定义

核心类型定义在 `src/store/agent/agent.types.ts`：

```typescript
// 媒体文件
interface IUploadedMedia {
  url: string
  type: 'image' | 'video' | 'document'
  progress?: number
  file?: File
  name?: string
  cache_control?: { type: 'ephemeral' }
}

// Claude Prompt 内容项
interface IPromptContentItem {
  type: 'text' | 'image' | 'video' | 'document'
  text?: string
  source?: {
    type: 'url' | 'base64'
    url?: string
    data?: string
    media_type?: string
  }
  cache_control?: { type: 'ephemeral' }
}

// 解析后的内容
interface IParsedUserContent {
  text: string
  medias: IUploadedMedia[]
  hasSpecialFormat: boolean
}
```

## 使用示例

### 发送普通消息

```typescript
await continueTask({
  prompt: '生成一篇关于AI的文章',
  medias: [],
  t,
  taskId,
})
```

### 发送带图片的消息（Markdown 格式）

```typescript
await continueTask({
  prompt: `将图片换成红色风格

[image]: https://example.com/image.jpg`,
  medias: [],
  t,
  taskId,
})
```

### 发送带多媒体的消息（Claude 格式）

```typescript
const promptArray = [
  { type: 'text', text: '分析这个视频和文档' },
  { type: 'video', source: { type: 'url', url: 'https://example.com/video.mp4' } },
  { type: 'document', source: { type: 'url', url: 'https://example.com/doc.pdf' } },
]

await continueTask({
  prompt: JSON.stringify(promptArray),
  medias: [],
  t,
  taskId,
})
```

## 注意事项

1. **格式自动识别**：系统会自动识别消息格式，无需手动指定
2. **媒体文件显示**：
   - 图片和视频：显示为缩略图
   - 文档：显示为文件图标 + 文件名
3. **工作流展示**：活跃步骤自动展开，非活跃步骤自动收起
4. **滚动行为**：用户在底部附近时，新消息会自动滚动到底部
5. **错误处理**：解析失败时会回退到普通文本显示
