import type { getVideoModelsCommonStaticConfig } from '../utils/constants'
import type { DraftContentType, ImageModelPricing, ImageModelType, ImageTextDraftType, VideoDraftType, VideoModelType } from '@/api/ai/ai.types'
import type { PlatType } from '@/app/config/platConfig'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type { VideoModelParams } from '@/store/draft-box/draftBoxConfigStore'
import { useCallback } from 'react'
import { toast } from '@/utils/ui/toast'

type Translate = (key: string, options?: Record<string, number | string | undefined>) => string
type VideoModelConfig = ReturnType<typeof getVideoModelsCommonStaticConfig>

interface BatchGenerationResult {
  success: boolean
  successCount: number
  failedCount: number
  errorMessage?: string
}

interface VideoModelInput {
  modelType: VideoModelType
  resolution?: string
  duration?: number
  aspectRatio?: string
}

interface UseAiBatchSubmitHandlerParams {
  isUploading: boolean
  promptValue: string
  isDraftMode: boolean
  captionSystemPrompt: string
  localImages: IUploadedMedia[]
  localVideos: IUploadedMedia[]
  localAudios: IUploadedMedia[]
  contentType: DraftContentType
  selectedImageModels: ImageModelType[]
  selectedVideoModels: VideoModelType[]
  videoModelSelectionMode: 'single' | 'multiple'
  currentImageAspectRatios: string[]
  imagePricing: ImageModelPricing[]
  currentVideoModelConfig: VideoModelConfig
  resolvedVideoModelParams: Record<string, VideoModelParams>
  effectiveQuantity: number
  imageCount: number
  aspectRatio: string
  duration: number
  groupId?: string
  imageSize: string
  effectiveSelectedPlatforms: PlatType[]
  createImageTextBatchGenerationWithModels: (
    quantity: number,
    models: ImageModelType[],
    prompt: string,
    imageCount: number,
    aspectRatio: string,
    imageUrls: string[] | undefined,
    groupId: string | undefined,
    imageSize: string,
    platforms: PlatType[] | undefined,
    mode: ImageTextDraftType,
    captionPrompt: string | undefined,
  ) => Promise<BatchGenerationResult>
  createBatchGenerationWithModels: (
    quantity: number,
    modelInputs: VideoModelInput[],
    duration: number,
    aspectRatio: string,
    prompt: string | undefined,
    imageUrls: string[] | undefined,
    videoUrls: string[] | undefined,
    audioUrls: string[] | undefined,
    groupId: string | undefined,
    platforms: PlatType[] | undefined,
    mode: VideoDraftType,
    captionPrompt: string | undefined,
  ) => Promise<BatchGenerationResult>
  onGenerated?: () => void
  t: Translate
}

export function useAiBatchSubmitHandler({
  isUploading,
  promptValue,
  isDraftMode,
  captionSystemPrompt,
  localImages,
  localVideos,
  localAudios,
  contentType,
  selectedImageModels,
  selectedVideoModels,
  videoModelSelectionMode,
  currentImageAspectRatios,
  imagePricing,
  currentVideoModelConfig,
  resolvedVideoModelParams,
  effectiveQuantity,
  imageCount,
  aspectRatio,
  duration,
  groupId,
  imageSize,
  effectiveSelectedPlatforms,
  createImageTextBatchGenerationWithModels,
  createBatchGenerationWithModels,
  onGenerated,
  t,
}: UseAiBatchSubmitHandlerParams) {
  const handleSubmit = useCallback(async () => {
    // 上传中拦截
    if (isUploading) {
      toast.warning(t('detail.mediaUploading'))
      return
    }

    // 提示词验证
    if (!promptValue.trim()) {
      toast.warning(t('detail.promptRequired'))
      return
    }

    const captionPromptForSubmit = isDraftMode ? captionSystemPrompt.trim() : ''

    const imageUrls = localImages.filter(m => m.url).map(m => m.url)

    if (contentType === 'image_text') {
      if (selectedImageModels.length === 0) {
        toast.warning(t('detail.selectModelRequired'))
        return
      }
      if (currentImageAspectRatios.length === 0 || imagePricing.length === 0) {
        toast.warning(t('detail.noCommonModelParams'))
        return
      }

      const result = await createImageTextBatchGenerationWithModels(
        effectiveQuantity,
        selectedImageModels,
        promptValue.trim(),
        imageCount,
        aspectRatio,
        imageUrls.length > 0 ? imageUrls : undefined,
        groupId,
        imageSize,
        effectiveSelectedPlatforms.length > 0 ? effectiveSelectedPlatforms : undefined,
        isDraftMode ? 'draft' : 'image',
        captionPromptForSubmit || undefined,
      )
      if (result.success) {
        if (result.failedCount > 0) {
          toast.warning(
            t('detail.multiModelPartialSuccess', {
              success: result.successCount,
              failed: result.failedCount,
            }),
          )
        }
        else {
          toast.success(t('detail.imageTextGenerated'))
        }
        onGenerated?.()
      }
      else {
        toast.error(result.errorMessage || t('detail.multiModelGenerateFailed'))
      }
    }
    else {
      if (selectedVideoModels.length === 0) {
        toast.warning(t('detail.selectModelRequired'))
        return
      }
      if (
        videoModelSelectionMode === 'single'
        && currentVideoModelConfig.supportedRatios.size === 0
      ) {
        toast.warning(t('detail.noCommonModelParams'))
        return
      }
      const hasInvalidVideoModelParams = selectedVideoModels.some((model) => {
        const params = resolvedVideoModelParams[model]
        return !params?.aspectRatio || params.duration === undefined
      })
      if (hasInvalidVideoModelParams) {
        toast.warning(t('detail.noCommonModelParams'))
        return
      }

      const videoUrls = localVideos.filter(v => v.url).map(v => v.url)
      const audioUrls = localAudios.filter(a => a.url).map(a => a.url)
      const modelInputs = selectedVideoModels.map(model => ({
        modelType: model,
        resolution: resolvedVideoModelParams[model]?.resolution || undefined,
        duration: resolvedVideoModelParams[model]?.duration,
        aspectRatio: resolvedVideoModelParams[model]?.aspectRatio,
      }))

      const result = await createBatchGenerationWithModels(
        effectiveQuantity,
        modelInputs,
        duration,
        aspectRatio,
        promptValue.trim() || undefined,
        imageUrls.length > 0 ? imageUrls : undefined,
        videoUrls.length > 0 ? videoUrls : undefined,
        audioUrls.length > 0 ? audioUrls : undefined,
        groupId,
        effectiveSelectedPlatforms.length > 0 ? effectiveSelectedPlatforms : undefined,
        isDraftMode ? 'draft' : 'video',
        captionPromptForSubmit || undefined,
      )
      if (result.success) {
        if (result.failedCount > 0) {
          toast.warning(
            t('detail.multiModelPartialSuccess', {
              success: result.successCount,
              failed: result.failedCount,
            }),
          )
        }
        else {
          toast.success(t('detail.aiBatchGenerate'))
        }
        onGenerated?.()
      }
      else {
        toast.error(result.errorMessage || t('detail.multiModelGenerateFailed'))
      }
    }
  }, [
    promptValue,
    aspectRatio,
    duration,
    localImages,
    localVideos,
    localAudios,
    effectiveQuantity,
    createBatchGenerationWithModels,
    createImageTextBatchGenerationWithModels,
    contentType,
    selectedImageModels,
    selectedVideoModels,
    resolvedVideoModelParams,
    videoModelSelectionMode,
    currentImageAspectRatios.length,
    imagePricing.length,
    currentVideoModelConfig.supportedRatios,
    imageCount,
    isUploading,
    t,
    groupId,
    onGenerated,
    effectiveSelectedPlatforms,
    isDraftMode,
    captionSystemPrompt,
  ])

  // Prompts 探索页 URL（根据当前模型族切换 grok / seedance 提示词页）

  return handleSubmit
}
