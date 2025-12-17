/**
 * Agent Store - 核心方法
 * 包含创建任务、继续任务、SSE处理等核心逻辑
 */

import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'
import { agentApi } from '@/api/agent'
import { getInitialState } from './agent.state'
import { calculateProgress as calcProgress, getStatusConfig } from './utils/progress'
import { SSEHandlerRegistry, ActionRegistry } from './handlers'
import type { ISSEHandlerContext, ISSECallbacks } from './handlers'
import type { IAgentRefs } from './utils/refs'
import type { WorkflowUtils } from './utils/workflow'
import type { MessageUtils } from './utils/message'
import type {
  IAgentState,
  ISSEMessage,
  ICreateTaskParams,
  ITaskData,
  IActionContext,
} from './agent.types'

// ============ 方法工厂上下文 ============

export interface IMethodsContext {
  refs: IAgentRefs
  set: (partial: Partial<IAgentState> | ((state: IAgentState) => Partial<IAgentState>)) => void
  get: () => IAgentState
  workflowUtils: WorkflowUtils
  messageUtils: MessageUtils
  resetRefs: () => void
}

// ============ 创建 Store 方法 ============

export function createStoreMethods(ctx: IMethodsContext) {
  const { refs, set, get, workflowUtils, messageUtils, resetRefs } = ctx

  // 创建 SSE 处理器上下文
  const sseContext: ISSEHandlerContext = {
    refs,
    set: set as any,
    get,
    workflowUtils,
  }

  // ============ 内部方法（避免 this 问题） ============

  /** 计算进度 */
  function calculateProgress(status: string, isNewStatus: boolean): number {
    return calcProgress(get().progress, status, isNewStatus)
  }

  /** 处理任务结果 */
  function handleResult(resultMsg: any) {
    // 保存消费
    if (resultMsg.total_cost_usd !== undefined) {
      set({ currentCost: resultMsg.total_cost_usd })
    }

    // 显示结果消息
    if (resultMsg.message) {
      messageUtils.addMarkdownMessage(resultMsg.message)
      messageUtils.updateMessageContent(resultMsg.message)
    }

    set({
      progress: 100,
      isGenerating: false,
      workflowSteps: [],
    })

    // 处理任务结果的 actions
    if (resultMsg.result && refs.actionContext.value) {
      const resultArray: ITaskData[] = Array.isArray(resultMsg.result) ? resultMsg.result : [resultMsg.result]

      if (resultArray.length > 0) {
        console.log('[AgentStore] Processing result actions, count:', resultArray.length)
        ActionRegistry.executeBatch(resultArray, refs.actionContext.value)
      }
    }
  }

  /** 处理 SSE 消息 */
  function handleSSEMessage(sseMessage: ISSEMessage, callbacks?: ISSECallbacks) {
    // 使用注册的处理器处理
    if (SSEHandlerRegistry.handle(sseMessage, sseContext, callbacks)) {
      // 处理 init 后刷新任务列表
      if (sseMessage.type === 'init' && sseMessage.taskId) {
        agentApi.getTaskList(1, 10).catch((err) => {
          console.warn('[AgentStore] Background refresh task list failed:', err)
        })
      }
      return
    }

    console.log("00000000000000");
    console.log(sseMessage, sseContext, callbacks);

    // 处理 result 消息（需要特殊处理）
    if (sseMessage.type === 'result' && sseMessage.message) {
      handleResult(sseMessage.message)
      return
    }

    // 处理 status 消息
    if (sseMessage.type === 'status' && sseMessage.status) {
      const newProgress = calculateProgress(sseMessage.status, true)
      set({ progress: newProgress })
    }
  }

  // ============ 返回 Store 方法 ============

  return {
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
    calculateProgress,

    /** 获取状态配置 */
    getStatusConfig,

    // ============ 核心方法：创建任务 ============

    /**
     * 创建 AI 生成任务
     */
    async createTask(params: ICreateTaskParams): Promise<string | null> {
      const { prompt, medias = [], t, onTaskIdReady, onLoginRequired } = params

      if (!prompt.trim()) {
        return null
      }

      refs.t.value = t

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
        resetRefs()

        // 添加用户消息
        const userMessage = messageUtils.createUserMessage(prompt, medias)
        set({ messages: [userMessage] })
        messageUtils.addMarkdownMessage(`👤 ${prompt}`)

        // 构建完整提示词
        let fullPrompt = prompt
        const validMedias = medias.filter((m) => m.url && !m.progress)
        if (validMedias.length > 0) {
          const fileLinks = validMedias.map((f) => `[${f.type}]: ${f.url}`).join('\n ')
          fullPrompt = `${prompt}\n\n${fileLinks}`
        }

        console.log('[AgentStore] Creating new task with prompt:', prompt)

        // 添加 AI 待回复消息
        const assistantMessage = messageUtils.createAssistantMessage()
        messageUtils.addMessage(assistantMessage)

        // 创建 SSE 回调
        const sseCallbacks: ISSECallbacks = { onTaskIdReady }

        // 创建任务（SSE）- 使用闭包引用 handleSSEMessage
        const abortFn = await agentApi.createTaskWithSSE(
          { prompt: fullPrompt, includePartialMessages: true },
          (sseMessage: ISSEMessage) => {
            console.log('[AgentStore] SSE Message:', sseMessage)
            handleSSEMessage(sseMessage, sseCallbacks)
          },
          (error) => {
            console.error('[AgentStore] SSE Error:', error)
            const errorMsg = refs.t.value
              ? `${refs.t.value('aiGeneration.createTaskFailed' as any)}: ${error.message || refs.t.value('aiGeneration.unknownError' as any)}`
              : `Create task failed: ${error.message}`
            toast.error(errorMsg)
            set({ isGenerating: false, progress: 0 })
            messageUtils.markMessageError(error.message)
          },
          async () => {
            console.log('[AgentStore] SSE Done')
            set({ isGenerating: false, workflowSteps: [] })
            messageUtils.markMessageDone()
            refs.sseAbort.value = null
          },
        )

        refs.sseAbort.value = abortFn

        // 等待获取 taskId
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
        const errorMsg = refs.t.value
          ? `${refs.t.value('aiGeneration.createTaskFailed' as any)}: ${error.message || refs.t.value('aiGeneration.unknownError' as any)}`
          : `Create task failed: ${error.message}`
        toast.error(errorMsg)
        set({ isGenerating: false, progress: 0 })
        refs.sseAbort.value = null
        return null
      }
    },

    /**
     * 继续对话
     */
    async continueTask(params: ICreateTaskParams & { taskId: string }): Promise<void> {
      const { prompt, medias = [], t, taskId } = params

      if (!prompt.trim() || !taskId) {
        return
      }

      refs.t.value = t

      try {
        set({
          isGenerating: true,
          currentTaskId: taskId,
          progress: 10,
          workflowSteps: [],
        })
        resetRefs()

        // 添加用户消息
        const userMessage = messageUtils.createUserMessage(prompt, medias)
        set((state) => ({
          messages: [...state.messages, userMessage],
        }))
        messageUtils.addMarkdownMessage(`👤 ${prompt}`)

        // 构建完整提示词
        let fullPrompt = prompt
        const validMedias = medias.filter((m) => m.url && !m.progress)
        if (validMedias.length > 0) {
          const fileLinks = validMedias.map((f) => `[${f.type}]: ${f.url}`).join('\n ')
          fullPrompt = `${prompt}\n\n${fileLinks}`
        }

        // 添加 AI 待回复消息
        const assistantMessage = messageUtils.createAssistantMessage()
        messageUtils.addMessage(assistantMessage)

        console.log('[AgentStore] Continuing task:', taskId)

        // 创建任务（SSE）- 使用闭包引用 handleSSEMessage
        const abortFn = await agentApi.createTaskWithSSE(
          { prompt: fullPrompt, taskId, includePartialMessages: true },
          (sseMessage: ISSEMessage) => {
            console.log('[AgentStore] SSE Message:', sseMessage)
            handleSSEMessage(sseMessage)
          },
          (error) => {
            console.error('[AgentStore] SSE Error:', error)
            toast.error(error.message || 'Generation failed')
            set({ isGenerating: false, progress: 0 })
            messageUtils.markMessageError(error.message)
          },
          async () => {
            console.log('[AgentStore] SSE Done')
            set({ isGenerating: false, workflowSteps: [] })
            messageUtils.markMessageDone()
            refs.sseAbort.value = null
          },
        )

        refs.sseAbort.value = abortFn
      } catch (error: any) {
        console.error('[AgentStore] Continue task error:', error)
        toast.error(error.message || 'Continue task failed')
        set({ isGenerating: false, progress: 0 })
        refs.sseAbort.value = null
      }
    },

    // ============ SSE 消息处理 ============

    /** 处理 SSE 消息（暴露给外部使用） */
    handleSSEMessage,

    /** 处理任务结果（暴露给外部使用） */
    handleResult,

    // ============ 工作流方法代理 ============

    saveCurrentStepToMessage: workflowUtils.saveCurrentStepToMessage.bind(workflowUtils),
    startNewStep: workflowUtils.startNewStep.bind(workflowUtils),
    addWorkflowStep: workflowUtils.addWorkflowStep.bind(workflowUtils),
    updateLastWorkflowStep: workflowUtils.updateLastWorkflowStep.bind(workflowUtils),

    // ============ 任务控制 ============

    /** 停止当前任务 */
    stopTask() {
      if (refs.sseAbort.value) {
        console.log('[AgentStore] Aborting SSE connection')
        refs.sseAbort.value()
        refs.sseAbort.value = null
      }

      set({
        isGenerating: false,
        progress: 0,
        workflowSteps: [],
      })

      messageUtils.markMessageDone()
      toast.info(refs.t.value?.('aiGeneration.taskStopped' as any) || 'Task stopped')
    },

    /** 重置状态 */
    reset() {
      if (refs.sseAbort.value) {
        refs.sseAbort.value()
        refs.sseAbort.value = null
      }
      resetRefs()
      refs.t.value = null
      refs.actionContext.value = null
      set(getInitialState())
    },

    // ============ 消息管理 ============

    setMessages: messageUtils.setMessages.bind(messageUtils),
    appendMessage: messageUtils.addMessage.bind(messageUtils),

    // ============ 模式管理 ============

    /** 初始化实时模式 */
    initRealtimeMode(taskId: string) {
      set({ currentTaskId: taskId })
    },

    // ============ Action 上下文管理 ============

    /** 设置 Action 上下文 */
    setActionContext(context: IActionContext) {
      refs.actionContext.value = context
    },

    /** 获取 Action 上下文 */
    getActionContext(): IActionContext | null {
      return refs.actionContext.value
    },

    /** 手动执行 Action */
    async executeAction(taskData: ITaskData, context?: IActionContext): Promise<boolean> {
      const ctx = context || refs.actionContext.value
      if (!ctx) {
        console.warn('[AgentStore] No action context available')
        return false
      }
      return ActionRegistry.execute(taskData, ctx)
    },

    /** 批量执行 Actions */
    async executeActions(taskDataList: ITaskData[], context?: IActionContext): Promise<void> {
      const ctx = context || refs.actionContext.value
      if (!ctx) {
        console.warn('[AgentStore] No action context available')
        return
      }
      return ActionRegistry.executeBatch(taskDataList, ctx)
    },
  }
}

export type AgentStoreMethods = ReturnType<typeof createStoreMethods>
