import { useEffect, useRef } from 'react'

interface UseAutoPublishOnReadyOptions {
  enabled?: boolean
  open?: boolean
  ready: boolean
  selectedCount: number
  triggerPublish: () => boolean
}

export function useAutoPublishOnReady({
  enabled = false,
  open = true,
  ready,
  selectedCount,
  triggerPublish,
}: UseAutoPublishOnReadyOptions) {
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (!open) {
      hasTriggeredRef.current = false
      return
    }

    if (!enabled || hasTriggeredRef.current || !ready || selectedCount !== 1)
      return

    const timer = window.setTimeout(() => {
      hasTriggeredRef.current = true
      triggerPublish()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [enabled, open, ready, selectedCount, triggerPublish])
}
