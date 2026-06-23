import type { UseToolBarDraftValuesParams } from '../types'
import type { VideoModelType } from '@/api/ai/ai.types'
import { useCallback, useState } from 'react'

export function useToolBarDraftValues({
  duration,
  onDurationChange,
  onVideoModelParamChange,
}: UseToolBarDraftValuesParams) {
  const [draftDuration, setDraftDuration] = useState<number | null>(null)
  const [draftVideoModelDurations, setDraftVideoModelDurations] = useState<Record<string, number>>({})

  const handleDurationDraftChange = useCallback(([value]: number[]) => {
    if (value !== undefined) {
      setDraftDuration(value)
    }
  }, [])

  const handleDurationCommit = useCallback(
    ([value]: number[]) => {
      setDraftDuration(null)
      if (value !== undefined && value !== duration) {
        onDurationChange(value)
      }
    },
    [duration, onDurationChange],
  )

  const handleVideoModelDurationDraftChange = useCallback(
    (modelName: VideoModelType, value?: number) => {
      if (value === undefined)
        return
      setDraftVideoModelDurations(prev =>
        prev[modelName] === value ? prev : { ...prev, [modelName]: value },
      )
    },
    [],
  )

  const handleVideoModelDurationCommit = useCallback(
    (modelName: VideoModelType, value?: number, currentValue?: number) => {
      setDraftVideoModelDurations((prev) => {
        if (prev[modelName] === undefined)
          return prev
        const next = { ...prev }
        delete next[modelName]
        return next
      })
      if (value !== undefined && value !== currentValue) {
        onVideoModelParamChange(modelName, { duration: value })
      }
    },
    [onVideoModelParamChange],
  )

  return {
    draftDuration,
    draftVideoModelDurations,
    handleDurationCommit,
    handleDurationDraftChange,
    handleVideoModelDurationCommit,
    handleVideoModelDurationDraftChange,
  }
}
