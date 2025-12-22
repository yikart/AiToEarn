/**
 * 消息转换工具
 * 将后端消息格式转换为前端显示格式
 */
import type { TaskMessage } from '@/api/agent'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type { IDisplayMessage, IWorkflowStep, IMessageStep } from '@/store/agent'
import { parseUserMessageContent } from './parseMessageContent'

/**
 * 将后端消息转换为显示格式
 * 数据结构说明：
 * - user: { type: 'user', content: [{ type: 'text', text: '...' }] }
 * - assistant: { type: 'assistant', uuid: '...', message: { content: [{ type: 'text', text: '...' }] } }
 * - stream_event: 流式事件，用于提取工具调用信息
 * - result: { type: 'result', message: '...', result: { action: '...', platform: '...', ... } }
 *   - message 字段包含文本内容
 *   - result 字段（根级别）包含 action 数据（如 createChannel、updateChannel 等）
 *
 * 改进：解析多步骤和工作流步骤
 * - message_start 事件标识新步骤开始
 * - tool_use 事件标识工具调用
 * - tool_result 事件标识工具结果
 */
export function convertMessages(messages: TaskMessage[]): IDisplayMessage[] {
  const displayMessages: IDisplayMessage[] = []

  // 临时存储当前 assistant 消息的步骤
  let currentSteps: IMessageStep[] = []
  let currentStepContent = ''
  let currentStepWorkflow: IWorkflowStep[] = []
  let stepIndex = 0
  let lastAssistantMsgIndex = -1

  // 用于追踪工具调用的 Map
  const toolCallMap = new Map<string, string>()

  /** 保存当前步骤到步骤列表 */
  const saveCurrentStep = () => {
    if (currentStepContent.trim() || currentStepWorkflow.length > 0) {
      currentSteps.push({
        id: `step-${stepIndex}`,
        content: currentStepContent.trim(),
        workflowSteps: [...currentStepWorkflow],
        isActive: false,
        timestamp: Date.now(),
      })
      stepIndex++
    }
    currentStepContent = ''
    currentStepWorkflow = []
  }

  /** 将步骤保存到最后一个 assistant 消息 */
  const saveStepsToMessage = () => {
    saveCurrentStep()
    if (currentSteps.length > 0 && lastAssistantMsgIndex >= 0) {
      const lastMsg = displayMessages[lastAssistantMsgIndex]
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.steps = [...currentSteps]
      }
    }
    currentSteps = []
    stepIndex = 0
  }

  messages.forEach((msg, index) => {
    if (msg.type === 'user') {
      // 用户消息处理
      processUserMessage(msg, index, displayMessages, currentStepWorkflow, toolCallMap, saveStepsToMessage)
    } else if (msg.type === 'stream_event') {
      // 流式事件处理
      processStreamEvent(msg, currentStepWorkflow, toolCallMap, saveCurrentStep)
    } else if (msg.type === 'assistant') {
      // AI 回复消息处理
      const result = processAssistantMessage(msg, index, displayMessages, currentStepWorkflow, toolCallMap)
      if (result.contentToAdd) {
        currentStepContent += (currentStepContent ? '\n\n' : '') + result.contentToAdd
      }
      if (result.newAssistantMsgIndex !== undefined) {
        lastAssistantMsgIndex = result.newAssistantMsgIndex
      }
    } else if (msg.type === 'result') {
      // 结果消息处理
      const result = processResultMessage(msg, index, displayMessages)
      if (result.contentToAdd && !currentStepContent.includes(result.contentToAdd)) {
        currentStepContent += (currentStepContent ? '\n\n' : '') + result.contentToAdd
      }
      if (result.newAssistantMsgIndex !== undefined) {
        lastAssistantMsgIndex = result.newAssistantMsgIndex
      }
    }
  })

  // 保存最后的步骤
  saveStepsToMessage()

  // 后处理：确保每条 assistant 消息都有正确的 content
  displayMessages.forEach(msg => {
    if (msg.role === 'assistant' && msg.steps && msg.steps.length > 0) {
      const totalContent = msg.steps.map(s => s.content).filter(Boolean).join('\n\n')
      if (totalContent && !msg.content) {
        msg.content = totalContent
      }
    }
  })

  return displayMessages
}

/** 处理用户消息 */
function processUserMessage(
  msg: TaskMessage,
  index: number,
  displayMessages: IDisplayMessage[],
  currentStepWorkflow: IWorkflowStep[],
  toolCallMap: Map<string, string>,
  saveStepsToMessage: () => void,
) {
  let content = ''
  const medias: IUploadedMedia[] = []
  let isToolResult = false

  if (Array.isArray(msg.content)) {
    // 尝试使用新的解析器解析数组格式
    const parsed = parseUserMessageContent(msg.content)
    if (parsed.hasSpecialFormat || parsed.medias.length > 0) {
      content = parsed.text
      medias.push(...parsed.medias)
    } else {
      // 使用原有逻辑
      msg.content.forEach((item: any) => {
        if (item.type === 'text') {
          content = item.text || ''
        } else if (item.type === 'image') {
          medias.push({
            url: item.source?.url || '',
            type: 'image',
          })
        } else if (item.type === 'video') {
          medias.push({
            url: item.source?.url || '',
            type: 'video',
          })
        } else if (item.type === 'document') {
          medias.push({
            url: item.source?.url || '',
            type: 'document',
          })
        } else if (item.type === 'tool_result') {
          isToolResult = true
        }
      })
    }
  } else if (typeof msg.content === 'string') {
    // 尝试使用新的解析器解析字符串格式
    const parsed = parseUserMessageContent(msg.content)
    content = parsed.text
    if (parsed.medias.length > 0) {
      medias.push(...parsed.medias)
    }
  }

  // 只有非工具结果的用户消息才显示
  if (content && !isToolResult) {
    saveStepsToMessage()

    displayMessages.push({
      id: msg.uuid || `user-${index}`,
      role: 'user',
      content,
      medias: medias.length > 0 ? medias : undefined,
      status: 'done',
    })
  }

  // 处理工具结果（添加到工作流）
  if ((msg as any).message) {
    const userMsg = (msg as any).message as any
    const contentArray = userMsg?.content || userMsg?.message?.content
    if (contentArray && Array.isArray(contentArray)) {
      contentArray.forEach((item: any) => {
        if (item.type === 'tool_result' && item.tool_use_id) {
          const toolName = toolCallMap.get(item.tool_use_id) || 'Tool'
          let resultText = ''
          if (Array.isArray(item.content)) {
            item.content.forEach((rc: any) => {
              if (rc.type === 'text') {
                resultText = rc.text || ''
              }
            })
          } else if (typeof item.content === 'string') {
            resultText = item.content
          }

          if (resultText) {
            currentStepWorkflow.push({
              id: `result-${item.tool_use_id}`,
              type: 'tool_result',
              toolName,
              content: resultText,
              isActive: false,
              timestamp: Date.now(),
            })
          }
        }
      })
    }
  }

  // 从 tool_use_result 字段获取工具结果
  if ((msg as any).tool_use_result) {
    const results = (msg as any).tool_use_result
    if (Array.isArray(results)) {
      results.forEach((result: any) => {
        if (result.type === 'text' && result.text) {
          const lastToolCall = [...currentStepWorkflow].reverse().find(s => s.type === 'tool_call')
          const toolName = lastToolCall?.toolName || 'Tool'

          currentStepWorkflow.push({
            id: `result-${Date.now()}-${Math.random()}`,
            type: 'tool_result',
            toolName,
            content: result.text,
            isActive: false,
            timestamp: Date.now(),
          })
        }
      })
    }
  }
}

/** 处理流式事件 */
function processStreamEvent(
  msg: TaskMessage,
  currentStepWorkflow: IWorkflowStep[],
  toolCallMap: Map<string, string>,
  saveCurrentStep: () => void,
) {
  const streamEvent = msg as any
  const event = streamEvent.event

  // message_start 表示新的一轮消息开始（新步骤）
  if (event?.type === 'message_start') {
    saveCurrentStep()
  }

  // 工具调用开始
  if (event?.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
    const toolName = event.content_block.name || 'Unknown Tool'
    const toolId = event.content_block.id || `tool-${Date.now()}`

    toolCallMap.set(toolId, toolName)

    currentStepWorkflow.push({
      id: toolId,
      type: 'tool_call',
      toolName,
      content: '',
      isActive: false,
      timestamp: Date.now(),
    })
  }

  // 工具调用参数
  if (event?.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
    const lastToolCall = currentStepWorkflow.findLast(s => s.type === 'tool_call')
    if (lastToolCall) {
      lastToolCall.content = (lastToolCall.content || '') + (event.delta.partial_json || '')
    }
  }
}

/** 处理 assistant 消息 */
function processAssistantMessage(
  msg: TaskMessage,
  index: number,
  displayMessages: IDisplayMessage[],
  currentStepWorkflow: IWorkflowStep[],
  toolCallMap: Map<string, string>,
): { contentToAdd?: string; newAssistantMsgIndex?: number } {
  let content = ''
  const messageData = (msg as any).message as any

  if (messageData?.content && Array.isArray(messageData.content)) {
    messageData.content.forEach((item: any) => {
      if (item.type === 'text') {
        content += item.text || ''
      } else if (item.type === 'tool_use') {
        const toolName = item.name || 'Unknown Tool'
        const toolId = item.id || `tool-${Date.now()}`
        const toolInput = item.input ? JSON.stringify(item.input, null, 2) : ''

        toolCallMap.set(toolId, toolName)

        const existingCall = currentStepWorkflow.find(s => s.id === toolId)
        if (existingCall) {
          existingCall.content = toolInput
          existingCall.isActive = false
        } else {
          currentStepWorkflow.push({
            id: toolId,
            type: 'tool_call',
            toolName,
            content: toolInput,
            isActive: false,
            timestamp: Date.now(),
          })
        }
      }
    })
  }

  // 检查是否需要创建新的 assistant 消息
  const lastMsg = displayMessages[displayMessages.length - 1]
  if (!lastMsg || lastMsg.role !== 'assistant') {
    displayMessages.push({
      id: (msg as any).uuid || `assistant-${index}`,
      role: 'assistant',
      content: '',
      status: 'done',
      steps: [],
    })
    return {
      contentToAdd: content || undefined,
      newAssistantMsgIndex: displayMessages.length - 1,
    }
  }

  return { contentToAdd: content || undefined }
}

/** 处理结果消息 */
function processResultMessage(
  msg: TaskMessage,
  index: number,
  displayMessages: IDisplayMessage[],
): { contentToAdd?: string; newAssistantMsgIndex?: number; actions?: any[] } {
  const msgAny = msg as any
  const msgData = msgAny.message
  let content = ''
  let actions: any[] = []

  // 处理 result 消息格式
  // 格式1: message 是字符串
  if (msgData && typeof msgData === 'string') {
    content = msgData
  }
  // 格式2: message 是对象，包含 message 文本和 result 数组/对象
  else if (msgData && typeof msgData === 'object') {
    // 获取文本消息
    if (msgData.message && typeof msgData.message === 'string') {
      content = msgData.message
    }
  }

  // 解析 result 数据中的 action（支持数组和单个对象）
  // 注意：后端保存的结构是 msg.result（根级别），不是 msg.message.result
  // 同时兼容两种格式以防万一
  const resultData = msgAny.result || (msgData && typeof msgData === 'object' ? msgData.result : null)
  
  if (resultData) {
    // 统一转换为数组处理
    const resultArray = Array.isArray(resultData) ? resultData : [resultData]
    
    actions = resultArray
      .filter((item: any) => item && item.action) // 只处理有 action 的项
      .map((item: any) => ({
        type: item.action, // 映射 action -> type
        platform: item.platform,
        accountId: item.accountId,
        title: item.title,
        description: item.description,
        medias: item.medias,
        tags: item.tags,
      }))
  }

  if (content || actions.length > 0) {
    const lastMsg = displayMessages[displayMessages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      // 将 actions 附加到最后一条 assistant 消息
      if (actions.length > 0) {
        lastMsg.actions = [...(lastMsg.actions || []), ...actions]
      }
      return { contentToAdd: content || undefined }
    } else {
      displayMessages.push({
        id: msgAny.uuid || `result-${index}`,
        role: 'assistant',
        content: content || '',
        status: 'done',
        actions: actions.length > 0 ? actions : undefined,
      })
      return { newAssistantMsgIndex: displayMessages.length - 1 }
    }
  }

  return {}
}

