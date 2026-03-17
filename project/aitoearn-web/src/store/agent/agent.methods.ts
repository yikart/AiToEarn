/**
 * Agent Store - 核心方法
 * 包含创建任务、继续任务等核心逻辑
 * 支持按任务ID隔离消息数据
 *
 * 使用 TaskInstance 架构：每个任务有独立的实例，消除多任务竞态条件
 */

import type {
  IActionContext,
  IAgentState,
  ICreateTaskParams,
  IPendingTask,
  ISSEMessage,
  ITaskMessageData,
} from './agent.types'
import type { ITaskInstanceContext, ISSECallbacks as ITaskSSECallbacks } from './task-instance'
import type { MessageUtils } from './utils/message'
import type { IAgentRefs } from './utils/refs'
import { agentApi } from '@/api/agent'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'
import { getDefaultTaskData, getInitialState } from './agent.state'
import { TaskInstance } from './task-instance'
import { buildPromptForAPI } from './utils/buildPrompt'

// ============ 常量配置 ============

/** 最大缓存任务数量 */
const MAX_CACHED_TASKS = 10

// ============ TaskInstance 管理 ============

/** 任务实例映射表 */
const taskInstances = new Map<string, TaskInstance>()

// ============ 方法工厂上下文 ============

export interface IMethodsContext {
  refs: IAgentRefs
  set: (partial: Partial<IAgentState> | ((state: IAgentState) => Partial<IAgentState>)) => void
  get: () => IAgentState
  messageUtils: MessageUtils
  resetRefs: () => void
}

// ============ 创建 Store 方法 ============

export function createStoreMethods(ctx: IMethodsContext) {
  const { refs, set, get, messageUtils, resetRefs } = ctx

  // ============ 任务数据操作辅助方法 ============

  /**
   * 获取指定任务的消息数据
   */
  function getTaskData(taskId: string): ITaskMessageData {
    const state = get()
    return state.taskMessages[taskId] || getDefaultTaskData()
  }

  /**
   * 更新指定任务的消息数据
   */
  function updateTaskData(
    taskId: string,
    updater: (data: ITaskMessageData) => Partial<ITaskMessageData>,
  ) {
    if (!taskId) {
      console.warn('[AgentStore] updateTaskData called without taskId')
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

  /**
   * 初始化任务数据
   */
  function initTaskData(taskId: string, initialData?: Partial<ITaskMessageData>) {
    set(state => ({
      taskMessages: {
        ...state.taskMessages,
        [taskId]: {
          ...getDefaultTaskData(),
          ...initialData,
          lastUpdated: Date.now(),
        },
      },
    }))
  }

  /**
   * 清理过期任务缓存
   */
  function cleanupTaskCache() {
    set((state) => {
      const entries = Object.entries(state.taskMessages)

      // 如果未超过最大数量，不清理
      if (entries.length <= MAX_CACHED_TASKS)
        return {}

      // 按最后更新时间排序
      const sorted = entries.sort((a, b) => (b[1].lastUpdated || 0) - (a[1].lastUpdated || 0))

      // 保留最近的 N 个任务
      const tasksToKeep = sorted.slice(0, MAX_CACHED_TASKS)
      const newTaskMessages: Record<string, ITaskMessageData> = {}

      for (const [taskId, data] of tasksToKeep) {
        newTaskMessages[taskId] = data
      }

      // 确保当前任务不被清理
      if (state.currentTaskId && !newTaskMessages[state.currentTaskId]) {
        newTaskMessages[state.currentTaskId] = state.taskMessages[state.currentTaskId]
      }

      console.log('[AgentStore] Cleaned up task cache, kept:', Object.keys(newTaskMessages).length)
      return { taskMessages: newTaskMessages }
    })
  }

  // ============ 返回 Store 方法 ============

  return {
    // ============ 任务数据 Getters ============

    /** 获取指定任务的数据 */
    getTaskData,

    /** 更新指定任务的数据 */
    updateTaskData,

    /** 初始化任务数据 */
    initTaskData,

    /** 清理任务缓存 */
    cleanupTaskCache,

    // ============ 核心方法：创建任务 ============

    /**
     * 创建 AI 生成任务
     * 使用 TaskInstance 架构：创建独立实例，SSE 回调绑定到实例
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
        // 生成临时任务ID（用于在获取真实ID之前存储消息）
        const tempTaskId = `temp-${Date.now()}`

        // 创建 TaskInstance 上下文
        const instanceContext: ITaskInstanceContext = {
          syncToStore: (taskId, updater) => updateTaskData(taskId, updater),
          getData: taskId => getTaskData(taskId),
          migrateTaskData: (fromTaskId, toTaskId) => {
            set((state) => {
              const tempData = state.taskMessages[fromTaskId]
              if (!tempData)
                return {}

              const { [fromTaskId]: _, ...restTaskMessages } = state.taskMessages

              return {
                currentTaskId: toTaskId,
                taskMessages: {
                  ...restTaskMessages,
                  [toTaskId]: {
                    ...tempData,
                    lastUpdated: Date.now(),
                  },
                },
              }
            })
          },
          setCurrentTaskId: (taskId) => {
            set({ currentTaskId: taskId })
          },
        }

        // 创建 TaskInstance（绑定到临时任务ID）
        const instance = new TaskInstance(tempTaskId, instanceContext)
        taskInstances.set(tempTaskId, instance)

        // 设置翻译函数和 Action 上下文
        instance.setTranslation(t)
        if (refs.actionContext.value) {
          instance.setActionContext(refs.actionContext.value)
        }

        // 重置全局状态，使用临时任务ID
        set({
          currentTaskId: tempTaskId,
          currentCost: 0,
        })
        resetRefs()

        // 设置 SSE 任务ID（确保后续 SSE 消息写入正确的任务）
        refs.currentSSETaskId.value = tempTaskId

        // 初始化临时任务的数据
        initTaskData(tempTaskId, {
          isGenerating: true,
          progress: 0,
          messages: [],
          markdownMessages: [],
          workflowSteps: [],
          streamingText: '',
        })

        // 添加用户消息（通过 TaskInstance）
        const userMessage = instance.createUserMessage(prompt, medias)
        instance.addMessage(userMessage)
        instance.addMarkdownMessage(`👤 ${prompt}`)

        // 构建 Claude Prompt 格式
        const apiPrompt = buildPromptForAPI(prompt, medias)

        console.log('[AgentStore] Creating new task with TaskInstance:', instance.instanceId)

        // 添加 AI 待回复消息（通过 TaskInstance）
        const assistantMessage = instance.createAssistantMessage()
        instance.addMessage(assistantMessage)

        // 同步 refs（为了兼容旧的 SSE handler）
        refs.currentAssistantMessageId.value = assistantMessage.id

        // 创建 SSE 回调，绑定到 TaskInstance
        const taskSSECallbacks: ITaskSSECallbacks = {
          onTaskIdReady: (realTaskId: string) => {
            console.log('[AgentStore] TaskInstance received real taskId:', realTaskId)

            // 迁移 TaskInstance（从临时ID到真实ID）
            taskInstances.delete(tempTaskId)
            taskInstances.set(realTaskId, instance)

            // 调用外部回调
            onTaskIdReady?.(realTaskId)

            // 清理过期缓存
            cleanupTaskCache()
          },
          onError: (error) => {
            console.error('[AgentStore] TaskInstance SSE Error:', error)
          },
          onComplete: () => {
            console.log('[AgentStore] TaskInstance SSE Complete')
          },
        }

        // 创建任务（SSE）- SSE 消息通过 TaskInstance 处理
        const abortFn = await agentApi.createTaskWithSSE(
          { prompt: apiPrompt, includePartialMessages: true },
          (sseMessage: ISSEMessage) => {
            console.log('[AgentStore] SSE Message -> TaskInstance:', sseMessage.type)
            // 使用 TaskInstance 处理 SSE 消息（消息会自动写入实例的 taskId）
            instance.handleSSEMessage(sseMessage, taskSSECallbacks)
          },
          (error) => {
            console.error('[AgentStore] SSE Error:', error)
            const errorMsg = refs.t.value
              ? `${refs.t.value('aiGeneration.createTaskFailed' as any)}: ${error.message || refs.t.value('aiGeneration.unknownError' as any)}`
              : `Create task failed: ${error.message}`
            toast.error(errorMsg)

            instance.markMessageError(error.message)
            instance.setIsGenerating(false)
            instance.setProgress(0)
          },
          async () => {
            console.log('[AgentStore] SSE Done')
            instance.markMessageDone()
            instance.setIsGenerating(false)
            instance.clearWorkflowSteps()
            refs.sseAbort.value = null
          },
        )

        // 保存 abort 函数到实例和全局 refs
        instance.setAbort(abortFn)
        refs.sseAbort.value = abortFn

        // 等待获取 taskId
        let waitTime = 0
        const maxWaitTime = 30000
        const checkInterval = 100

        while (get().currentTaskId.startsWith('temp-') && waitTime < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, checkInterval))
          waitTime += checkInterval
        }

        const finalTaskId = get().currentTaskId
        return finalTaskId.startsWith('temp-') ? null : finalTaskId
      }
      catch (error: any) {
        console.error('[AgentStore] Create task error:', error)
        const errorMsg = refs.t.value
          ? `${refs.t.value('aiGeneration.createTaskFailed' as any)}: ${error.message || refs.t.value('aiGeneration.unknownError' as any)}`
          : `Create task failed: ${error.message}`
        toast.error(errorMsg)

        const currentTaskId = get().currentTaskId
        if (currentTaskId) {
          updateTaskData(currentTaskId, () => ({
            isGenerating: false,
            progress: 0,
          }))
        }
        refs.sseAbort.value = null
        return null
      }
    },

    /**
     * 继续对话
     * 使用 TaskInstance 架构：获取或创建实例，SSE 回调绑定到实例
     */
    async continueTask(params: ICreateTaskParams & { taskId: string }): Promise<void> {
      const { prompt, medias = [], t, taskId } = params

      if (!prompt.trim() || !taskId) {
        return
      }

      refs.t.value = t

      try {
        // 创建 TaskInstance 上下文
        const instanceContext: ITaskInstanceContext = {
          syncToStore: (tid, updater) => updateTaskData(tid, updater),
          getData: tid => getTaskData(tid),
          migrateTaskData: (fromTaskId, toTaskId) => {
            // continueTask 不需要迁移，taskId 已知
            set((state) => {
              const data = state.taskMessages[fromTaskId]
              if (!data || fromTaskId === toTaskId)
                return {}

              const { [fromTaskId]: _, ...restTaskMessages } = state.taskMessages

              return {
                currentTaskId: toTaskId,
                taskMessages: {
                  ...restTaskMessages,
                  [toTaskId]: {
                    ...data,
                    lastUpdated: Date.now(),
                  },
                },
              }
            })
          },
          setCurrentTaskId: (tid) => {
            set({ currentTaskId: tid })
          },
        }

        // 获取或创建 TaskInstance
        let instance = taskInstances.get(taskId)
        if (!instance) {
          instance = new TaskInstance(taskId, instanceContext)
          taskInstances.set(taskId, instance)
        }

        // 重置实例状态（新一轮对话）
        instance.resetForNewRound()

        // 设置翻译函数和 Action 上下文
        instance.setTranslation(t)
        if (refs.actionContext.value) {
          instance.setActionContext(refs.actionContext.value)
        }

        // 设置当前任务ID
        set({ currentTaskId: taskId })
        resetRefs()

        // 设置 SSE 任务ID（确保后续 SSE 消息写入正确的任务）
        refs.currentSSETaskId.value = taskId

        // 确保任务数据存在，更新状态
        const existingData = getTaskData(taskId)
        updateTaskData(taskId, () => ({
          isGenerating: true,
          progress: 10,
          workflowSteps: [],
          // 保留现有消息
          messages: existingData.messages,
          markdownMessages: existingData.markdownMessages,
        }))

        // 添加用户消息（通过 TaskInstance）
        const userMessage = instance.createUserMessage(prompt, medias)
        instance.addMessage(userMessage)
        instance.addMarkdownMessage(`👤 ${prompt}`)

        // 构建 Claude Prompt 格式
        const apiPrompt = buildPromptForAPI(prompt, medias)

        // 添加 AI 待回复消息（通过 TaskInstance）
        const assistantMessage = instance.createAssistantMessage()
        instance.addMessage(assistantMessage)

        // 同步 refs（为了兼容旧的 SSE handler）
        refs.currentAssistantMessageId.value = assistantMessage.id

        console.log('[AgentStore] Continuing task with TaskInstance:', taskId)

        // 创建 SSE 回调，绑定到 TaskInstance
        const taskSSECallbacks: ITaskSSECallbacks = {
          onTaskIdReady: (receivedTaskId: string) => {
            // continueTask 时 taskId 已知，只需确认
            console.log('[AgentStore] continueTask received taskId:', receivedTaskId)
          },
          onError: (error) => {
            console.error('[AgentStore] TaskInstance SSE Error:', error)
          },
          onComplete: () => {
            console.log('[AgentStore] TaskInstance SSE Complete')
          },
        }

        // 创建任务（SSE）- SSE 消息通过 TaskInstance 处理
        const abortFn = await agentApi.createTaskWithSSE(
          { prompt: apiPrompt, taskId, includePartialMessages: true },
          (sseMessage: ISSEMessage) => {
            console.log('[AgentStore] SSE Message -> TaskInstance:', sseMessage.type)
            // 使用 TaskInstance 处理 SSE 消息
            instance!.handleSSEMessage(sseMessage, taskSSECallbacks)
          },
          (error) => {
            console.error('[AgentStore] SSE Error:', error)
            toast.error(error.message || 'Generation failed')
            instance!.markMessageError(error.message)
            instance!.setIsGenerating(false)
            instance!.setProgress(0)
          },
          async () => {
            console.log('[AgentStore] SSE Done')
            instance!.markMessageDone()
            instance!.setIsGenerating(false)
            instance!.clearWorkflowSteps()
            refs.sseAbort.value = null
          },
        )

        // 保存 abort 函数到实例和全局 refs
        instance.setAbort(abortFn)
        refs.sseAbort.value = abortFn
      }
      catch (error: any) {
        console.error('[AgentStore] Continue task error:', error)
        toast.error(error.message || 'Continue task failed')
        updateTaskData(taskId, () => ({
          isGenerating: false,
          progress: 0,
        }))
        refs.sseAbort.value = null
      }
    },

    // ============ 任务控制 ============

    /** 停止当前任务 */
    stopTask() {
      if (refs.sseAbort.value) {
        console.log('[AgentStore] Aborting SSE connection')
        refs.sseAbort.value()
        refs.sseAbort.value = null
      }

      const taskId = get().currentTaskId
      if (taskId) {
        updateTaskData(taskId, () => ({
          isGenerating: false,
          progress: 0,
          workflowSteps: [],
        }))
      }

      messageUtils.markMessageDone()
      // 移除 toast 显示，改为由调用方处理
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

    // ============ 待处理任务管理 ============

    /** 设置待处理任务（从首页跳转时使用） */
    setPendingTask(task: IPendingTask) {
      set({ pendingTask: task })
    },

    /** 获取并清除待处理任务 */
    consumePendingTask(): IPendingTask | null {
      const task = get().pendingTask
      if (task) {
        set({ pendingTask: null })
      }
      return task
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

    // ============ Debug 模式管理 ============

    /**
     * 设置 debug 文件列表
     * @param files debug 文件名数组（如 ['sse1.txt', 'sse2.txt']）
     */
    setDebugFiles(files: string[]) {
      set({
        debugFiles: files,
        debugMessageIndex: 0,
      })
      console.log('[AgentStore] Debug files set:', files)
    },

    /**
     * 获取下一个 debug 文件路径并递增索引
     * @returns 文件路径（如 '/en/debug/sse1.txt'）或 null（没有更多文件）
     */
    consumeDebugFile(): string | null {
      const state = get()
      const { debugFiles, debugMessageIndex } = state

      if (debugMessageIndex >= debugFiles.length) {
        console.log('[AgentStore] No more debug files available')
        return null
      }

      const fileName = debugFiles[debugMessageIndex]
      const filePath = `/en/debug/${fileName}`

      // 递增索引
      set({ debugMessageIndex: debugMessageIndex + 1 })

      console.log(
        '[AgentStore] Consuming debug file:',
        filePath,
        `(${debugMessageIndex + 1}/${debugFiles.length})`,
      )
      return filePath
    },

    /**
     * 检查是否处于 debug 模式
     */
    isDebugMode(): boolean {
      const state = get()
      return state.debugFiles.length > 0
    },

    /**
     * 检查是否还有更多 debug 文件可用
     */
    hasMoreDebugFiles(): boolean {
      const state = get()
      return state.debugMessageIndex < state.debugFiles.length
    },

    /**
     * 清除 debug 模式
     */
    clearDebugMode() {
      set({
        debugFiles: [],
        debugMessageIndex: 0,
      })
      console.log('[AgentStore] Debug mode cleared')
    },
  }
}
