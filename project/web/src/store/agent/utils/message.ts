/**
 * Agent Store - 消息工具
 * 消息创建和状态管理工具
 */

import type { IDisplayMessage, IUploadedMedia, IActionCard } from '../agent.types'
import type { IAgentRefs } from './refs'

/** 消息工具上下文 */
export interface IMessageContext {
  refs: IAgentRefs
  set: (partial: any) => void
  get: () => any
}

/**
 * 创建消息工具方法
 */
export function createMessageUtils(ctx: IMessageContext) {
  const { refs, set } = ctx

  return {
    /**
     * 创建用户消息
     */
    createUserMessage(content: string, medias?: IUploadedMedia[]): IDisplayMessage {
      return {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        medias: medias?.filter((m) => m.url && !m.progress),
        status: 'done',
        createdAt: Date.now(),
      }
    },

    /**
     * 创建 assistant 消息
     */
    createAssistantMessage(): IDisplayMessage {
      const messageId = `assistant-${Date.now()}`
      refs.currentAssistantMessageId.value = messageId

      return {
        id: messageId,
        role: 'assistant',
        content: '',
        status: 'pending',
        createdAt: Date.now(),
      }
    },

    /**
     * 标记当前 assistant 消息为完成
     */
    markMessageDone() {
      set((state: any) => ({
        messages: state.messages.map((m: any) =>
          m.id === refs.currentAssistantMessageId.value ? { ...m, status: 'done' } : m,
        ),
      }))
    },

    /**
     * 标记当前 assistant 消息为错误
     */
    markMessageError(errorMessage: string) {
      set((state: any) => ({
        messages: state.messages.map((m: any) =>
          m.id === refs.currentAssistantMessageId.value ? { ...m, status: 'error', errorMessage } : m,
        ),
      }))
    },

    /**
     * 更新当前 assistant 消息内容
     */
    updateMessageContent(content: string) {
      set((state: any) => ({
        messages: state.messages.map((m: any) =>
          m.id === refs.currentAssistantMessageId.value ? { ...m, content, status: 'done' } : m,
        ),
      }))
    },

    /**
     * 更新当前 assistant 消息的 actions
     */
    updateMessageActions(actions: IActionCard[]) {
      set((state: any) => ({
        messages: state.messages.map((m: any) =>
          m.id === refs.currentAssistantMessageId.value ? { ...m, actions } : m,
        ),
      }))
    },

    /**
     * 更新当前 assistant 消息内容和 actions
     */
    updateMessageWithActions(content: string, actions: IActionCard[]) {
      set((state: any) => ({
        messages: state.messages.map((m: any) =>
          m.id === refs.currentAssistantMessageId.value 
            ? { ...m, content, status: 'done', actions } 
            : m,
        ),
      }))
    },

    /**
     * 添加消息到列表
     */
    addMessage(message: IDisplayMessage) {
      set((state: any) => ({
        messages: [...state.messages, message],
      }))
    },

    /**
     * 设置消息列表（用于加载历史消息）
     */
    setMessages(messages: IDisplayMessage[]) {
      set({ messages })
    },

    /**
     * 添加到 markdown 消息历史
     */
    addMarkdownMessage(message: string) {
      set((state: any) => ({
        markdownMessages: [...state.markdownMessages, message],
      }))
    },

    /**
     * 更新最后一条 markdown 消息
     */
    updateLastMarkdownMessage(message: string) {
      set((state: any) => {
        const newMessages = [...state.markdownMessages]
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('🤖 ')) {
          newMessages[newMessages.length - 1] = message
        } else {
          newMessages.push(message)
        }
        return { markdownMessages: newMessages }
      })
    },
  }
}

export type MessageUtils = ReturnType<typeof createMessageUtils>

