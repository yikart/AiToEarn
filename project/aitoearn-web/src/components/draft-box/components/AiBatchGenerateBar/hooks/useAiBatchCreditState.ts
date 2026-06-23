import type { MutableRefObject } from 'react'
import type { VideoModelInfo, VideoModelType } from '@/api/ai/ai.types'
import type { VideoModelParams } from '@/store/draft-box/draftBoxConfigStore'
import { useEffect, useMemo } from 'react'
import {
  clampDuration,
  getVideoDurationLimits,
  getVideoModelParamsMap,
  shouldUseVideoEditMode,
} from '../utils/helpers'

interface UseAiBatchCreditStateParams {
  configKey: string
  contentType: 'video' | 'image_text'
  isDraftMode: boolean
  quantity: number
  localVideos: unknown[]
  selectedVideoModelInfos: VideoModelInfo[]
  videoModelSelectionMode: 'single' | 'multiple'
  videoModelParams: Record<string, VideoModelParams>
  videoModelResolutions: Record<string, string>
  resolvedVideoModelResolutions: Record<string, string>
  resolution: string
  defaultVideoResolution: string
  duration: number
  aspectRatio: string
  modelType: VideoModelType
  videoDurationMapRef: MutableRefObject<Map<string, number>>
  setDuration: (duration: number) => void
  setVideoModelParams: (params: Record<string, VideoModelParams>) => void
  updateConfig: (
    groupId: string,
    partial: Partial<{
      duration: number
      videoModelParams: Record<string, VideoModelParams>
    }>,
  ) => void
}

export function useAiBatchCreditState({
  configKey,
  contentType,
  isDraftMode,
  quantity,
  localVideos,
  selectedVideoModelInfos,
  videoModelSelectionMode,
  videoModelParams,
  videoModelResolutions,
  resolvedVideoModelResolutions,
  resolution,
  defaultVideoResolution,
  duration,
  aspectRatio,
  modelType,
  videoDurationMapRef,
  setDuration,
  setVideoModelParams,
  updateConfig,
}: UseAiBatchCreditStateParams) {
  const isVideoEditMode
    = localVideos.some(() => true)
      && contentType === 'video'
      && shouldUseVideoEditMode(selectedVideoModelInfos)

  const effectiveQuantity = useMemo(() => {
    if (contentType === 'image_text' && !isDraftMode)
      return 1
    return quantity
  }, [contentType, isDraftMode, quantity])

  const inputVideoDuration = useMemo(() => {
    if (!isVideoEditMode)
      return null
    let total = 0
    videoDurationMapRef.current.forEach(d => (total += d))
    return Math.round(total)
  }, [isVideoEditMode, localVideos, videoDurationMapRef])

  const resolvedVideoModelParams = useMemo(() => {
    const storedParams = videoModelSelectionMode === 'multiple' ? videoModelParams : {}
    return getVideoModelParamsMap(
      selectedVideoModelInfos,
      storedParams,
      videoModelResolutions,
      {
        resolution: resolution || defaultVideoResolution,
        duration: inputVideoDuration ?? duration,
        aspectRatio,
      },
      isVideoEditMode,
    )
  }, [
    aspectRatio,
    defaultVideoResolution,
    duration,
    inputVideoDuration,
    isVideoEditMode,
    selectedVideoModelInfos,
    videoModelParams,
    videoModelResolutions,
    videoModelSelectionMode,
    resolution,
  ])

  const videoDurationLimits = useMemo(() => {
    return getVideoDurationLimits(
      selectedVideoModelInfos,
      resolvedVideoModelResolutions,
      isVideoEditMode,
    )
  }, [selectedVideoModelInfos, resolvedVideoModelResolutions, isVideoEditMode])

  useEffect(() => {
    if (contentType !== 'video' || videoModelSelectionMode === 'multiple')
      return
    if (duration > videoDurationLimits.max) {
      setDuration(videoDurationLimits.max)
      if (modelType) {
        const currentParams
          = resolvedVideoModelParams[modelType] ?? videoModelParams[modelType] ?? {}
        const nextVideoModelParams = {
          ...videoModelParams,
          [modelType]: { ...currentParams, duration: videoDurationLimits.max },
        }
        setVideoModelParams(nextVideoModelParams)
        updateConfig(configKey, {
          duration: videoDurationLimits.max,
          videoModelParams: nextVideoModelParams,
        })
        return
      }
      updateConfig(configKey, { duration: videoDurationLimits.max })
    }
    else if (duration < videoDurationLimits.min) {
      setDuration(videoDurationLimits.min)
      if (modelType) {
        const currentParams
          = resolvedVideoModelParams[modelType] ?? videoModelParams[modelType] ?? {}
        const nextVideoModelParams = {
          ...videoModelParams,
          [modelType]: { ...currentParams, duration: videoDurationLimits.min },
        }
        setVideoModelParams(nextVideoModelParams)
        updateConfig(configKey, {
          duration: videoDurationLimits.min,
          videoModelParams: nextVideoModelParams,
        })
        return
      }
      updateConfig(configKey, { duration: videoDurationLimits.min })
    }
  }, [
    configKey,
    contentType,
    duration,
    modelType,
    resolvedVideoModelParams,
    setDuration,
    setVideoModelParams,
    updateConfig,
    videoDurationLimits,
    videoModelParams,
    videoModelSelectionMode,
  ])

  useEffect(() => {
    if (videoModelSelectionMode === 'multiple')
      return
    const nextDuration
      = inputVideoDuration === null
        ? null
        : clampDuration(inputVideoDuration, videoDurationLimits.min, videoDurationLimits.max)
    if (nextDuration !== null && nextDuration !== duration) {
      setDuration(nextDuration)
      if (modelType) {
        const currentParams
          = resolvedVideoModelParams[modelType] ?? videoModelParams[modelType] ?? {}
        const nextVideoModelParams = {
          ...videoModelParams,
          [modelType]: { ...currentParams, duration: nextDuration },
        }
        setVideoModelParams(nextVideoModelParams)
        updateConfig(configKey, {
          duration: nextDuration,
          videoModelParams: nextVideoModelParams,
        })
        return
      }
      updateConfig(configKey, { duration: nextDuration })
    }
  }, [
    configKey,
    duration,
    inputVideoDuration,
    modelType,
    resolvedVideoModelParams,
    setDuration,
    setVideoModelParams,
    updateConfig,
    videoDurationLimits,
    videoModelParams,
    videoModelSelectionMode,
  ])

  return {
    effectiveQuantity,
    inputVideoDuration,
    isVideoEditMode,
    resolvedVideoModelParams,
    videoDurationLimits,
  }
}
