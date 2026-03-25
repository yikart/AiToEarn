/**
 * 聊天状态管理 Hook
 * 整合 Store 状态和本地状态，统一对外提供
 * 支持按任务ID隔离消息数据
 */
import type { TaskDetail, TaskMessage } from '@/api/agent'
import type { IDisplayMessage, IWorkflowStep } from '@/store/agent'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { agentApi } from '@/api/agent'
import { toast } from '@/lib/toast'
import { useAgentStore } from '@/store/agent'
import { getDefaultTaskData } from '@/store/agent/agent.state'
import { useUserStore } from '@/store/user'
import { convertMessages, isTaskCompleted } from '../utils'
import { useTaskPolling } from './useTaskPolling'

export interface IChatStateOptions {
  /** 任务 ID */
  taskId: string
  /** 翻译函数 */
  t: (key: string) => string
}

export interface IChatStateReturn {
  /** 任务详情 */
  task: TaskDetail | null
  /** 当前显示的消息列表 */
  displayMessages: IDisplayMessage[]
  /** 工作流步骤（仅实时生成时有效） */
  workflowSteps: IWorkflowStep[]
  /** 是否正在加载 */
  isLoading: boolean
  /** 是否正在生成 */
  isGenerating: boolean
  /** 进度百分比 */
  progress: number
  /** 是否为活跃任务 */
  isActiveTask: boolean
  /** 更新本地消息（供子组件使用） */
  setLocalMessages: React.Dispatch<React.SetStateAction<IDisplayMessage[]>>
  /** 设置本地生成状态 */
  setLocalIsGenerating: React.Dispatch<React.SetStateAction<boolean>>
  /** 更新任务标题 */
  updateTaskTitle: (newTitle: string) => void
}

/**
 * 聊天状态管理 Hook
 */
export function useChatState(options: IChatStateOptions): IChatStateReturn {
  const { taskId, t } = options

  // 全局 Store 状态 - 获取任务级数据
  const { currentTaskId, taskMessages, setMessages, debugFiles } = useAgentStore(
    useShallow(state => ({
      currentTaskId: state.currentTaskId,
      taskMessages: state.taskMessages,
      setMessages: state.setMessages,
      debugFiles: state.debugFiles,
    })),
  )

  // 判断是否处于 debug 模式
  const isDebugMode = debugFiles.length > 0

  // 获取当前任务的数据（按 taskId 隔离）
  const currentTaskData = taskMessages[taskId] || getDefaultTaskData()
  const storeMessages = currentTaskData.messages
  const storeWorkflowSteps = currentTaskData.workflowSteps
  const storeIsGenerating = currentTaskData.isGenerating
  const storeProgress = currentTaskData.progress

  // 获取 Credits 余额
  const fetchCreditsBalance = useUserStore(state => state.fetchCreditsBalance)

  // 判断是否为活跃任务
  const isActiveTask = currentTaskId === taskId
  const isRealtimeGenerating = isActiveTask && storeIsGenerating

  // 本地状态
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [localMessages, setLocalMessages] = useState<IDisplayMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [localIsGenerating, setLocalIsGenerating] = useState(false)

  // Refs
  const hasLoadedRef = useRef(false)
  const rawMessagesRef = useRef<TaskMessage[]>([])

  // 当 taskId 变化时，重置与任务相关的本地状态，确保不会错误地使用上一次任务的缓存
  useEffect(() => {
    // 重置已加载标记，强制重新从 API 拉取数据
    hasLoadedRef.current = false
    // 清空上一次的原始消息，避免后续基于旧数据的短路逻辑
    rawMessagesRef.current = []
    // 清空本地 task 与消息状态，显示 loading，等待新的加载逻辑触发
    setTask(null)
    setLocalMessages([])
    setIsLoading(true)
    // 注意：不主动调用 startPolling，这里只做重置，后续 loadTask 会根据新任务情况自行决定是否启动轮询
  }, [taskId])

  // 注意：由于现在消息是按 taskId 隔离存储的，不再需要复杂的护栏清理逻辑
  // 每个任务的消息独立存储在 taskMessages[taskId] 中，不会互相干扰

  // 轮询 Hook
  const { isPolling, startPolling } = useTaskPolling({
    taskId,
    isActiveTask,
    // 轮询间隔（ms）
    pollingInterval: 1500,
    getCurrentRawMessages: useCallback(() => rawMessagesRef.current, []),
    onMessagesUpdate: useCallback(
      (messages, rawMessages) => {
        rawMessagesRef.current = rawMessages
        setLocalMessages(messages)

        // 防御性检查：只有当新消息数量 >= 当前消息数量时才更新 store
        // 防止轮询返回的不完整数据覆盖 SSE 实时追加的消息
        const currentMessages = taskMessages[taskId]?.messages || []
        if (messages.length >= currentMessages.length) {
          setMessages(messages, taskId)
        }
        else {
          console.warn(
            '[ChatState] Skipping setMessages: new messages count is less than current',
            {
              current: currentMessages.length,
              new: messages.length,
            },
          )
        }
      },
      [setMessages, taskId, taskMessages],
    ),
    onTaskUpdate: useCallback((taskData: TaskDetail) => {
      setTask(taskData)
    }, []),
    onTaskStatusChange: useCallback((status: string) => {
      if (status === 'aborted') {
        // Task aborted, clearing generating state
        // 任务被中止时，停止本地生成状态
        setLocalIsGenerating(false)
      }
    }, []),
  })

  /**
   * 加载任务详情
   */
  useEffect(() => {
    // 如果是 "new" 任务，不加载历史数据，等待创建
    if (taskId === 'new') {
      setIsLoading(false)
      return
    }

    // 如果已经加载过，不再重复加载
    if (hasLoadedRef.current) {
      setIsLoading(false)
      return
    }

    // 如果 Store 中已有该任务的消息，优先使用（支持任务缓存）
    if (storeMessages.length > 0) {
      setIsLoading(false)
      hasLoadedRef.current = true
      return
    }

    const loadTask = async () => {
      if (!taskId)
        return

      setIsLoading(true)
      try {
        const result = await agentApi.getTaskDetail(taskId)
        if (!result) {
          toast.error(t('message.error'))
          return
        }
        if (result.code === 0 && result.data) {
          setTask(result.data)

          if (result.data.messages) {
            rawMessagesRef.current = result.data.messages
            const converted = convertMessages(result.data.messages)
            setLocalMessages(converted)
            setMessages(converted, taskId)

            // 检测任务是否完成，如果未完成则启动轮询
            if (!isTaskCompleted(result.data.messages, result.data)) {
              // Task not completed, starting polling
              startPolling()
            }
          }

          // 获取到 result 后，刷新 Credits 余额
          fetchCreditsBalance()

          hasLoadedRef.current = true
        }
        else {
          toast.error(result.message || t('message.error'))
        }
      }
      catch (error) {
        console.error('Load task detail failed:', error)
        toast.error(t('message.error'))
      }
      finally {
        setIsLoading(false)
      }
    }

    loadTask()
  }, [taskId, storeMessages.length, t, setMessages, startPolling, fetchCreditsBalance])

  // 计算最终显示的消息和状态
  // 优先使用 store 中的消息（支持任务缓存和实时更新）
  // debug 模式下强制使用 store 的消息，用于调试回放
  // taskId='new' 时，使用 currentTaskId 对应的消息（临时任务的消息）
  // 这样可以在创建任务后立即显示用户消息和 AI 思考状态
  const displayMessages = (() => {
    if (taskId === 'new') {
      // 获取当前活跃任务的消息（临时任务 temp-xxx）
      const currentData = taskMessages[currentTaskId]
      return currentData?.messages || []
    }
    return storeMessages.length > 0 || isActiveTask || isDebugMode ? storeMessages : localMessages
  })()
  const isGenerating = isRealtimeGenerating || localIsGenerating || isPolling
  // taskId='new' 时，工作流步骤存储在 currentTaskId（临时任务）中
  const workflowSteps: IWorkflowStep[] = (() => {
    if (taskId === 'new') {
      const currentData = taskMessages[currentTaskId]
      return currentData?.workflowSteps || []
    }
    return isActiveTask || isDebugMode ? storeWorkflowSteps : []
  })()

  /**
   * 更新任务标题（用于编辑标题成功后更新本地状态）
   */
  const updateTaskTitle = useCallback((newTitle: string) => {
    setTask(prev => (prev ? { ...prev, title: newTitle } : prev))
  }, [])

  return {
    task,
    displayMessages,
    workflowSteps,
    isLoading,
    isGenerating,
    progress: storeProgress,
    isActiveTask,
    setLocalMessages,
    setLocalIsGenerating,
    updateTaskTitle,
  }
}
