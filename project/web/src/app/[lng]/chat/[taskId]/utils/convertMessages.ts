/**
 * 消息转换工具
 * 将后端消息格式转换为前端显示格式
 */
import type { TaskMessage } from '@/api/agent'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type { IDisplayMessage, IMessageStep, IWorkflowStep } from '@/store/agent'
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
  // 用于在 medias 处理后保留原始 content 供去重检查
  let contentBeforeMediasProcessing = ''

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
        // 合并已有的 steps（保留之前可能由 result 附加的 media-only steps），避免覆盖
        lastMsg.steps = [...(lastMsg.steps || []), ...currentSteps]
      }
    }
    currentSteps = []
    stepIndex = 0
  }

  messages.forEach((msg, index) => {
    // 如果任意消息体里直接包含根级别的 result（有些 SSE 使用 stream_event 包裹 result），优先处理 medias 并按步骤位置插入
    const msgAnyCheck = msg as any
    if (msgAnyCheck && msgAnyCheck.result) {
      const resultData = msgAnyCheck.result
      const resultArray = Array.isArray(resultData) ? resultData : [resultData]

      // 保存处理 medias 前的 currentStepContent，用于后续去重检查
      contentBeforeMediasProcessing = currentStepContent

      resultArray.forEach((item: any, arrIndex: number) => {
        if (item && item.medias && Array.isArray(item.medias) && item.medias.length > 0) {
          const convertedMedias = item.medias.map((m: any) => ({
            url: m.url || m.thumbUrl || '',
            type: m.type === 'VIDEO' ? 'video' : 'image',
            name: m.name,
          }))

          // 如果当前有未保存的步骤内容，先保存该步骤，然后把 media step 放到 currentSteps（以便后续合并到最后 assistant 消息中，保证 media 出现在该步骤之后）
          if (currentStepContent && currentStepContent.trim()) {
            saveCurrentStep()
            currentSteps.push({
              id: `media-step-${Date.now()}-${arrIndex}`,
              content: '',
              workflowSteps: [],
              isActive: false,
              timestamp: Date.now(),
              medias: convertedMedias,
            } as any)
          }
          else {
            // 否则直接附加到最后一条 assistant 消息的 steps（如果存在），或新建一条 assistant 消息
            const lastMsg = displayMessages[displayMessages.length - 1]
            const mediaStep = {
              id: `media-step-${Date.now()}-${arrIndex}`,
              content: '',
              workflowSteps: [],
              isActive: false,
              timestamp: Date.now(),
              medias: convertedMedias,
            }
            if (lastMsg && lastMsg.role === 'assistant') {
              if (!lastMsg.steps)
                lastMsg.steps = []
              // 尝试将 media 插入到最后一个有文本内容的 step 之后
              let inserted = false
              for (let i = lastMsg.steps.length - 1; i >= 0; i--) {
                const s = lastMsg.steps[i] as any
                if (s && s.content && String(s.content).trim()) {
                  lastMsg.steps.splice(i + 1, 0, mediaStep as any)
                  inserted = true
                  break
                }
              }
              if (!inserted) {
                // 如果没有文本 step，但 message 层有 content（未拆分为 step），把 message.content 转为 step，放在前面
                if (lastMsg.content && String(lastMsg.content).trim()) {
                  const contentStep = {
                    id: `legacy-content-${Date.now()}`,
                    content: lastMsg.content,
                    workflowSteps: [],
                    isActive: false,
                    timestamp: Date.now(),
                  }
                  // 清空 message.content 并保留在 steps 中
                  lastMsg.content = ''
                  lastMsg.steps.push(contentStep as any)
                }
                // 最后添加 mediaStep
                lastMsg.steps.push(mediaStep as any)
              }
            }
            else {
              displayMessages.push({
                id: msgAnyCheck.uuid || `result-${index}-${arrIndex}`,
                role: 'assistant',
                content: '',
                status: 'done',
                steps: [mediaStep as any],
              })
            }
          }
        }
      })
      // 继续后续的 result 内容处理（不返回，仍需执行 processResultMessage 对文本/actions 解析）
    }
    if (msg.type === 'user') {
      // 用户消息处理
      processUserMessage(msg, index, displayMessages, currentStepWorkflow, toolCallMap, saveStepsToMessage)
    }
    else if (msg.type === 'stream_event') {
      // 流式事件处理
      processStreamEvent(msg, currentStepWorkflow, toolCallMap, saveCurrentStep)
    }
    else if (msg.type === 'assistant') {
      // AI 回复消息处理
      const result = processAssistantMessage(msg, index, displayMessages, currentStepWorkflow, toolCallMap)
      if (result.contentToAdd) {
        currentStepContent += (currentStepContent ? '\n\n' : '') + result.contentToAdd
      }
      if (result.newAssistantMsgIndex !== undefined) {
        lastAssistantMsgIndex = result.newAssistantMsgIndex
      }
    }
    else if (msg.type === 'result') {
      // 结果消息处理
      const result = processResultMessage(msg, index, displayMessages)
      // 更严格的去重：比较 trim 后的内容，避免因空白字符导致重复
      // 注意：如果 medias 处理时调用了 saveCurrentStep()，currentStepContent 可能被重置
      // 使用 contentBeforeMediasProcessing 作为备选来源进行去重检查
      const contentToAdd = result.contentToAdd?.trim()
      const existingContent = currentStepContent.trim()
      const previousContent = contentBeforeMediasProcessing.trim()
      // 检查内容是否已存在于当前步骤或之前保存的步骤中
      const isDuplicate = contentToAdd && (
        existingContent.includes(contentToAdd)
        || contentToAdd === existingContent
        || previousContent.includes(contentToAdd)
        || contentToAdd === previousContent
      )
      if (contentToAdd && !isDuplicate) {
        currentStepContent += (currentStepContent ? '\n\n' : '') + result.contentToAdd
      }
      // 重置 contentBeforeMediasProcessing，避免影响后续消息
      contentBeforeMediasProcessing = ''
      if (result.newAssistantMsgIndex !== undefined) {
        lastAssistantMsgIndex = result.newAssistantMsgIndex
      }
    }
  })

  // 保存最后的步骤
  saveStepsToMessage()

  // 后处理：确保每条 assistant 消息都有正确的 content
  displayMessages.forEach((msg) => {
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
    }
    else {
      // 使用原有逻辑
      msg.content.forEach((item: any) => {
        if (item.type === 'text') {
          content = item.text || ''
        }
        else if (item.type === 'image') {
          medias.push({
            url: item.source?.url || '',
            type: 'image',
          })
        }
        else if (item.type === 'video') {
          medias.push({
            url: item.source?.url || '',
            type: 'video',
          })
        }
        else if (item.type === 'document') {
          medias.push({
            url: item.source?.url || '',
            type: 'document',
          })
        }
        else if (item.type === 'tool_result') {
          isToolResult = true
        }
      })
    }
  }
  else if (typeof msg.content === 'string') {
    // 尝试使用新的解析器解析字符串格式
    const parsed = parseUserMessageContent(msg.content)
    content = parsed.text
    if (parsed.medias.length > 0) {
      medias.push(...parsed.medias)
    }
  }

  // 只有非工具结果的用户消息才显示（包含文本或媒体）
  if ((content || medias.length > 0) && !isToolResult) {
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
          }
          else if (typeof item.content === 'string') {
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
): { contentToAdd?: string, newAssistantMsgIndex?: number } {
  let content = ''
  const messageData = (msg as any).message as any

  if (messageData?.content && Array.isArray(messageData.content)) {
    messageData.content.forEach((item: any) => {
      if (item.type === 'text') {
        content += item.text || ''
      }
      else if (item.type === 'tool_use') {
        const toolName = item.name || 'Unknown Tool'
        const toolId = item.id || `tool-${Date.now()}`
        const toolInput = item.input ? JSON.stringify(item.input, null, 2) : ''

        toolCallMap.set(toolId, toolName)

        const existingCall = currentStepWorkflow.find(s => s.id === toolId)
        if (existingCall) {
          existingCall.content = toolInput
          existingCall.isActive = false
        }
        else {
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
): { contentToAdd?: string, newAssistantMsgIndex?: number, actions?: any[] } {
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

    // Map actions (but do NOT attach medias to action cards to avoid duplicate rendering)
    // 过滤掉 action 为 "none" 的项，因为它们不需要显示为 action 卡片
    actions = resultArray
      .filter((item: any) => item && item.action && item.action !== 'none') // 只处理有实际 action 的项
      .map((item: any) => ({
        type: item.action, // 映射 action -> type
        platform: item.platform,
        accountId: item.accountId,
        title: item.title,
        description: item.description,
        // medias intentionally omitted here; medias will be rendered inline in steps instead
        tags: item.tags,
      }))

    // medias 的插入逻辑已在外层 convertMessages 的循环中处理，以保证插入顺序正确（避免覆盖或顺序错误）
  }

  if (content || actions.length > 0) {
    const lastMsg = displayMessages[displayMessages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      // 将 actions 附加到最后一条 assistant 消息
      if (actions.length > 0) {
        lastMsg.actions = [...(lastMsg.actions || []), ...actions]
      }
      return { contentToAdd: content || undefined }
    }
    else {
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
