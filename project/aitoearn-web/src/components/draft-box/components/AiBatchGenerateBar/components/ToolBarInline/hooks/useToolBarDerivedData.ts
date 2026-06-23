import type { UseToolBarDerivedDataParams, VideoModelParamInfo } from '../types'
import type { VideoModelInfo } from '@/api/ai/ai.types'
import { useMemo } from 'react'
import {
  getVideoModelAspectRatios,
  getVideoModelDurationLimits,
  getVideoModelResolutions,
  ratioToPreviewSize,
} from '../../../utils/constants'

export function useToolBarDerivedData({
  contentType,
  duration,
  imageAspectRatios,
  imageModelOptions,
  inputVideoDuration,
  isVideoEditMode,
  selectedImageModels,
  selectedVideoModels,
  selectModelsLabel,
  videoAspectRatios,
  videoModelOptions,
  videoModelParams,
  videoModels,
  videoModelSelectionMode,
  videoResolutions,
}: UseToolBarDerivedDataParams) {
  const isVideoMode = contentType === 'video'
  const isVideoMultiSelect = isVideoMode && videoModelSelectionMode === 'multiple'
  const selectedModelValues = isVideoMode ? selectedVideoModels : selectedImageModels

  const selectedVideoModelInfos = useMemo(() => {
    if (!isVideoMode || !videoModels)
      return []
    return selectedVideoModels
      .map(name => videoModels.find(model => model.name === name))
      .filter((model): model is VideoModelInfo => Boolean(model))
  }, [isVideoMode, selectedVideoModels, videoModels])

  const selectedVideoModelParamInfos = useMemo<VideoModelParamInfo[]>(() => {
    return selectedVideoModelInfos.map((model) => {
      const params = videoModelParams[model.name] ?? {}
      const resolutions = getVideoModelResolutions(model)
      const aspectRatios = getVideoModelAspectRatios(model)
      const durationLimits = getVideoModelDurationLimits(
        model,
        params.resolution ?? resolutions[0] ?? '',
        isVideoEditMode,
      )
      return {
        model,
        params,
        resolutions,
        aspectRatios,
        durationLimits,
      }
    })
  }, [isVideoEditMode, selectedVideoModelInfos, videoModelParams])

  const isTimeLimitedModel = useMemo(() => {
    return selectedVideoModelInfos.some(model =>
      model.tags.some(tag => /限时|limited/i.test(tag)),
    )
  }, [selectedVideoModelInfos])

  const supportedRatios = useMemo(() => {
    if (isVideoMode) {
      return videoAspectRatios.map(label => ({
        label,
        ...ratioToPreviewSize(label),
      }))
    }
    return imageAspectRatios.map(label => ({ label, ...ratioToPreviewSize(label) }))
  }, [imageAspectRatios, isVideoMode, videoAspectRatios])

  const currentModelDisplay = useMemo(() => {
    const selectedValues = isVideoMode ? selectedVideoModels : selectedImageModels
    const firstValue = selectedValues[0]
    if (!firstValue)
      return { label: selectModelsLabel, extraCount: 0 }

    const firstLabel = isVideoMode
      ? videoModelOptions.find(model => model.value === firstValue)?.label || firstValue
      : imageModelOptions.find(model => model.value === firstValue)?.label || firstValue

    return { label: firstLabel, extraCount: Math.max(0, selectedValues.length - 1) }
  }, [
    imageModelOptions,
    isVideoMode,
    selectModelsLabel,
    selectedImageModels,
    selectedVideoModels,
    videoModelOptions,
  ])

  const modelOptionsCount = isVideoMode ? (videoModels?.length ?? 0) : imageModelOptions.length

  return {
    currentModelDisplay,
    isTimeLimitedModel,
    isVideoMode,
    isVideoMultiSelect,
    modelOptionsCount,
    selectedModelValues,
    selectedVideoModelInfos,
    selectedVideoModelParamInfos,
    supportedRatios,
  }
}
