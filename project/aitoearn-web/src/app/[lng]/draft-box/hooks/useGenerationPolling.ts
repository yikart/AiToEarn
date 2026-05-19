/**
 * AI 批量生成轮询 Hook
 * 定时查询生成任务详情，检测到任务完成时触发回调
 */

import type { DraftGenerationTask } from '@/api/draftGeneration'
import { useCallback, useEffect, useRef } from 'react'
import { apiQueryDraftGenerationTasks } from '@/api/draftGeneration'

const QUERY_BATCH_SIZE = 10

function chunkTaskIds(taskIds: string[]) {
  const chunks: string[][] = []
  for (let i = 0; i < taskIds.length; i += QUERY_BATCH_SIZE) {
    chunks.push(taskIds.slice(i, i + QUERY_BATCH_SIZE))
  }
  return chunks
}

interface UseGenerationPollingOptions {
  /** 是否启用轮询 */
  enabled: boolean
  /** 需要查询的生成任务 ID */
  taskIds: string[]
  /** 轮询间隔（毫秒） */
  interval?: number
  /** 每次轮询返回任务详情 */
  onTasksUpdate: (tasks: DraftGenerationTask[]) => void
  /** count 减少（有任务完成）时的回调 */
  onTaskCompleted: () => void
  /** 每次轮询更新 count */
  onCountUpdate?: (count: number) => void
}

export function useGenerationPolling({
  enabled,
  taskIds,
  interval = 5000,
  onTasksUpdate,
  onTaskCompleted,
  onCountUpdate,
}: UseGenerationPollingOptions) {
  const prevCountRef = useRef<number | null>(null)
  const isRequestRunningRef = useRef(false)
  const taskIdsRef = useRef(taskIds)
  taskIdsRef.current = taskIds

  // 用 ref 保持回调最新引用，避免轮询重启
  const onTaskCompletedRef = useRef(onTaskCompleted)
  onTaskCompletedRef.current = onTaskCompleted
  const onCountUpdateRef = useRef(onCountUpdate)
  onCountUpdateRef.current = onCountUpdate
  const onTasksUpdateRef = useRef(onTasksUpdate)
  onTasksUpdateRef.current = onTasksUpdate

  const poll = useCallback(async () => {
    if (isRequestRunningRef.current)
      return
    const currentTaskIds = taskIdsRef.current
    if (currentTaskIds.length === 0)
      return

    isRequestRunningRef.current = true

    try {
      const results = await Promise.all(
        chunkTaskIds(currentTaskIds).map(async (ids) => {
          const res = await apiQueryDraftGenerationTasks(ids)
          return res?.data || []
        }),
      )
      const tasks = results.flat()
      const newCount = tasks.filter(task => task.status === 'generating').length
      onTasksUpdateRef.current(tasks)
      onCountUpdateRef.current?.(newCount)

      // 如果之前有记录的 count 且新 count 更小，说明有任务完成了
      if (prevCountRef.current !== null && newCount < prevCountRef.current) {
        onTaskCompletedRef.current()
      }

      prevCountRef.current = newCount
    }
    catch {
      // 静默失败
    }
    finally {
      isRequestRunningRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled || taskIds.length === 0) {
      prevCountRef.current = null
      return
    }

    // 立即执行一次
    poll()

    const timer = setInterval(poll, interval)
    return () => clearInterval(timer)
  }, [enabled, interval, poll, taskIds.length])
}
