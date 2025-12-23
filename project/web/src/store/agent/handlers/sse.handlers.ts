/**
 * Agent Store - SSE 消息处理器
 * 使用职责链模式处理不同类型的 SSE 消息
 */

import { directTrans, useTransClient } from '@/app/i18n/client'
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

/** 从 SSE 消息中提取 event 对象（兼容两种格式） */
function extractEvent(msg: ISSEMessage): any {
  // 格式1: { type: 'stream_event', event: {...} }
  if ((msg as any).event) {
    return (msg as any).event
  }
  // 格式2: { type: 'stream_event', message: { event: {...} } }
  if (msg.message && typeof msg.message === 'object') {
    return (msg.message as any).event
  }
  return null
}

/** 处理 stream_event - message_start */
export const messageStartHandler: ISSEHandler = {
  name: 'message_start',
  canHandle: (msg) => {
    if (msg.type !== 'stream_event') return false
    const event = extractEvent(msg)
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
    if (msg.type !== 'stream_event') return false
    const event = extractEvent(msg)
    return event?.type === 'content_block_start' && event.content_block?.type === 'tool_use'
  },
  handle: (msg, ctx) => {
    const event = extractEvent(msg)
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
    if (msg.type !== 'stream_event') return false
    const event = extractEvent(msg)
    return event?.type === 'content_block_delta' && event.delta?.type === 'text_delta'
  },
  handle: (msg, ctx) => {
    const event = extractEvent(msg)
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
        // Determine target assistant message id:
        // prefer refs.currentAssistantMessageId.value, otherwise fall back to last assistant message in state
        const targetAssistantId =
          ctx.refs.currentAssistantMessageId.value ||
          (function findLastAssistantId() {
            const msgs = state.messages || []
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].role === 'assistant') return msgs[i].id
            }
            return ''
          })()
        if (m.id === targetAssistantId) {
          const steps = m.steps || []

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

          // 从更新后的 steps 计算 content，避免重复
          const totalContent = updatedSteps.map((s: IMessageStep) => s.content).join('\n\n')

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
    if (msg.type !== 'stream_event') return false
    const event = extractEvent(msg)
    return event?.type === 'content_block_delta' && event.delta?.type === 'input_json_delta'
  },
  handle: (msg, ctx) => {
    const event = extractEvent(msg)
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
    // 支持两种数据路径：userMsg.content 和 userMsg.message.content
    const contentArray = userMsg?.content || userMsg?.message?.content
    if (contentArray && Array.isArray(contentArray)) {
      contentArray.forEach((item: any) => {
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
  handle: async (msg, ctx) => {
    // 检查错误码 12001（额度不足）
    const errorCode = (msg as any).code
    const errorMessage = typeof msg.message === 'string' ? msg.message : (msg.message as any)?.message || 'Unknown error'
    
    if (errorCode === 12001) {
      // 额度不足，显示确认对话框并跳转到定价页面
      const { confirm } = await import('@/lib/confirm')
      const actionContext = ctx.refs.actionContext.value
      
      if (actionContext) {
        // 使用国际化文本
        const title = directTrans('chat', 'error.insufficientCredits.title') || 'Agent 额度不足'
        const content = directTrans('chat', 'error.insufficientCredits.content') || '您的 Agent 额度不足，请开通会员'
        const okText = directTrans('chat', 'error.insufficientCredits.okText') || '确定'
        
        confirm({
          title,
          content,
          okText,
          cancelText: undefined, // 不显示取消按钮
          onOk: () => {
            actionContext.router.push(`/${actionContext.lng}/pricing`)
          },
        })
      } else {
        // 如果没有 actionContext，使用 window.location 跳转
        const lng = window.location.pathname.split('/')[1] || 'zh-CN'
        window.location.href = `/${lng}/pricing`
      }
    } else {
      // 其他错误：创建一个 assistant 消息，显示为错误卡片（不显示文本）
      if (errorMessage) {
        const assistantMessage = {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: '',
          status: 'done',
          createdAt: Date.now(),
          actions: [
            {
              type: 'errorOnly',
              title: '生成失败',
              description: errorMessage,
            },
          ],
        }
        ctx.set((state: any) => ({
          messages: [...state.messages, assistantMessage],
        }))
      }
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

