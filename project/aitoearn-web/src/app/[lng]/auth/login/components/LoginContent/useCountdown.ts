/**
 * useCountdown - 验证码倒计时 hook
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const COUNTDOWN_SECONDS = 60

export function useCountdown() {
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const start = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return { countdown, isCounting: countdown > 0, start }
}
