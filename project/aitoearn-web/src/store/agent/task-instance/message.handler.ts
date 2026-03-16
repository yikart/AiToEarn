/**
 * TaskInstance - 消息处理模块
 * 处理消息的创建、更新和状态管理
 */

import type { IActionCard, IDisplayMessage, IPublishFlowData, IUploadedMedia } from '../agent.types'
import type { IMessageHandlerContext } from './task-instance.types'

// ============ 消息创建 ============

/**
 * 创建用户消息
 */
export function createUserMessage(content: string, medias?: IUploadedMedia[]): IDisplayMessage {
  return {
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    medias: medias?.filter(m => m.url && !m.progress),
    status: 'done',
    createdAt: Date.now(),
  }
}

/**
 * 创建 assistant 消息
 * @param ctx 消息上下文
 * @returns 新创建的 assistant 消息
 */
export function createAssistantMessage(ctx: IMessageHandlerContext): IDisplayMessage {
  const messageId = `assistant-${Date.now()}`
  ctx.setCurrentAssistantMessageId(messageId)
  console.log(
    `[MessageHandler] Created assistant message: ${messageId} for task: ${ctx.getTaskId()}`,
  )

  return {
    id: messageId,
    role: 'assistant',
    content: '',
    status: 'pending',
    createdAt: Date.now(),
  }
}

/**
 * 添加消息到列表
 */
export function addMessage(ctx: IMessageHandlerContext, message: IDisplayMessage): void {
  ctx.updateData(data => ({
    messages: [...data.messages, message],
  }))
}

/**
 * 设置消息列表（用于加载历史消息）
 */
export function setMessages(ctx: IMessageHandlerContext, messages: IDisplayMessage[]): void {
  ctx.updateData(() => ({
    messages,
  }))
}

// ============ 消息状态更新 ============

/**
 * 标记当前 assistant 消息为完成
 */
export function markMessageDone(ctx: IMessageHandlerContext): void {
  const currentId = ctx.getCurrentAssistantMessageId()
  ctx.updateData(data => ({
    messages: data.messages.map(m => (m.id === currentId ? { ...m, status: 'done' } : m)),
    isGenerating: false,
  }))
}

/**
 * 标记当前 assistant 消息为错误
 */
export function markMessageError(ctx: IMessageHandlerContext, errorMessage: string): void {
  const currentId = ctx.getCurrentAssistantMessageId()
  ctx.updateData(data => ({
    messages: data.messages.map(m =>
      m.id === currentId ? { ...m, status: 'error', errorMessage } : m,
    ),
    isGenerating: false,
  }))
}

/**
 * 更新当前 assistant 消息内容
 */
export function updateMessageContent(ctx: IMessageHandlerContext, content: string): void {
  const currentId = ctx.getCurrentAssistantMessageId()
  ctx.updateData(data => ({
    messages: data.messages.map((m) => {
      if (m.id === currentId) {
        // 同时更新 content 和最后一个 step 的内容（如果存在）
        // 只有当 content 不为空时才更新 steps 中的内容，避免被截断
        const updatedSteps
          = m.steps && m.steps.length > 0
            ? m.steps.map((step, index) => {
                if (index === m.steps!.length - 1) {
                  return {
                    ...step,
                    content: content || step.content,
                    isActive: false,
                  }
                }
                return step
              })
            : undefined
        return {
          ...m,
          // 如果传入的 content 为空，保留原有内容，避免被截断
          content: content || m.content,
          status: 'done' as const,
          ...(updatedSteps ? { steps: updatedSteps } : {}),
        }
      }
      return m
    }),
  }))
}

/**
 * 更新当前 assistant 消息的 actions
 */
export function updateMessageActions(ctx: IMessageHandlerContext, actions: IActionCard[]): void {
  const currentId = ctx.getCurrentAssistantMessageId()
  ctx.updateData(data => ({
    messages: data.messages.map(m =>
      m.id === currentId ? { ...m, actions, status: 'done' as const } : m,
    ),
  }))
}

/**
 * 更新当前 assistant 消息内容和 actions
 */
export function updateMessageWithActions(
  ctx: IMessageHandlerContext,
  content: string,
  actions: IActionCard[],
): void {
  const currentId = ctx.getCurrentAssistantMessageId()
  ctx.updateData(data => ({
    messages: data.messages.map((m) => {
      if (m.id === currentId) {
        // 只有当 content 不为空时才更新 steps 中的内容，避免被截断
        const updatedSteps
          = m.steps && m.steps.length > 0
            ? m.steps.map((step, index) => {
                if (index === m.steps!.length - 1) {
                  return {
                    ...step,
                    content: content || step.content,
                    isActive: false,
                  }
                }
                return step
              })
            : undefined
        return {
          ...m,
          // 如果传入的 content 为空，保留原有内容，避免被截断
          content: content || m.content,
          status: 'done' as const,
          actions,
          ...(updatedSteps ? { steps: updatedSteps } : {}),
        }
      }
      return m
    }),
  }))
}

/**
 * 更新当前 assistant 消息内容，并将 medias 附加到最后一个 step
 */
export function updateMessageContentWithMedias(
  ctx: IMessageHandlerContext,
  content: string,
  medias?: Array<{ type: string, url: string, thumbUrl?: string }>,
): void {
  const currentId = ctx.getCurrentAssistantMessageId()
  ctx.updateData(data => ({
    messages: data.messages.map((m) => {
      if (m.id === currentId) {
        // 转换 medias 格式
        const convertedMedias = medias?.map(media => ({
          url: media.url || media.thumbUrl || '',
          type: media.type === 'VIDEO' ? ('video' as const) : ('image' as const),
        }))

        // 更新 steps，将 medias 附加到最后一个 step
        // 只有当 content 不为空时才更新 steps 中的内容，避免被截断
        const updatedSteps
          = m.steps && m.steps.length > 0
            ? m.steps.map((step, index) => {
                if (index === m.steps!.length - 1) {
                  return {
                    ...step,
                    content: content || step.content,
                    isActive: false,
                    ...(convertedMedias && convertedMedias.length > 0
                      ? { medias: convertedMedias }
                      : {}),
                  }
                }
                return step
              })
            : undefined

        return {
          ...m,
          // 如果传入的 content 为空，保留原有内容，避免被截断
          content: content || m.content,
          status: 'done' as const,
          ...(updatedSteps ? { steps: updatedSteps } : {}),
        }
      }
      return m
    }),
  }))
}

/**
 * 更新当前 assistant 消息的发布流程数据
 */
export function updateMessageWithPublishFlows(
  ctx: IMessageHandlerContext,
  publishFlows: IPublishFlowData[],
): void {
  const currentId = ctx.getCurrentAssistantMessageId()
  ctx.updateData(data => ({
    messages: data.messages.map(m =>
      m.id === currentId ? { ...m, publishFlows, status: 'done' as const } : m,
    ),
  }))
}

/**
 * 更新当前 assistant 消息内容、actions 和发布流程数据
 */
export function updateMessageWithActionsAndPublishFlows(
  ctx: IMessageHandlerContext,
  content: string,
  actions: IActionCard[],
  publishFlows: IPublishFlowData[],
): void {
  const currentId = ctx.getCurrentAssistantMessageId()
  ctx.updateData(data => ({
    messages: data.messages.map((m) => {
      if (m.id === currentId) {
        // 只有当 content 不为空时才更新 steps 中的内容，避免被截断
        const updatedSteps
          = m.steps && m.steps.length > 0
            ? m.steps.map((step, index) => {
                if (index === m.steps!.length - 1) {
                  return {
                    ...step,
                    content: content || step.content,
                    isActive: false,
                  }
                }
                return step
              })
            : undefined
        return {
          ...m,
          // 如果传入的 content 为空，保留原有内容，避免被截断
          content: content || m.content,
          status: 'done' as const,
          actions: actions.length > 0 ? actions : m.actions,
          publishFlows: publishFlows.length > 0 ? publishFlows : m.publishFlows,
          ...(updatedSteps ? { steps: updatedSteps } : {}),
        }
      }
      return m
    }),
  }))
}

// ============ Markdown 消息 ============

/**
 * 添加到 markdown 消息历史
 */
export function addMarkdownMessage(ctx: IMessageHandlerContext, message: string): void {
  ctx.updateData(data => ({
    markdownMessages: [...data.markdownMessages, message],
  }))
}

/**
 * 更新最后一条 markdown 消息
 */
export function updateLastMarkdownMessage(ctx: IMessageHandlerContext, message: string): void {
  ctx.updateData((data) => {
    const newMessages = [...data.markdownMessages]
    if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('🤖 ')) {
      newMessages[newMessages.length - 1] = message
    }
    else {
      newMessages.push(message)
    }
    return { markdownMessages: newMessages }
  })
}
