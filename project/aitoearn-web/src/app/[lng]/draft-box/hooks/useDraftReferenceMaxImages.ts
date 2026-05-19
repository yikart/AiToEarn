'use client'

import { useMemo } from 'react'
import { DEFAULT_MAX_INPUT_IMAGES, getVideoModelStaticConfig } from '@/app/[lng]/draft-box/components/AiBatchGenerateBar/constants'
import { usePricingData } from '@/app/[lng]/draft-box/components/AiBatchGenerateBar/usePricingData'
import { useDraftBoxConfigStore } from '../draftBoxConfigStore'

/**
 * useDraftReferenceMaxImages - 读取当前草稿箱 AI 参考文件图片上限
 * 复用 AI 批量生成栏的当前内容类型与模型配置，避免不同入口各自维护限制
 */
export function useDraftReferenceMaxImages(groupId: string) {
  const { pricingData } = usePricingData()
  const configSnapshot = useDraftBoxConfigStore(state => state.configs[groupId])
  const getConfig = useDraftBoxConfigStore(state => state.getConfig)

  const config = configSnapshot ?? getConfig(groupId)

  return useMemo(() => {
    if (config.contentType === 'image_text') {
      const currentImageModelInfo = pricingData?.imageModels?.find(model => model.model === config.imageModel)
      return currentImageModelInfo?.maxInputImages ?? DEFAULT_MAX_INPUT_IMAGES
    }

    const fallbackVideoModelType = config.modelType || pricingData?.videoModels?.[0]?.name || ''
    return getVideoModelStaticConfig(fallbackVideoModelType, pricingData?.videoModels).maxImages
  }, [config.contentType, config.imageModel, config.modelType, pricingData])
}
