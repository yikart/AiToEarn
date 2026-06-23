import type { MouseEvent } from 'react'
import type { UseImageStackRemovalParams } from '../types'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useImageStackRemoval({
  localMedias,
  onLocalMediaRemove,
  onLastMediaRemoved,
}: UseImageStackRemovalParams) {
  const [exitingKeys, setExitingKeys] = useState<Set<string>>(new Set())
  const exitTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const localMediasRef = useRef(localMedias)
  localMediasRef.current = localMedias

  useEffect(
    () => () => {
      exitTimeoutsRef.current.forEach(timer => clearTimeout(timer))
    },
    [],
  )

  const handleDeleteLocalMedia = useCallback(
    (event: MouseEvent, mediaId: string) => {
      event.stopPropagation()
      const exitingKey = `local-${mediaId}`
      if (exitingKeys.has(exitingKey))
        return

      setExitingKeys(prev => new Set(prev).add(exitingKey))
      const timer = setTimeout(() => {
        const index = localMediasRef.current.findIndex(media => media.id === mediaId)
        if (index >= 0) {
          onLocalMediaRemove(index)
          if (localMediasRef.current.length - 1 === 0)
            onLastMediaRemoved()
        }
        setExitingKeys((prev) => {
          const next = new Set(prev)
          next.delete(exitingKey)
          return next
        })
        exitTimeoutsRef.current.delete(timer)
      }, 300)
      exitTimeoutsRef.current.add(timer)
    },
    [exitingKeys, onLastMediaRemoved, onLocalMediaRemove],
  )

  return {
    exitingKeys,
    handleDeleteLocalMedia,
  }
}
