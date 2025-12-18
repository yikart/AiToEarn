/**
 * 聊天状态管理 Hook
 * 整合 Store 状态和本地状态，统一对外提供
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { agentApi, type TaskDetail, type TaskMessage } from '@/api/agent'
import { useAgentStore, type IDisplayMessage, type IWorkflowStep } from '@/store/agent'
import { useUserStore } from '@/store/user'
import { toast } from '@/lib/toast'
import { isTaskCompleted, convertMessages } from '../utils'
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
}

/**
 * 聊天状态管理 Hook
 */
export function useChatState(options: IChatStateOptions): IChatStateReturn {
  const { taskId, t } = options

  // 全局 Store 状态
  const {
    currentTaskId,
    isGenerating: storeIsGenerating,
    messages: storeMessages,
    workflowSteps: storeWorkflowSteps,
    progress,
    setMessages,
  } = useAgentStore(
    useShallow((state) => ({
      currentTaskId: state.currentTaskId,
      isGenerating: state.isGenerating,
      messages: state.messages,
      workflowSteps: state.workflowSteps,
      progress: state.progress,
      setMessages: state.setMessages,
    })),
  )

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

  // 轮询 Hook
  const { isPolling, startPolling } = useTaskPolling({
    taskId,
    isActiveTask,
    onMessagesUpdate: useCallback((messages, rawMessages) => {
      rawMessagesRef.current = rawMessages
      setLocalMessages(messages)
      setMessages(messages)
    }, [setMessages]),
    onTaskUpdate: useCallback((taskData: TaskDetail) => {
      setTask(taskData)
    }, []),
  })

  /**
   * 加载任务详情
   */
  useEffect(() => {
    // 如果已经加载过，不再重复加载
    if (hasLoadedRef.current) {
      setIsLoading(false)
      return
    }

    // 如果是活跃任务且 Store 中已有消息，不需要从 API 加载
    if (isActiveTask && storeMessages.length > 0) {
      setIsLoading(false)
      hasLoadedRef.current = true
      return
    }

    const loadTask = async () => {
      if (!taskId) return

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
            setMessages(converted)

            // 检测任务是否完成，如果未完成则启动轮询
            if (!isTaskCompleted(result.data.messages)) {
              console.log('[ChatState] Task not completed, starting polling...')
              startPolling()
            }
          }
          
          // 获取到 result 后，刷新 Credits 余额
          fetchCreditsBalance()
          
          hasLoadedRef.current = true
        } else {
          toast.error(result.message || t('message.error'))
        }
      } catch (error) {
        console.error('Load task detail failed:', error)
        toast.error(t('message.error'))
      } finally {
        setIsLoading(false)
      }
    }

    loadTask()
  }, [taskId, isActiveTask, storeMessages.length, t, setMessages, startPolling, fetchCreditsBalance])

  // 计算最终显示的消息和状态
  const displayMessages = isActiveTask ? storeMessages : localMessages
  const isGenerating = isRealtimeGenerating || localIsGenerating || isPolling
  const workflowSteps: IWorkflowStep[] = isActiveTask ? storeWorkflowSteps : []

  return {
    task,
    displayMessages,
    workflowSteps,
    isLoading,
    isGenerating,
    progress,
    isActiveTask,
    setLocalMessages,
    setLocalIsGenerating,
  }
}

