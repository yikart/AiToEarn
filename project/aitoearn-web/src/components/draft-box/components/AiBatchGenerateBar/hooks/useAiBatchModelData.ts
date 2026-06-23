import type { ImageModelInfo, ImageModelPricing, VideoModelInfo, VideoModelType } from '@/api/ai/ai.types'
import { useEffect, useMemo } from 'react'
import {
  getImageModelsCommonAspectRatios,
  getImageModelsMaxInputImages,
  getVideoModelResolutions,
  getVideoModelsCommonStaticConfig,
  getVideoModelStaticConfig,
} from '../utils/constants'
import {
  buildAggregateImagePricing,
  getVideoModelFallbackResolution,
  getVideoModelResolutionMap,
} from '../utils/helpers'
import { usePricingData } from './usePricingData'

interface UseAiBatchModelDataParams {
  selectedImageModels: string[]
  selectedVideoModels: VideoModelType[]
  modelType: VideoModelType
  videoModelResolutions: Record<string, string>
}

export function useAiBatchModelData({
  selectedImageModels,
  selectedVideoModels,
  modelType,
  videoModelResolutions,
}: UseAiBatchModelDataParams) {
  const { pricingData, isLoading } = usePricingData()

  useEffect(() => {}, [
    isLoading,
    pricingData?.imageModels?.length,
    pricingData?.videoModels?.length,
  ])

  const imageModelOptions = useMemo(() => {
    if (!pricingData?.imageModels)
      return []
    return pricingData.imageModels.map(model => ({
      value: model.model,
      label: model.displayName,
      tags: model.tags ?? [],
    }))
  }, [pricingData])

  const selectedImageModelInfos: ImageModelInfo[] = useMemo(() => {
    if (!pricingData?.imageModels)
      return []
    return selectedImageModels
      .map(model => pricingData.imageModels.find(item => item.model === model))
      .filter((model): model is ImageModelInfo => Boolean(model))
  }, [pricingData, selectedImageModels])

  const imagePricing: ImageModelPricing[] = useMemo(() => {
    return buildAggregateImagePricing(selectedImageModelInfos)
  }, [selectedImageModelInfos])

  const currentImageAspectRatios = useMemo(() => {
    return selectedImageModelInfos.length > 0
      ? getImageModelsCommonAspectRatios(selectedImageModelInfos)
      : []
  }, [selectedImageModelInfos])

  const currentImageMaxInputImages = useMemo(() => {
    return getImageModelsMaxInputImages(selectedImageModelInfos)
  }, [selectedImageModelInfos])

  const videoModelOptions = useMemo(() => {
    if (!pricingData?.videoModels)
      return []
    return pricingData.videoModels.map(model => ({ value: model.name, label: model.description || model.name }))
  }, [pricingData])

  const selectedVideoModelInfos: VideoModelInfo[] = useMemo(() => {
    if (!pricingData?.videoModels)
      return []
    return selectedVideoModels
      .map(model => pricingData.videoModels?.find(item => item.name === model))
      .filter((model): model is VideoModelInfo => Boolean(model))
  }, [pricingData, selectedVideoModels])

  const areVideoModelLimitsReady
    = Boolean(pricingData?.videoModels?.length) && selectedVideoModelInfos.length > 0

  const currentVideoModelInfo = selectedVideoModelInfos[0]

  const currentVideoModelConfig = useMemo(() => {
    if (selectedVideoModelInfos.length > 0)
      return getVideoModelsCommonStaticConfig(selectedVideoModelInfos)
    const fallbackModelType = modelType || pricingData?.videoModels?.[0]?.name || ''
    return getVideoModelStaticConfig(fallbackModelType, pricingData?.videoModels)
  }, [modelType, pricingData?.videoModels, selectedVideoModelInfos])

  const currentVideoResolutions = useMemo(() => {
    return getVideoModelResolutions(currentVideoModelInfo)
  }, [currentVideoModelInfo])

  const defaultVideoResolution = useMemo(() => {
    return getVideoModelFallbackResolution(currentVideoModelInfo)
  }, [currentVideoModelInfo])

  const resolvedVideoModelResolutions = useMemo(() => {
    return getVideoModelResolutionMap(selectedVideoModelInfos, videoModelResolutions)
  }, [selectedVideoModelInfos, videoModelResolutions])

  return {
    pricingData,
    imageModelOptions,
    selectedImageModelInfos,
    imagePricing,
    currentImageAspectRatios,
    currentImageMaxInputImages,
    videoModelOptions,
    selectedVideoModelInfos,
    areVideoModelLimitsReady,
    currentVideoModelInfo,
    currentVideoModelConfig,
    currentVideoResolutions,
    defaultVideoResolution,
    resolvedVideoModelResolutions,
  }
}
