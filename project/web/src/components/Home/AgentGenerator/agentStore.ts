/**
 * AgentGenerator - 局部 Store
 * AI Agent 内容生成组件的状态管理
 */

import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'
import { MediaType } from '@/api/agent'
import type {
  IAgentStoreState,
  IUploadedMedia,
  IMessageItem,
  ITaskData,
  IActionContext,
} from './agentStore.types'
import { ActionRegistry } from './actionHandlers'

// ============ 初始状态 ============

const initialState: IAgentStoreState = {
  // 会话状态
  taskId: '',
  sessionId: '',
  prompt: '',

  // 生成状态
  isGenerating: false,
  progress: 0,
  streamingText: '',

  // 媒体状态
  uploadedImages: [],
  isUploading: false,

  // 消息状态
  completedMessages: [],
  pendingMessages: [],
  currentTypingMsg: null,
  displayedText: '',
  markdownMessages: [],

  // UI 状态
  selectedMode: 'agent',
  currentCost: 0,
  showFixedInput: false,
}

function getInitialState(): IAgentStoreState {
  return lodash.cloneDeep(initialState)
}

// ============ 状态配置 ============

/** 状态显示配置 */
const STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  'THINKING': { text: 'thinking', color: '#a66ae4' },
  'WAITING': { text: 'waiting', color: '#b78ae9' },
  'GENERATING_CONTENT': { text: 'generatingContent', color: '#a66ae4' },
  'GENERATING_IMAGE': { text: 'generatingImage', color: '#8b4fd9' },
  'GENERATING_VIDEO': { text: 'generatingVideo', color: '#9558de' },
  'GENERATING_TEXT': { text: 'generatingText', color: '#a66ae4' },
  'COMPLETED': { text: 'completed', color: '#52c41a' },
  'FAILED': { text: 'failed', color: '#ff4d4f' },
  'CANCELLED': { text: 'cancelled', color: '#8c8c8c' },
}

/** 基础进度配置 */
const BASE_PROGRESS: Record<string, number> = {
  'THINKING': 10,
  'WAITING': 20,
  'GENERATING_CONTENT': 30,
  'GENERATING_TEXT': 40,
  'GENERATING_IMAGE': 50,
  'GENERATING_VIDEO': 60,
  'COMPLETED': 100,
}

/** 生成中的状态列表 */
const GENERATING_STATUSES = ['GENERATING_CONTENT', 'GENERATING_IMAGE', 'GENERATING_VIDEO', 'GENERATING_TEXT']

// ============ Store 定义 ============

export const useAgentStore = create(
  combine(
    getInitialState(),
    (set, get) => {
      // 内部引用，用于流式文本（避免闭包问题）
      let streamingTextRef = ''
      // SSE 连接的 abort 函数
      let sseAbortRef: (() => void) | null = null

      const methods = {
        // ============ 基础 Setters ============
        
        setTaskId(taskId: string) {
          set({ taskId })
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('aiAgentTaskId', taskId)
          }
        },

        setSessionId(sessionId: string) {
          set({ sessionId })
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('aiAgentSessionId', sessionId)
          }
        },

        setPrompt(prompt: string) {
          set({ prompt })
        },

        setIsGenerating(isGenerating: boolean) {
          set({ isGenerating })
        },

        setProgress(progress: number) {
          set({ progress })
        },

        setSelectedMode(selectedMode: IAgentStoreState['selectedMode']) {
          set({ selectedMode })
        },

        setShowFixedInput(showFixedInput: boolean) {
          set({ showFixedInput })
        },

        setUploadedImages(uploadedImages: IUploadedMedia[]) {
          set({ uploadedImages })
        },

        setIsUploading(isUploading: boolean) {
          set({ isUploading })
        },

        setMarkdownMessages(markdownMessages: string[]) {
          set({ markdownMessages })
        },

        setCurrentCost(currentCost: number) {
          set({ currentCost })
        },

        // ============ 消息队列管理 ============

        /** 添加消息到队列 */
        addMessageToQueue(msg: IMessageItem) {
          set(state => ({
            pendingMessages: [...state.pendingMessages, msg],
          }))
        },

        /** 处理消息队列（打字机效果） */
        processMessageQueue() {
          const { currentTypingMsg, pendingMessages } = get()
          
          if (!currentTypingMsg && pendingMessages.length > 0) {
            const nextMsg = pendingMessages[0]
            set({
              currentTypingMsg: nextMsg,
              displayedText: '',
              pendingMessages: pendingMessages.slice(1),
            })
          }
        },

        /** 更新打字机效果 */
        updateTypingEffect() {
          const { currentTypingMsg, displayedText } = get()
          
          if (currentTypingMsg && displayedText.length < currentTypingMsg.content.length) {
            set({
              displayedText: currentTypingMsg.content.slice(0, displayedText.length + 1),
            })
            return true // 继续打字
          } else if (currentTypingMsg && displayedText.length >= currentTypingMsg.content.length) {
            // 当前消息完成
            set(state => ({
              completedMessages: [...state.completedMessages, currentTypingMsg!],
              currentTypingMsg: null,
              displayedText: '',
            }))
            return false // 打字完成
          }
          return false
        },

        // ============ 媒体管理 ============

        /** 添加上传的媒体 */
        addUploadedMedia(media: IUploadedMedia) {
          set(state => ({
            uploadedImages: [...state.uploadedImages, media],
          }))
        },

        /** 移除上传的媒体 */
        removeUploadedMedia(index: number) {
          set(state => ({
            uploadedImages: state.uploadedImages.filter((_, i) => i !== index),
          }))
        },

        /** 清空上传的媒体 */
        clearUploadedMedia() {
          set({ uploadedImages: [] })
        },

        // ============ 进度计算 ============

        /** 计算进度 */
        calculateProgress(status: string, isNewStatus: boolean): number {
          const currentProgress = get().progress
          
          if (GENERATING_STATUSES.includes(status) && !isNewStatus) {
            // 增加 5%，但不超过 99%
            return Math.min(currentProgress + 5, 99)
          }

          if (isNewStatus) {
            const targetProgress = BASE_PROGRESS[status]
            if (targetProgress !== undefined) {
              return Math.max(currentProgress, targetProgress)
            }
          }

          return currentProgress
        },

        /** 获取状态配置 */
        getStatusConfig(status: string) {
          return STATUS_CONFIG[status] || { text: status, color: '#333' }
        },

        // ============ 会话管理 ============

        /** 从 sessionStorage 恢复会话 */
        restoreSession() {
          if (typeof window !== 'undefined') {
            const taskId = sessionStorage.getItem('aiAgentTaskId') || ''
            const sessionId = sessionStorage.getItem('aiAgentSessionId') || ''
            set({ taskId, sessionId })
          }
        },

        /** 清除会话 */
        clearSession() {
          set({
            taskId: '',
            sessionId: '',
          })
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('aiAgentTaskId')
            sessionStorage.removeItem('aiAgentSessionId')
          }
        },

        /** 开始新对话 */
        newConversation(t: (key: string) => string) {
          if (get().isGenerating) {
            toast.warning(t('aiGeneration.generatingWarning' as any))
            return
          }

          methods.clearSession()
          set({
            markdownMessages: [],
            streamingText: '',
            prompt: '',
          })
          streamingTextRef = ''
          toast.success(t('aiGeneration.newConversation' as any))
        },

        /** 停止任务 */
        stopTask(t: (key: string) => string) {
          if (sseAbortRef) {
            console.log('[AgentStore] Aborting SSE connection')
            sseAbortRef()
            sseAbortRef = null
          }

          set({
            isGenerating: false,
            progress: 0,
          })

          methods.addMessageToQueue({
            type: 'status',
            content: t('aiGeneration.status.cancelled' as any),
            status: 'CANCELLED',
          })

          toast.info(t('aiGeneration.taskStopped' as any))
        },

        /** 重置状态 */
        reset() {
          if (sseAbortRef) {
            sseAbortRef()
            sseAbortRef = null
          }
          streamingTextRef = ''
          set(getInitialState())
        },

        // ============ 核心方法：创建任务 ============

        /**
         * 创建 AI 生成任务
         * @param t 翻译函数
         * @param actionContext Action 上下文（用于处理结果）
         * @param onLoginRequired 需要登录时的回调
         */
        async createTask(
          t: (key: string) => string,
          actionContext: IActionContext,
          onLoginRequired?: () => void,
        ) {
          const { prompt, uploadedImages, taskId } = get()

          if (!prompt.trim()) {
            return
          }

          // 检查登录状态
          const currentToken = useUserStore.getState().token
          if (!currentToken) {
            onLoginRequired?.()
            return
          }

          try {
            set({
              isGenerating: true,
              completedMessages: [],
              pendingMessages: [],
              currentTypingMsg: null,
              displayedText: '',
              progress: 0,
            })

            // 判断是否是新对话
            const isNewConversation = !taskId
            if (isNewConversation) {
              set({ markdownMessages: [] })
              methods.clearSession()
            }

            set({ streamingText: '' })
            streamingTextRef = ''

            // 添加思考状态
            methods.addMessageToQueue({
              type: 'status',
              content: t('aiGeneration.thinking' as any),
              status: 'THINKING',
            })

            // 添加用户消息
            methods.addMessageToQueue({
              type: 'text',
              content: `📝 ${t('aiGeneration.topicPrefix' as any)}${prompt}`,
            })

            // 添加到对话历史
            set(state => ({
              markdownMessages: [...state.markdownMessages, `👤 ${prompt}`],
            }))

            // 保存当前输入
            const currentPrompt = prompt
            const currentFiles = [...uploadedImages]

            // 清空输入
            set({
              prompt: '',
              uploadedImages: [],
              currentCost: 0,
              progress: 10,
            })

            // 构建完整提示词
            let fullPrompt = currentPrompt
            if (currentFiles.length > 0) {
              const fileLinks = currentFiles.map(f => `[${f.type}]: ${f.url}`).join('\n ')
              fullPrompt = `${currentPrompt}\n\n${fileLinks}`
            }

            // 动态导入 API
            const { agentApi } = await import('@/api/agent')

            // 构建请求参数
            const requestParams: any = {
              prompt: fullPrompt,
              includePartialMessages: true,
            }

            if (taskId) {
              requestParams.taskId = taskId
              console.log('[AgentStore] Continuing conversation with taskId:', taskId)
            } else {
              console.log('[AgentStore] Creating new conversation')
            }

            // 创建任务（SSE）
            const abortFn = await agentApi.createTaskWithSSE(
              requestParams,
              // onMessage
              (sseMessage: any) => {
                console.log('[AgentStore] SSE Message:', sseMessage)
                methods.handleSSEMessage(sseMessage, t, actionContext)
              },
              // onError
              (error) => {
                console.error('[AgentStore] SSE Error:', error)
                toast.error(`${t('aiGeneration.createTaskFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
                set({ isGenerating: false, progress: 0 })
              },
              // onDone
              async () => {
                console.log('[AgentStore] SSE Done')
                set({ isGenerating: false })
                sseAbortRef = null
              }
            )

            sseAbortRef = abortFn
          } catch (error: any) {
            console.error('[AgentStore] Create task error:', error)
            toast.error(`${t('aiGeneration.createTaskFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
            set({ isGenerating: false, progress: 0 })
            sseAbortRef = null
          }
        },

        /** 处理 SSE 消息 */
        handleSSEMessage(
          sseMessage: any, 
          t: (key: string) => string,
          actionContext: IActionContext,
        ) {
          // 处理 init 消息
          if (sseMessage.type === 'init' && sseMessage.taskId) {
            const receivedTaskId = sseMessage.taskId
            methods.setTaskId(receivedTaskId)
            methods.setSessionId(receivedTaskId)
            streamingTextRef = ''
            set({ streamingText: '' })
            return
          }

          // 处理 keep_alive
          if (sseMessage.type === 'keep_alive') {
            return
          }

          // 处理流式事件
          if (sseMessage.type === 'stream_event' && sseMessage.message) {
            const streamEvent = sseMessage.message as any
            const event = streamEvent.event

            if (event.type === 'content_block_delta' && event.delta) {
              if (event.delta.type === 'text_delta' && event.delta.text) {
                streamingTextRef += event.delta.text
                set({ streamingText: streamingTextRef })

                // 更新 markdown 消息
                set(state => {
                  const newMessages = [...state.markdownMessages]
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('🤖 ')) {
                    newMessages[newMessages.length - 1] = `🤖 ${streamingTextRef}`
                  } else {
                    newMessages.push(`🤖 ${streamingTextRef}`)
                  }
                  return { markdownMessages: newMessages }
                })
              }
            }
            return
          }

          // 保存 sessionId
          if (sseMessage.sessionId) {
            methods.setSessionId(sseMessage.sessionId)
          }

          // 处理 text 消息
          if (sseMessage.type === 'text' && sseMessage.message) {
            set(state => ({
              markdownMessages: [...state.markdownMessages, sseMessage.message!],
            }))
          }

          // 处理 error 消息
          if (sseMessage.type === 'error' && sseMessage.message) {
            const errorMsg = `❌ : ${sseMessage.message || t('aiGeneration.unknownError' as any)}`
            set(state => ({
              markdownMessages: [...state.markdownMessages, errorMsg],
            }))
          }

          // 处理 result 消息
          if (sseMessage.type === 'result' && sseMessage.message) {
            methods.handleResult(sseMessage.message, t, actionContext)
          }

          // 处理 status 消息
          if (sseMessage.type === 'status' && sseMessage.status) {
            const statusConfig = methods.getStatusConfig(sseMessage.status)
            const needsLoadingAnimation = GENERATING_STATUSES.includes(sseMessage.status)

            methods.addMessageToQueue({
              type: 'status',
              content: t(`aiGeneration.status.${statusConfig.text}` as any),
              status: sseMessage.status,
              loading: needsLoadingAnimation,
            })

            const newProgress = methods.calculateProgress(sseMessage.status, true)
            set({ progress: newProgress })
          }

          // 处理 error 状态
          if (sseMessage.type === 'error') {
            setTimeout(() => {
              set({ isGenerating: false })
            }, 100)
            set({ progress: 0 })
          }
        },

        /** 处理任务结果 */
        handleResult(
          resultMsg: any,
          t: (key: string) => string,
          actionContext: IActionContext,
        ) {
          // 保存消费
          if (resultMsg.total_cost_usd !== undefined) {
            set({ currentCost: resultMsg.total_cost_usd })
          }

          // 显示结果消息
          if (resultMsg.message) {
            set(state => ({
              markdownMessages: [...state.markdownMessages, resultMsg.message],
            }))
          }

          // 添加完成状态
          methods.addMessageToQueue({
            type: 'status',
            content: t('aiGeneration.status.completed' as any),
            status: 'COMPLETED',
          })

          set({
            progress: 100,
            isGenerating: false,
          })

          // 处理结果
          if (resultMsg.result) {
            const resultArray: ITaskData[] = Array.isArray(resultMsg.result) 
              ? resultMsg.result 
              : [resultMsg.result]

            if (resultArray.length === 0) {
              console.log('[AgentStore] No valid result data found')
              return
            }

            console.log('[AgentStore] Processing results, count:', resultArray.length)

            // 使用 ActionRegistry 处理
            ActionRegistry.executeBatch(resultArray, actionContext)
          }
        },

        // ============ 媒体上传 ============

        /**
         * 上传媒体文件
         * @param files 文件列表
         * @param t 翻译函数
         */
        async uploadMedia(files: FileList | File[], t: (key: string) => string) {
          if (!files || files.length === 0) return

          set({ isUploading: true })

          try {
            const { uploadToOss } = await import('@/api/oss')
            const { OSS_URL } = await import('@/constant')

            const uploadPromises = Array.from(files).map(async (file) => {
              const ossKey = await uploadToOss(file)
              const ossUrl = `${OSS_URL}${ossKey}`
              const fileType = file.type.startsWith('video/') ? 'video' : 'image'
              return { url: ossUrl, type: fileType as 'image' | 'video' }
            })

            const uploadedFiles = await Promise.all(uploadPromises)

            set(state => ({
              uploadedImages: [...state.uploadedImages, ...uploadedFiles],
            }))

            toast.success(t('aiGeneration.uploadSuccess' as any))
          } catch (error) {
            console.error('[AgentStore] File upload failed:', error)
            toast.error(t('aiGeneration.uploadFailed' as any))
          } finally {
            set({ isUploading: false })
          }
        },

        /** 应用提示词（从外部传入） */
        applyPrompt(promptData: { prompt: string; image?: string } | null) {
          if (!promptData) return

          set({ prompt: promptData.prompt })

          if (promptData.image) {
            set(state => ({
              uploadedImages: [...state.uploadedImages, { url: promptData.image!, type: 'image' }],
            }))
          }
        },
      }

      return methods
    },
  ),
)

export default useAgentStore

