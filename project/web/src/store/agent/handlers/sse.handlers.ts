/**
 * Agent Store - SSE 消息处理器
 * 使用职责链模式处理不同类型的 SSE 消息
 */

import type { ISSEMessage, IWorkflowStep, IMessageStep } from '../agent.types'
import type { IAgentRefs } from '../utils/refs'
import type { WorkflowUtils } from '../utils/workflow'

// ============ SSE 处理器类型 ============

/** SSE 处理器上下文 */
export interface ISSEHandlerContext {
  refs: IAgentRefs
  set: (partial: any) => void
  get: () => any
  workflowUtils: WorkflowUtils
}

/** SSE 回调函数 */
export interface ISSECallbacks {
  onTaskIdReady?: (taskId: string) => void
}

/** SSE 消息处理器接口 */
export interface ISSEHandler {
  /** 处理器名称 */
  name: string
  /** 判断是否能处理该消息 */
  canHandle: (message: ISSEMessage) => boolean
  /** 处理消息 */
  handle: (message: ISSEMessage, context: ISSEHandlerContext, callbacks?: ISSECallbacks) => void
}

// ============ SSE 消息处理器实现 ============

/** 处理 init 消息 */
export const initHandler: ISSEHandler = {
  name: 'init',
  canHandle: (msg) => msg.type === 'init' && !!msg.taskId,
  handle: (msg, ctx, callbacks) => {
    const receivedTaskId = msg.taskId!
    console.log('[SSE] Received taskId:', receivedTaskId)

    ctx.set({ currentTaskId: receivedTaskId })
    ctx.refs.streamingText.value = ''
    ctx.set({ streamingText: '' })

    callbacks?.onTaskIdReady?.(receivedTaskId)
  },
}

/** 处理 keep_alive 消息 */
export const keepAliveHandler: ISSEHandler = {
  name: 'keep_alive',
  canHandle: (msg) => msg.type === 'keep_alive',
  handle: () => {
    // 心跳消息，无需处理
  },
}

/** 处理 stream_event - message_start */
export const messageStartHandler: ISSEHandler = {
  name: 'message_start',
  canHandle: (msg) => {
    if (msg.type !== 'stream_event' || !msg.message) return false
    const event = (msg.message as any).event
    return event?.type === 'message_start'
  },
  handle: (_msg, ctx) => {
    ctx.workflowUtils.startNewStep()
  },
}

/** 处理 stream_event - content_block_start (tool_use) */
export const toolUseStartHandler: ISSEHandler = {
  name: 'tool_use_start',
  canHandle: (msg) => {
    if (msg.type !== 'stream_event' || !msg.message) return false
    const event = (msg.message as any).event
    return event?.type === 'content_block_start' && event.content_block?.type === 'tool_use'
  },
  handle: (msg, ctx) => {
    const event = (msg.message as any).event
    const toolName = event.content_block.name || 'Unknown Tool'
    const toolId = event.content_block.id || `tool-${Date.now()}`

    const newStep: IWorkflowStep = {
      id: toolId,
      type: 'tool_call',
      toolName,
      content: '',
      isActive: true,
      timestamp: Date.now(),
    }
    ctx.workflowUtils.addWorkflowStep(newStep)
  },
}

/** 处理 stream_event - text_delta */
export const textDeltaHandler: ISSEHandler = {
  name: 'text_delta',
  canHandle: (msg) => {
    if (msg.type !== 'stream_event' || !msg.message) return false
    const event = (msg.message as any).event
    return event?.type === 'content_block_delta' && event.delta?.type === 'text_delta'
  },
  handle: (msg, ctx) => {
    const event = (msg.message as any).event
    const text = event.delta.text

    if (!text) return

    ctx.refs.streamingText.value += text
    ctx.set({ streamingText: ctx.refs.streamingText.value })

    // 更新 markdown 消息
    ctx.set((state: any) => {
      const newMessages = [...state.markdownMessages]
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('🤖 ')) {
        newMessages[newMessages.length - 1] = `🤖 ${ctx.refs.streamingText.value}`
      } else {
        newMessages.push(`🤖 ${ctx.refs.streamingText.value}`)
      }
      return { markdownMessages: newMessages }
    })

    // 更新消息列表中的 assistant 消息
    ctx.set((state: any) => ({
      messages: state.messages.map((m: any) => {
        if (m.id === ctx.refs.currentAssistantMessageId.value) {
          const steps = m.steps || []
          const allContent = steps.map((s: IMessageStep) => s.content).join('\n\n')
          const totalContent = allContent
            ? allContent + '\n\n' + ctx.refs.streamingText.value
            : ctx.refs.streamingText.value

          let updatedSteps = [...steps]
          const currentStepData: IMessageStep = {
            id: `step-${ctx.refs.currentStepIndex.value}-live`,
            content: ctx.refs.streamingText.value,
            workflowSteps: [...ctx.refs.currentStepWorkflow.value],
            isActive: true,
            timestamp: Date.now(),
          }

          if (ctx.refs.currentStepIndex.value >= 0 && ctx.refs.currentStepIndex.value < updatedSteps.length) {
            updatedSteps[ctx.refs.currentStepIndex.value] = currentStepData
          } else if (ctx.refs.currentStepIndex.value === updatedSteps.length) {
            updatedSteps.push(currentStepData)
          }

          return {
            ...m,
            content: totalContent,
            status: 'streaming',
            steps: updatedSteps,
          }
        }
        return m
      }),
    }))
  },
}

/** 处理 stream_event - input_json_delta */
export const inputJsonDeltaHandler: ISSEHandler = {
  name: 'input_json_delta',
  canHandle: (msg) => {
    if (msg.type !== 'stream_event' || !msg.message) return false
    const event = (msg.message as any).event
    return event?.type === 'content_block_delta' && event.delta?.type === 'input_json_delta'
  },
  handle: (msg, ctx) => {
    const event = (msg.message as any).event
    const partialJson = event.delta.partial_json

    if (partialJson) {
      ctx.workflowUtils.updateLastWorkflowStep((step) => ({
        ...step,
        content: (step.content || '') + partialJson,
      }))
    }
  },
}

/** 处理 assistant 消息（工具调用完成） */
export const assistantMessageHandler: ISSEHandler = {
  name: 'assistant_message',
  canHandle: (msg) => msg.type === 'assistant' && !!msg.message,
  handle: (msg, ctx) => {
    const assistantMsg = msg.message as any
    if (assistantMsg?.message?.content && Array.isArray(assistantMsg.message.content)) {
      assistantMsg.message.content.forEach((item: any) => {
        if (item.type === 'tool_use') {
          const toolName = item.name || 'Unknown Tool'
          const toolInput = item.input ? JSON.stringify(item.input, null, 2) : ''
          ctx.workflowUtils.handleToolCallComplete(toolName, toolInput)
        }
      })
    }
  },
}

/** 处理 user 消息（工具结果） */
export const userMessageHandler: ISSEHandler = {
  name: 'user_message',
  canHandle: (msg) => msg.type === 'user' && !!msg.message,
  handle: (msg, ctx) => {
    const userMsg = msg.message as any
    if (userMsg?.message?.content && Array.isArray(userMsg.message.content)) {
      userMsg.message.content.forEach((item: any) => {
        if (item.type === 'tool_result') {
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
            ctx.workflowUtils.handleToolResult(resultText)
          }
        }
      })
    }
  },
}

/** 处理 text 消息 */
export const textHandler: ISSEHandler = {
  name: 'text',
  canHandle: (msg) => msg.type === 'text' && !!msg.message,
  handle: (msg, ctx) => {
    ctx.set((state: any) => ({
      markdownMessages: [...state.markdownMessages, msg.message as string],
    }))
  },
}

/** 处理 error 消息 */
export const errorHandler: ISSEHandler = {
  name: 'error',
  canHandle: (msg) => msg.type === 'error',
  handle: (msg, ctx) => {
    if (msg.message) {
      const errorMsg = `❌ : ${msg.message || 'Unknown error'}`
      ctx.set((state: any) => ({
        markdownMessages: [...state.markdownMessages, errorMsg],
      }))
    }

    setTimeout(() => {
      ctx.set({ isGenerating: false })
    }, 100)
    ctx.set({ progress: 0 })
  },
}

// ============ SSE Handler Registry ============

/** 所有注册的 SSE 处理器 */
const sseHandlers: ISSEHandler[] = [
  initHandler,
  keepAliveHandler,
  messageStartHandler,
  toolUseStartHandler,
  textDeltaHandler,
  inputJsonDeltaHandler,
  assistantMessageHandler,
  userMessageHandler,
  textHandler,
  errorHandler,
]

/**
 * SSE 处理器注册表
 */
export const SSEHandlerRegistry = {
  /**
   * 注册新的 SSE 处理器
   */
  register(handler: ISSEHandler): void {
    sseHandlers.unshift(handler)
  },

  /**
   * 处理 SSE 消息
   */
  handle(message: ISSEMessage, context: ISSEHandlerContext, callbacks?: ISSECallbacks): boolean {
    for (const handler of sseHandlers) {
      if (handler.canHandle(message)) {
        handler.handle(message, context, callbacks)
        return true
      }
    }
    return false
  },

  /**
   * 获取所有处理器名称
   */
  getHandlerNames(): string[] {
    return sseHandlers.map((h) => h.name)
  },
}

