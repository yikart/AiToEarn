/**
 * 任务轮询 Hook
 * 在页面刷新后任务未完成时，通过轮询获取最新状态
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { agentApi, type TaskDetail, type TaskMessage } from '@/api/agent'
import type { IDisplayMessage } from '@/store/agent'
import { useUserStore } from '@/store/user'
import { isTaskCompleted, convertMessages } from '../utils'

export interface ITaskPollingOptions {
  /** 任务 ID */
  taskId: string
  /** 是否为活跃任务（Store 中有对应的实时消息） */
  isActiveTask: boolean
  /** 轮询间隔（ms） */
  pollingInterval?: number
  /** 消息更新回调 */
  onMessagesUpdate: (messages: IDisplayMessage[], rawMessages: TaskMessage[]) => void
  /** 任务更新回调 */
  onTaskUpdate?: (task: TaskDetail) => void
}

export interface ITaskPollingReturn {
  /** 是否正在轮询 */
  isPolling: boolean
  /** 开始轮询 */
  startPolling: () => void
  /** 停止轮询 */
  stopPolling: () => void
}

/**
 * 任务轮询 Hook
 */
export function useTaskPolling(options: ITaskPollingOptions): ITaskPollingReturn {
  const {
    taskId,
    isActiveTask,
    pollingInterval = 3000,
    onMessagesUpdate,
    onTaskUpdate,
  } = options

  const [isPolling, setIsPolling] = useState(false)
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 获取 Credits 余额
  const fetchCreditsBalance = useUserStore(state => state.fetchCreditsBalance)

  /** 开始轮询 */
  const startPolling = useCallback(() => {
    setIsPolling(true)
  }, [])

  /** 停止轮询 */
  const stopPolling = useCallback(() => {
    setIsPolling(false)
  }, [])

  /** 轮询逻辑 */
  useEffect(() => {
    if (!isPolling || !taskId || isActiveTask) {
      return
    }

    console.log('[TaskPolling] Starting polling for task:', taskId)

    const pollTask = async () => {
      try {
        const result = await agentApi.getTaskDetail(taskId)
        if (result?.code === 0 && result.data?.messages) {
          // 更新消息
          const converted = convertMessages(result.data.messages)
          onMessagesUpdate(converted, result.data.messages)

          // 更新任务信息
          if (onTaskUpdate) {
            onTaskUpdate(result.data)
          }

          // 检测任务是否完成
          if (isTaskCompleted(result.data.messages)) {
            console.log('[TaskPolling] Task completed, stopping polling')
            setIsPolling(false)
            // 任务完成时刷新 Credits 余额
            fetchCreditsBalance()
          }
        }
      } catch (error) {
        console.error('[TaskPolling] Polling failed:', error)
        // 轮询失败不停止，继续尝试
      }
    }

    // 每 N 秒轮询一次
    pollingTimerRef.current = setInterval(pollTask, pollingInterval)

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
    }
  }, [isPolling, taskId, isActiveTask, pollingInterval, onMessagesUpdate, onTaskUpdate, fetchCreditsBalance])

  /** 清理定时器 */
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
    }
  }, [])

  return {
    isPolling,
    startPolling,
    stopPolling,
  }
}

