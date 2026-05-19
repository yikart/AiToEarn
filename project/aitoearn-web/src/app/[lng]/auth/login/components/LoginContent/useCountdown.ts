/**
 * useCountdown - 验证码倒计时 hook
 */

import { useCallback, useEffect, useState } from 'react'

const COUNTDOWN_SECONDS = 60

function getRemainingSeconds(deadlineAt: number) {
  return Math.max(Math.ceil((deadlineAt - Date.now()) / 1000), 0)
}

export function useCountdown() {
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)

  const start = useCallback(() => {
    const nextDeadlineAt = Date.now() + COUNTDOWN_SECONDS * 1000
    setDeadlineAt(nextDeadlineAt)
    setCountdown(COUNTDOWN_SECONDS)
  }, [])

  useEffect(() => {
    if (!deadlineAt) {
      setCountdown(0)
      return
    }

    const syncCountdown = () => {
      const remaining = getRemainingSeconds(deadlineAt)
      setCountdown(remaining)
      return remaining
    }

    if (syncCountdown() <= 0)
      return

    const timer = setInterval(() => {
      if (syncCountdown() <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCountdown()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [deadlineAt])

  return { countdown, isCounting: countdown > 0, start }
}
