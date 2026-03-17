/**
 * AI 批量生成轮询 Hook
 * 定时查询生成任务状态，检测到任务完成时触发回调
 */

import { useCallback, useEffect, useRef } from 'react'
import { apiGetDraftGenerationStats } from '@/api/draftGeneration'

interface UseGenerationPollingOptions {
  /** 是否启用轮询（generatingCount > 0 时启用） */
  enabled: boolean
  /** 轮询间隔（毫秒） */
  interval?: number
  /** count 减少（有任务完成）时的回调 */
  onTaskCompleted: () => void
  /** 每次轮询更新 count */
  onCountUpdate: (count: number) => void
}

export function useGenerationPolling({
  enabled,
  interval = 5000,
  onTaskCompleted,
  onCountUpdate,
}: UseGenerationPollingOptions) {
  const prevCountRef = useRef<number | null>(null)
  const isRequestRunningRef = useRef(false)

  // 用 ref 保持回调最新引用，避免轮询重启
  const onTaskCompletedRef = useRef(onTaskCompleted)
  onTaskCompletedRef.current = onTaskCompleted
  const onCountUpdateRef = useRef(onCountUpdate)
  onCountUpdateRef.current = onCountUpdate

  const poll = useCallback(async () => {
    if (isRequestRunningRef.current)
      return
    isRequestRunningRef.current = true

    try {
      const res = await apiGetDraftGenerationStats()
      if (res?.data) {
        const newCount = res.data.generatingCount || 0
        onCountUpdateRef.current(newCount)

        // 如果之前有记录的 count 且新 count 更小，说明有任务完成了
        if (prevCountRef.current !== null && newCount < prevCountRef.current) {
          onTaskCompletedRef.current()
        }

        prevCountRef.current = newCount
      }
    }
    catch {
      // 静默失败
    }
    finally {
      isRequestRunningRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      prevCountRef.current = null
      return
    }

    // 立即执行一次
    poll()

    const timer = setInterval(poll, interval)
    return () => clearInterval(timer)
  }, [enabled, interval, poll])
}
