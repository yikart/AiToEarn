/**
 * Agent Store - 全局 AI Agent 任务状态管理
 * 管理 SSE 连接、流式响应、消息状态等
 */

import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'
import { agentApi } from '@/api/agent'
import { STATUS_CONFIG, BASE_PROGRESS, GENERATING_STATUSES } from './agent.constants'
import type {
  IAgentState,
  IUploadedMedia,
  IDisplayMessage,
  ISSEMessage,
  ICreateTaskParams,
  IMessageStep,
  IWorkflowStep,
} from './agent.types'

// ============ 初始状态 ============

const initialState: IAgentState = {
  // 任务状态
  currentTaskId: '',
  isGenerating: false,
  progress: 0,

  // 流式响应状态
  streamingText: '',
  markdownMessages: [],
  workflowSteps: [],

  // 消息状态
  messages: [],

  // 消费状态
  currentCost: 0,
}

function getInitialState(): IAgentState {
  return lodash.cloneDeep(initialState)
}

// ============ Store 定义 ============

export const useAgentStore = create(
  combine(getInitialState(), (set, get) => {
    // 内部引用，用于流式文本（避免闭包问题）
    let streamingTextRef = ''
    // SSE 连接的 abort 函数
    let sseAbortRef: (() => void) | null = null
    // 翻译函数引用
    let tRef: ((key: string) => string) | null = null
    // 当前步骤的工作流步骤（临时存储，用于关联到步骤）
    let currentStepWorkflowRef: IWorkflowStep[] = []
    // 当前步骤索引
    let currentStepIndexRef = -1
    // 当前正在流式输出的 assistant 消息 ID（用于精确匹配）
    let currentAssistantMessageIdRef = ''

    const methods = {
      // ============ 基础 Getters ============

      /** 获取当前任务ID */
      getCurrentTaskId: () => get().currentTaskId,

      /** 检查是否为当前任务的实时模式 */
      isRealtimeMode: (taskId: string) => {
        const state = get()
        return state.currentTaskId === taskId && state.isGenerating
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

      // ============ 核心方法：创建任务 ============

      /**
       * 创建 AI 生成任务
       * @param params 创建任务参数
       * @returns 返回 taskId（如果成功）
       */
      async createTask(params: ICreateTaskParams): Promise<string | null> {
        const { prompt, medias = [], t, onTaskIdReady, onLoginRequired } = params

        if (!prompt.trim()) {
          return null
        }

        // 保存翻译函数引用
        tRef = t

        // 检查登录状态
        const currentToken = useUserStore.getState().token
        if (!currentToken) {
          onLoginRequired?.()
          return null
        }

        try {
          // 重置状态
          set({
            isGenerating: true,
            currentTaskId: '',
            progress: 0,
            streamingText: '',
            markdownMessages: [],
            workflowSteps: [],
            messages: [],
            currentCost: 0,
          })
          streamingTextRef = ''
          currentStepWorkflowRef = []
          currentStepIndexRef = -1

          // 添加用户消息到 messages
          const userMessage: IDisplayMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: prompt,
            medias: medias.filter((m) => m.url && !m.progress),
            status: 'done',
            createdAt: Date.now(),
          }
          set({ messages: [userMessage] })

          // 添加到 markdown 历史
          set((state) => ({
            markdownMessages: [...state.markdownMessages, `👤 ${prompt}`],
          }))

          // 构建完整提示词（包含媒体链接）
          let fullPrompt = prompt
          const validMedias = medias.filter((m) => m.url && !m.progress)
          if (validMedias.length > 0) {
            const fileLinks = validMedias.map((f) => `[${f.type}]: ${f.url}`).join('\n ')
            fullPrompt = `${prompt}\n\n${fileLinks}`
          }

          // 构建请求参数
          const requestParams = {
            prompt: fullPrompt,
            includePartialMessages: true,
          }

          console.log('[AgentStore] Creating new task with prompt:', prompt)

          // 添加 AI 待回复消息
          const assistantMessageId = `assistant-${Date.now()}`
          currentAssistantMessageIdRef = assistantMessageId
          const assistantMessage: IDisplayMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            status: 'pending',
            createdAt: Date.now(),
          }
          set((state) => ({
            messages: [...state.messages, assistantMessage],
          }))

          // 创建任务（SSE）
          const abortFn = await agentApi.createTaskWithSSE(
            requestParams,
            // onMessage
            (sseMessage: ISSEMessage) => {
              console.log('[AgentStore] SSE Message:', sseMessage)
              methods.handleSSEMessage(sseMessage, onTaskIdReady)
            },
            // onError
            (error) => {
              console.error('[AgentStore] SSE Error:', error)
              const errorMsg = tRef
                ? `${tRef('aiGeneration.createTaskFailed' as any)}: ${error.message || tRef('aiGeneration.unknownError' as any)}`
                : `Create task failed: ${error.message}`
              toast.error(errorMsg)
              set({ isGenerating: false, progress: 0 })

              // 标记消息为错误（使用 ID 精确匹配）
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === currentAssistantMessageIdRef
                    ? { ...m, status: 'error', errorMessage: error.message }
                    : m,
                ),
              }))
            },
            // onDone
            async () => {
              console.log('[AgentStore] SSE Done')
              set({ isGenerating: false, workflowSteps: [] })

              // 标记消息为完成（使用 ID 精确匹配）
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === currentAssistantMessageIdRef ? { ...m, status: 'done' } : m,
                ),
              }))

              sseAbortRef = null
            },
          )

          sseAbortRef = abortFn

          // 等待获取 taskId（最多等待 30 秒）
          let waitTime = 0
          const maxWaitTime = 30000
          const checkInterval = 100

          while (!get().currentTaskId && waitTime < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, checkInterval))
            waitTime += checkInterval
          }

          return get().currentTaskId || null
        } catch (error: any) {
          console.error('[AgentStore] Create task error:', error)
          const errorMsg = tRef
            ? `${tRef('aiGeneration.createTaskFailed' as any)}: ${error.message || tRef('aiGeneration.unknownError' as any)}`
            : `Create task failed: ${error.message}`
          toast.error(errorMsg)
          set({ isGenerating: false, progress: 0 })
          sseAbortRef = null
          return null
        }
      },

      /**
       * 继续对话（在详情页中使用）
       */
      async continueTask(params: ICreateTaskParams & { taskId: string }): Promise<void> {
        const { prompt, medias = [], t, taskId } = params

        if (!prompt.trim() || !taskId) {
          return
        }

        // 保存翻译函数引用
        tRef = t

        try {
          // 设置状态（清除上一轮的工作流步骤）
          set({
            isGenerating: true,
            currentTaskId: taskId,
            progress: 10,
            workflowSteps: [],
          })
          streamingTextRef = ''
          currentStepWorkflowRef = []
          currentStepIndexRef = -1

          // 添加用户消息
          const userMessage: IDisplayMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: prompt,
            medias: medias.filter((m) => m.url && !m.progress),
            status: 'done',
            createdAt: Date.now(),
          }
          set((state) => ({
            messages: [...state.messages, userMessage],
            markdownMessages: [...state.markdownMessages, `👤 ${prompt}`],
          }))

          // 构建完整提示词
          let fullPrompt = prompt
          const validMedias = medias.filter((m) => m.url && !m.progress)
          if (validMedias.length > 0) {
            const fileLinks = validMedias.map((f) => `[${f.type}]: ${f.url}`).join('\n ')
            fullPrompt = `${prompt}\n\n${fileLinks}`
          }

          // 添加 AI 待回复消息
          const assistantMessageId = `assistant-${Date.now()}`
          currentAssistantMessageIdRef = assistantMessageId
          const assistantMessage: IDisplayMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            status: 'pending',
            createdAt: Date.now(),
          }
          set((state) => ({
            messages: [...state.messages, assistantMessage],
          }))

          // 构建请求参数
          const requestParams = {
            prompt: fullPrompt,
            taskId,
            includePartialMessages: true,
          }

          console.log('[AgentStore] Continuing task:', taskId)

          // 创建任务（SSE）
          const abortFn = await agentApi.createTaskWithSSE(
            requestParams,
            // onMessage
            (sseMessage: ISSEMessage) => {
              console.log('[AgentStore] SSE Message:', sseMessage)
              methods.handleSSEMessage(sseMessage)
            },
            // onError
            (error) => {
              console.error('[AgentStore] SSE Error:', error)
              toast.error(error.message || 'Generation failed')
              set({ isGenerating: false, progress: 0 })

              // 标记消息为错误（使用 ID 精确匹配）
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === currentAssistantMessageIdRef
                    ? { ...m, status: 'error', errorMessage: error.message }
                    : m,
                ),
              }))
            },
            // onDone
            async () => {
              console.log('[AgentStore] SSE Done')
              set({ isGenerating: false, workflowSteps: [] })

              // 标记消息为完成（使用 ID 精确匹配）
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === currentAssistantMessageIdRef ? { ...m, status: 'done' } : m,
                ),
              }))

              sseAbortRef = null
            },
          )

          sseAbortRef = abortFn
        } catch (error: any) {
          console.error('[AgentStore] Continue task error:', error)
          toast.error(error.message || 'Continue task failed')
          set({ isGenerating: false, progress: 0 })
          sseAbortRef = null
        }
      },

      /**
       * 保存当前步骤到消息中
       * 将当前步骤的文本和工作流步骤保存到 assistant 消息的 steps 数组中
       */
      saveCurrentStepToMessage() {
        if (currentStepIndexRef < 0 || !streamingTextRef.trim()) {
          return
        }

        const stepData: IMessageStep = {
          id: `step-${currentStepIndexRef}-${Date.now()}`,
          content: streamingTextRef,
          workflowSteps: [...currentStepWorkflowRef],
          isActive: false,
          timestamp: Date.now(),
        }

        set((state) => ({
          messages: state.messages.map((m) => {
            // 使用 ID 精确匹配当前正在流式输出的 assistant 消息
            if (m.id === currentAssistantMessageIdRef) {
              const steps = m.steps || []
              // 检查是否已存在该步骤（避免重复添加）
              const existingIndex = steps.findIndex((s) => s.id === stepData.id || (
                currentStepIndexRef >= 0 && steps.length === currentStepIndexRef
              ))
              if (existingIndex >= 0) {
                // 更新现有步骤
                steps[existingIndex] = stepData
              } else {
                // 添加新步骤
                steps.push(stepData)
              }
              return { ...m, steps: [...steps] }
            }
            return m
          }),
        }))
      },

      /**
       * 开始新步骤
       * 保存当前步骤并重置状态准备接收新步骤
       */
      startNewStep() {
        // 保存当前步骤（如果有内容）
        if (streamingTextRef.trim()) {
          methods.saveCurrentStepToMessage()
        }

        // 重置当前步骤状态
        streamingTextRef = ''
        currentStepWorkflowRef = []
        currentStepIndexRef++

        console.log('[AgentStore] Started new step:', currentStepIndexRef)
      },

      /**
       * 添加工作流步骤到当前步骤
       */
      addWorkflowStep(step: IWorkflowStep) {
        currentStepWorkflowRef.push(step)
        // 同时更新全局工作流步骤（用于UI显示）
        set((state) => ({
          workflowSteps: [...state.workflowSteps.map((s) => ({ ...s, isActive: false })), step],
        }))

        // 实时更新消息中的当前步骤的工作流（使用 ID 精确匹配）
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.id === currentAssistantMessageIdRef) {
              const steps = m.steps || []
              if (steps.length > 0) {
                const lastStep = steps[steps.length - 1]
                steps[steps.length - 1] = {
                  ...lastStep,
                  workflowSteps: [...(lastStep.workflowSteps || []), step],
                }
                return { ...m, steps: [...steps] }
              }
            }
            return m
          }),
        }))
      },

      /**
       * 更新最后一个工作流步骤
       */
      updateLastWorkflowStep(updater: (step: IWorkflowStep) => IWorkflowStep) {
        // 更新当前步骤的工作流
        if (currentStepWorkflowRef.length > 0) {
          const lastIndex = currentStepWorkflowRef.length - 1
          currentStepWorkflowRef[lastIndex] = updater(currentStepWorkflowRef[lastIndex])
        }

        // 更新全局工作流步骤
        set((state) => {
          const steps = [...state.workflowSteps]
          if (steps.length > 0) {
            steps[steps.length - 1] = updater(steps[steps.length - 1])
          }
          return { workflowSteps: steps }
        })

        // 更新消息中的工作流步骤（使用 ID 精确匹配）
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.id === currentAssistantMessageIdRef) {
              const steps = m.steps || []
              if (steps.length > 0) {
                const lastStep = steps[steps.length - 1]
                if (lastStep.workflowSteps && lastStep.workflowSteps.length > 0) {
                  const workflowSteps = [...lastStep.workflowSteps]
                  workflowSteps[workflowSteps.length - 1] = updater(workflowSteps[workflowSteps.length - 1])
                  steps[steps.length - 1] = { ...lastStep, workflowSteps }
                  return { ...m, steps: [...steps] }
                }
              }
            }
            return m
          }),
        }))
      },

      /** 处理 SSE 消息 */
      handleSSEMessage(sseMessage: ISSEMessage, onTaskIdReady?: (taskId: string) => void) {
        // 处理 init 消息
        if (sseMessage.type === 'init' && sseMessage.taskId) {
          const receivedTaskId = sseMessage.taskId
          console.log('[AgentStore] Received taskId:', receivedTaskId)
          set({ currentTaskId: receivedTaskId })
          streamingTextRef = ''
          set({ streamingText: '' })

          // 回调通知 taskId 已就绪
          onTaskIdReady?.(receivedTaskId)

          // 后台刷新任务列表（不阻塞流程）
          agentApi.getTaskList(1, 10).catch((err) => {
            console.warn('[AgentStore] Background refresh task list failed:', err)
          })

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

          // 检测新消息开始（message_start）- 创建新步骤
          if (event?.type === 'message_start') {
            methods.startNewStep()
            return
          }

          // 处理工具调用开始（content_block_start with tool_use）
          if (event?.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            const toolName = event.content_block.name || 'Unknown Tool'
            const toolId = event.content_block.id || `tool-${Date.now()}`

            // 添加新的工作流步骤到当前步骤
            const newStep: IWorkflowStep = {
              id: toolId,
              type: 'tool_call' as const,
              toolName,
              content: '',
              isActive: true,
              timestamp: Date.now(),
            }
            methods.addWorkflowStep(newStep)
            return
          }

          if (event?.type === 'content_block_delta' && event.delta) {
            if (event.delta.type === 'text_delta' && event.delta.text) {
              streamingTextRef += event.delta.text
              set({ streamingText: streamingTextRef })

              // 更新 markdown 消息
              set((state) => {
                const newMessages = [...state.markdownMessages]
                if (
                  newMessages.length > 0 &&
                  newMessages[newMessages.length - 1].startsWith('🤖 ')
                ) {
                  newMessages[newMessages.length - 1] = `🤖 ${streamingTextRef}`
                } else {
                  newMessages.push(`🤖 ${streamingTextRef}`)
                }
                return { markdownMessages: newMessages }
              })

              // 更新消息列表中的 assistant 消息内容和当前步骤（使用 ID 精确匹配）
              set((state) => ({
                messages: state.messages.map((m) => {
                  if (m.id === currentAssistantMessageIdRef) {
                    // 获取所有步骤的内容拼接作为总内容
                    const steps = m.steps || []
                    const allContent = steps.map((s) => s.content).join('\n\n')
                    const totalContent = allContent ? allContent + '\n\n' + streamingTextRef : streamingTextRef

                    // 更新或创建当前步骤
                    let updatedSteps = [...steps]
                    const currentStepData: IMessageStep = {
                      id: `step-${currentStepIndexRef}-live`,
                      content: streamingTextRef,
                      workflowSteps: [...currentStepWorkflowRef],
                      isActive: true,
                      timestamp: Date.now(),
                    }

                    if (currentStepIndexRef >= 0 && currentStepIndexRef < updatedSteps.length) {
                      // 更新已存在的步骤
                      updatedSteps[currentStepIndexRef] = currentStepData
                    } else if (currentStepIndexRef === updatedSteps.length) {
                      // 添加新步骤
                      updatedSteps.push(currentStepData)
                    }

                    return {
                      ...m,
                      content: totalContent,
                      status: 'streaming' as const,
                      steps: updatedSteps,
                    }
                  }
                  return m
                }),
              }))
            }
            // 工具调用参数（input_json_delta）- 更新最后一个工作流步骤的内容
            if (event.delta.type === 'input_json_delta' && event.delta.partial_json) {
              methods.updateLastWorkflowStep((step) => ({
                ...step,
                content: (step.content || '') + event.delta.partial_json,
              }))
            }
          }
          return
        }

        // 处理 assistant 消息（包含工具调用完成）
        if (sseMessage.type === 'assistant' && sseMessage.message) {
          const assistantMsg = sseMessage.message as any
          if (assistantMsg?.message?.content && Array.isArray(assistantMsg.message.content)) {
            assistantMsg.message.content.forEach((item: any) => {
              if (item.type === 'tool_use') {
                // 工具调用完成 - 标记步骤为非活跃
                const toolName = item.name || 'Unknown Tool'
                const toolInput = item.input ? JSON.stringify(item.input, null, 2) : ''

                // 更新当前步骤的工作流
                const stepIndex = currentStepWorkflowRef.findIndex(
                  (s) => s.type === 'tool_call' && s.toolName === toolName && s.isActive,
                )
                if (stepIndex >= 0) {
                  currentStepWorkflowRef[stepIndex] = {
                    ...currentStepWorkflowRef[stepIndex],
                    content: toolInput,
                    isActive: false,
                  }
                }

                // 更新全局工作流步骤
                set((state) => {
                  const steps = [...state.workflowSteps]
                  const globalStepIndex = steps.findIndex(
                    (s) => s.type === 'tool_call' && s.toolName === toolName && s.isActive,
                  )
                  if (globalStepIndex >= 0) {
                    steps[globalStepIndex] = {
                      ...steps[globalStepIndex],
                      content: toolInput,
                      isActive: false,
                    }
                  }
                  return { workflowSteps: steps }
                })

                // 同时记录到 markdown 消息
                const displayName = toolName.replace(/^mcp__\w+__/, '')
                set((state) => ({
                  markdownMessages: [
                    ...state.markdownMessages,
                    `🔧 **Tool Call**: \`${displayName}\`\n\`\`\`json\n${toolInput}\n\`\`\``,
                  ],
                }))
              }
            })
          }
          return
        }

        // 处理 user 消息（包含工具结果）
        if (sseMessage.type === 'user' && sseMessage.message) {
          const userMsg = sseMessage.message as any
          if (userMsg?.message?.content && Array.isArray(userMsg.message.content)) {
            userMsg.message.content.forEach((item: any) => {
              if (item.type === 'tool_result') {
                // 工具调用结果
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
                  // 找到最近的 tool_call 步骤
                  const lastToolCall = [...currentStepWorkflowRef]
                    .reverse()
                    .find((s) => s.type === 'tool_call')
                  const prevToolName = lastToolCall?.toolName || 'Tool'

                  // 添加工具结果步骤到当前步骤
                  const resultStep: IWorkflowStep = {
                    id: `result-${Date.now()}`,
                    type: 'tool_result' as const,
                    toolName: prevToolName,
                    content: resultText,
                    isActive: false,
                    timestamp: Date.now(),
                  }
                  methods.addWorkflowStep(resultStep)

                  // 截取结果显示（避免太长）
                  const displayResult =
                    resultText.length > 500 ? resultText.substring(0, 500) + '...' : resultText
                  set((state) => ({
                    markdownMessages: [
                      ...state.markdownMessages,
                      `📋 **Tool Result**:\n\`\`\`\n${displayResult}\n\`\`\``,
                    ],
                  }))
                }
              }
            })
          }
          return
        }

        // 处理 text 消息
        if (sseMessage.type === 'text' && sseMessage.message) {
          set((state) => ({
            markdownMessages: [...state.markdownMessages, sseMessage.message as string],
          }))
        }

        // 处理 error 消息
        if (sseMessage.type === 'error' && sseMessage.message) {
          const errorMsg = `❌ : ${sseMessage.message || 'Unknown error'}`
          set((state) => ({
            markdownMessages: [...state.markdownMessages, errorMsg],
          }))
        }

        // 处理 result 消息
        if (sseMessage.type === 'result' && sseMessage.message) {
          methods.handleResult(sseMessage.message)
        }

        // 处理 status 消息
        if (sseMessage.type === 'status' && sseMessage.status) {
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
      handleResult(resultMsg: any) {
        // 保存消费
        if (resultMsg.total_cost_usd !== undefined) {
          set({ currentCost: resultMsg.total_cost_usd })
        }

        // 显示结果消息
        if (resultMsg.message) {
          set((state) => ({
            markdownMessages: [...state.markdownMessages, resultMsg.message],
          }))

          // 更新消息列表（使用 ID 精确匹配）
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === currentAssistantMessageIdRef
                ? { ...m, content: resultMsg.message, status: 'done' }
                : m,
            ),
          }))
        }

        set({
          progress: 100,
          isGenerating: false,
          workflowSteps: [],
        })
      },

      // ============ 任务控制 ============

      /** 停止当前任务 */
      stopTask() {
        if (sseAbortRef) {
          console.log('[AgentStore] Aborting SSE connection')
          sseAbortRef()
          sseAbortRef = null
        }

        set({
          isGenerating: false,
          progress: 0,
          workflowSteps: [],
        })

        // 标记消息为完成（使用 ID 精确匹配）
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === currentAssistantMessageIdRef ? { ...m, status: 'done' } : m,
          ),
        }))

        toast.info(tRef?.('aiGeneration.taskStopped' as any) || 'Task stopped')
      },

      /** 重置状态 */
      reset() {
        if (sseAbortRef) {
          sseAbortRef()
          sseAbortRef = null
        }
        streamingTextRef = ''
        tRef = null
        set(getInitialState())
      },

      /** 设置消息（用于从 API 加载历史消息） */
      setMessages(messages: IDisplayMessage[]) {
        set({ messages })
      },

      /** 追加消息 */
      appendMessage(message: IDisplayMessage) {
        set((state) => ({
          messages: [...state.messages, message],
        }))
      },

      /** 初始化实时模式（从 HomeChat 跳转后） */
      initRealtimeMode(taskId: string) {
        set({ currentTaskId: taskId })
      },
    }

    return methods
  }),
)

// 导出类型
export * from './agent.types'
export * from './agent.constants'

