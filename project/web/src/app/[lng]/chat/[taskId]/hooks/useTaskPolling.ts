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
  /** 获取当前原始消息列表（用于增量轮询） */
  getCurrentRawMessages?: () => TaskMessage[]
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
    getCurrentRawMessages,
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

    // 用于跟踪当前是否已有最后一条消息（决定使用增量拉取或全量拉取）
    const hasLastMessageRef = { current: false as boolean }

    // 读取当前已有的原始消息，决定初始轮询间隔（无 lastMessageId 则使用 5s 全量拉取）
    const initialRawMessages = getCurrentRawMessages ? getCurrentRawMessages() : []
    let initialLastMessageId: string | undefined
    for (let i = initialRawMessages.length - 1; i >= 0; i--) {
      const uuid = initialRawMessages[i]?.uuid
      if (uuid) {
        initialLastMessageId = uuid
        break
      }
    }
    hasLastMessageRef.current = Boolean(initialLastMessageId)

    const pollTask = async () => {
      try {
        console.log('[TaskPolling] pollTask tick, taskId:', taskId)
        // 获取当前已有的原始消息列表
        const currentRawMessages = getCurrentRawMessages ? getCurrentRawMessages() : []
        console.log('[TaskPolling] currentRawMessages length:', currentRawMessages.length)
        // 计算最后一条消息的 UUID（用于增量拉取）
        let lastMessageId: string | undefined
        for (let i = currentRawMessages.length - 1; i >= 0; i--) {
          const uuid = currentRawMessages[i]?.uuid
          if (uuid) {
            lastMessageId = uuid
            break
          }
        }

        // 如果没有 lastMessageId，执行每 5 秒一次的全量拉取逻辑（接口支持不传 lastMessageId 获取全部消息）
        if (!lastMessageId) {
          const result = await agentApi.getTaskMessages(taskId)
          if (result?.code === 0 && result.data?.messages) {
            const newMessages = result.data.messages
            console.log('[TaskPolling] fetched fullMessages length:', newMessages.length)
            if (!newMessages.length) {
              return
            }

            const mergedMessages = [...newMessages]

            // 更新消息
            const converted = convertMessages(mergedMessages)
            onMessagesUpdate(converted, mergedMessages)

            // 如果本次拉取获得了最后一条消息（即 messages 中存在 uuid），则切换为增量拉取间隔
            let nowHasLast = false
            for (let i = mergedMessages.length - 1; i >= 0; i--) {
              if (mergedMessages[i]?.uuid) {
                nowHasLast = true
                break
              }
            }
            if (!hasLastMessageRef.current && nowHasLast) {
              // 切换为增量拉取间隔（使用传入的 pollingInterval）
              hasLastMessageRef.current = true
              if (pollingTimerRef.current) {
                clearInterval(pollingTimerRef.current)
              }
              pollingTimerRef.current = setInterval(pollTask, pollingInterval)
            }

            // 检测任务是否完成（此处没有最新的 TaskDetail，只能基于消息做兜底判断）
            if (isTaskCompleted(mergedMessages)) {
              console.log('[TaskPolling] Task completed, stopping polling')
              setIsPolling(false)
              // 任务完成时刷新 Credits 余额
              fetchCreditsBalance()
            }
          }

          return
        }

        // 如果存在 lastMessageId，调用增量消息接口，仅获取 lastMessageId 之后的新消息
        const result = await agentApi.getTaskMessages(taskId, lastMessageId)
        if (result?.code === 0 && result.data?.messages) {
          const newMessages = result.data.messages
          console.log('[TaskPolling] fetched newMessages length:', newMessages.length, 'lastMessageId:', lastMessageId)
          if (!newMessages.length) {
            return
          }

          const mergedMessages = [...currentRawMessages, ...newMessages]

          // 更新消息
          const converted = convertMessages(mergedMessages)
          onMessagesUpdate(converted, mergedMessages)

          // 注意：轮询接口 getTaskMessages 只返回消息列表（TaskMessagesVo），不返回完整任务详情（TaskDetail）
          // 如果需要更新任务详情，应该调用 getTaskDetail 接口
          // 这里不调用 onTaskUpdate，因为类型不匹配

          // 检测任务是否完成（此处没有最新的 TaskDetail，只能基于消息做兜底判断）
          if (isTaskCompleted(mergedMessages)) {
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

    // 根据初始是否有 lastMessageId 决定初始轮询间隔（无 lastMessageId 使用 5000ms）
    const initialInterval = hasLastMessageRef.current ? pollingInterval : 5000
    pollingTimerRef.current = setInterval(pollTask, initialInterval)

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
    }
  }, [isPolling, taskId, isActiveTask, pollingInterval, onMessagesUpdate, fetchCreditsBalance, getCurrentRawMessages])

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

