/**
 * Agent Store - 消息工具
 * 消息创建和状态管理工具（支持按任务ID隔离）
 */

import type {
  IActionCard,
  IAgentState,
  IDisplayMessage,
  IPublishFlowData,
  ITaskMessageData,
  IUploadedMedia,
} from '../agent.types'
import type { IAgentRefs } from './refs'
import { getDefaultTaskData } from '../agent.state'

/** 消息工具上下文 */
export interface IMessageContext {
  refs: IAgentRefs
  set: (partial: Partial<IAgentState> | ((state: IAgentState) => Partial<IAgentState>)) => void
  get: () => IAgentState
}

/**
 * 创建消息工具方法
 */
export function createMessageUtils(ctx: IMessageContext) {
  const { refs, set, get } = ctx

  /**
   * 获取当前任务ID
   */
  function getCurrentTaskId(): string {
    return get().currentTaskId
  }

  /**
   * 获取当前任务数据
   */
  function getCurrentTaskData(): ITaskMessageData {
    const state = get()
    const taskId = state.currentTaskId
    return state.taskMessages[taskId] || getDefaultTaskData()
  }

  /**
   * 更新当前任务的消息数据
   * @param updater 更新函数
   * @param targetTaskId 可选的目标任务ID，不传则使用当前任务ID
   */
  function updateCurrentTaskData(
    updater: (data: ITaskMessageData) => Partial<ITaskMessageData>,
    targetTaskId?: string,
  ) {
    const taskId = targetTaskId || getCurrentTaskId()
    if (!taskId) {
      console.warn('[MessageUtils] No taskId set, cannot update task data')
      return
    }
    set((state) => {
      const currentData = state.taskMessages[taskId] || getDefaultTaskData()
      const updates = updater(currentData)
      return {
        taskMessages: {
          ...state.taskMessages,
          [taskId]: {
            ...currentData,
            ...updates,
            lastUpdated: Date.now(),
          },
        },
      }
    })
  }

  return {
    /**
     * 创建用户消息
     */
    createUserMessage(content: string, medias?: IUploadedMedia[]): IDisplayMessage {
      return {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        medias: medias?.filter(m => m.url && !m.progress),
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
     * @param targetTaskId 可选的目标任务ID
     */
    markMessageDone(targetTaskId?: string) {
      updateCurrentTaskData(
        data => ({
          messages: data.messages.map(m =>
            m.id === refs.currentAssistantMessageId.value ? { ...m, status: 'done' } : m,
          ),
          isGenerating: false,
        }),
        targetTaskId,
      )
    },

    /**
     * 标记当前 assistant 消息为错误
     * @param errorMessage 错误消息
     * @param targetTaskId 可选的目标任务ID
     */
    markMessageError(errorMessage: string, targetTaskId?: string) {
      updateCurrentTaskData(
        data => ({
          messages: data.messages.map(m =>
            m.id === refs.currentAssistantMessageId.value
              ? { ...m, status: 'error', errorMessage }
              : m,
          ),
        }),
        targetTaskId,
      )
    },

    /**
     * 更新当前 assistant 消息内容
     * @param content 消息内容
     * @param targetTaskId 可选的目标任务ID
     */
    updateMessageContent(content: string, targetTaskId?: string) {
      updateCurrentTaskData(
        data => ({
          messages: data.messages.map((m) => {
            if (m.id === refs.currentAssistantMessageId.value) {
              // 同时更新 content 和最后一个 step 的内容（如果存在）
              // 这样确保 steps 和 content 保持同步
              const updatedSteps
                = m.steps && m.steps.length > 0
                  ? m.steps.map((step, index) => {
                      // 只更新最后一个 step（当前活跃的 step）
                      if (index === m.steps!.length - 1) {
                        return { ...step, content, isActive: false }
                      }
                      return step
                    })
                  : undefined
              return {
                ...m,
                content,
                status: 'done' as const,
                ...(updatedSteps ? { steps: updatedSteps } : {}),
              }
            }
            return m
          }),
        }),
        targetTaskId,
      )
    },

    /**
     * 更新当前 assistant 消息的 actions（同时标记为完成）
     * @param actions 动作卡片列表
     * @param targetTaskId 可选的目标任务ID
     */
    updateMessageActions(actions: IActionCard[], targetTaskId?: string) {
      updateCurrentTaskData(
        data => ({
          messages: data.messages.map(m =>
            m.id === refs.currentAssistantMessageId.value
              ? { ...m, actions, status: 'done' as const }
              : m,
          ),
        }),
        targetTaskId,
      )
    },

    /**
     * 更新当前 assistant 消息内容和 actions
     */
    updateMessageWithActions(content: string, actions: IActionCard[]) {
      updateCurrentTaskData(data => ({
        messages: data.messages.map((m) => {
          if (m.id === refs.currentAssistantMessageId.value) {
            // 同时更新 content 和最后一个 step 的内容（如果存在）
            const updatedSteps
              = m.steps && m.steps.length > 0
                ? m.steps.map((step, index) => {
                    if (index === m.steps!.length - 1) {
                      return { ...step, content, isActive: false }
                    }
                    return step
                  })
                : undefined
            return {
              ...m,
              content,
              status: 'done' as const,
              actions,
              ...(updatedSteps ? { steps: updatedSteps } : {}),
            }
          }
          return m
        }),
      }))
    },

    /**
     * 更新当前 assistant 消息内容，并将 medias 附加到最后一个 step
     * 用于 SSE result 消息处理，确保视频/图片等媒体能正确显示
     */
    updateMessageContentWithMedias(
      content: string,
      medias?: Array<{ type: string, url: string, thumbUrl?: string }>,
    ) {
      updateCurrentTaskData(data => ({
        messages: data.messages.map((m) => {
          if (m.id === refs.currentAssistantMessageId.value) {
            // 转换 medias 格式
            const convertedMedias = medias?.map(media => ({
              url: media.url || media.thumbUrl || '',
              type: media.type === 'VIDEO' ? ('video' as const) : ('image' as const),
            }))

            // 更新 steps，将 medias 附加到最后一个 step
            const updatedSteps
              = m.steps && m.steps.length > 0
                ? m.steps.map((step, index) => {
                    if (index === m.steps!.length - 1) {
                      return {
                        ...step,
                        content,
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
              content,
              status: 'done' as const,
              ...(updatedSteps ? { steps: updatedSteps } : {}),
            }
          }
          return m
        }),
      }))
    },

    /**
     * 添加消息到列表
     * @param message 要添加的消息
     * @param targetTaskId 可选的目标任务ID，不传则使用当前任务ID
     */
    addMessage(message: IDisplayMessage, targetTaskId?: string) {
      const taskId = targetTaskId || getCurrentTaskId()
      if (!taskId) {
        console.warn('[MessageUtils] No taskId for addMessage, skipping')
        return
      }
      set((state) => {
        const currentData = state.taskMessages[taskId] || getDefaultTaskData()
        return {
          taskMessages: {
            ...state.taskMessages,
            [taskId]: {
              ...currentData,
              messages: [...currentData.messages, message],
              lastUpdated: Date.now(),
            },
          },
        }
      })
    },

    /**
     * 设置消息列表（用于加载历史消息到指定任务）
     */
    setMessages(messages: IDisplayMessage[], taskId?: string) {
      const targetTaskId = taskId || getCurrentTaskId()
      if (!targetTaskId) {
        console.warn('[MessageUtils] No taskId provided for setMessages')
        return
      }
      set((state) => {
        const currentData = state.taskMessages[targetTaskId] || getDefaultTaskData()
        return {
          taskMessages: {
            ...state.taskMessages,
            [targetTaskId]: {
              ...currentData,
              messages,
              lastUpdated: Date.now(),
            },
          },
        }
      })
    },

    /**
     * 添加到 markdown 消息历史
     */
    addMarkdownMessage(message: string) {
      updateCurrentTaskData(data => ({
        markdownMessages: [...data.markdownMessages, message],
      }))
    },

    /**
     * 更新最后一条 markdown 消息
     */
    updateLastMarkdownMessage(message: string) {
      updateCurrentTaskData((data) => {
        const newMessages = [...data.markdownMessages]
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('🤖 ')) {
          newMessages[newMessages.length - 1] = message
        }
        else {
          newMessages.push(message)
        }
        return { markdownMessages: newMessages }
      })
    },

    /**
     * 更新当前 assistant 消息的发布流程数据
     * 用于在消息中显示 PublishDetailCard
     */
    updateMessageWithPublishFlows(publishFlows: IPublishFlowData[]) {
      updateCurrentTaskData(data => ({
        messages: data.messages.map(m =>
          m.id === refs.currentAssistantMessageId.value
            ? { ...m, publishFlows, status: 'done' as const }
            : m,
        ),
      }))
    },

    /**
     * 更新当前 assistant 消息内容、actions 和发布流程数据
     */
    updateMessageWithActionsAndPublishFlows(
      content: string,
      actions: IActionCard[],
      publishFlows: IPublishFlowData[],
    ) {
      updateCurrentTaskData(data => ({
        messages: data.messages.map((m) => {
          if (m.id === refs.currentAssistantMessageId.value) {
            const updatedSteps
              = m.steps && m.steps.length > 0
                ? m.steps.map((step, index) => {
                    if (index === m.steps!.length - 1) {
                      return { ...step, content, isActive: false }
                    }
                    return step
                  })
                : undefined
            return {
              ...m,
              content,
              status: 'done' as const,
              actions: actions.length > 0 ? actions : m.actions,
              publishFlows: publishFlows.length > 0 ? publishFlows : m.publishFlows,
              ...(updatedSteps ? { steps: updatedSteps } : {}),
            }
          }
          return m
        }),
      }))
    },

    /**
     * 获取当前任务数据（暴露给外部使用）
     */
    getCurrentTaskData,

    /**
     * 更新当前任务数据（暴露给外部使用）
     */
    updateCurrentTaskData,
  }
}

export type MessageUtils = ReturnType<typeof createMessageUtils>
