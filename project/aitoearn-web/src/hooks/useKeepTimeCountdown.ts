/**
 * useKeepTimeCountdown - 任务保留时间倒计时 Hook
 * 根据 keepTime(秒) 和 acceptedAt(起算时间) 计算剩余秒数并每秒递减
 */

import { useEffect, useState } from 'react'

function calcRemaining(keepTime: number, acceptedAt?: string): number {
  if (keepTime <= 0 || !acceptedAt)
    return -1 // -1 表示不限时
  const deadline = new Date(acceptedAt).getTime() + keepTime * 1000
  const remaining = Math.floor((deadline - Date.now()) / 1000)
  return Math.max(remaining, 0)
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds < 0)
    return ''
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function useKeepTimeCountdown(keepTime: number, acceptedAt?: string) {
  const [remaining, setRemaining] = useState(() => calcRemaining(keepTime, acceptedAt))

  useEffect(() => {
    const initial = calcRemaining(keepTime, acceptedAt)
    setRemaining(initial)

    if (initial <= 0)
      return

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [keepTime, acceptedAt])

  return {
    remaining, // 剩余秒数，-1 表示不限时，0 表示已过期
    isExpired: remaining === 0,
    isUnlimited: remaining < 0,
    formatted: formatCountdown(remaining),
  }
}
