import type { getVideoModelsCommonStaticConfig } from '../utils/constants'
import type { DraftContentType, VideoModelInfo } from '@/api/ai/ai.types'
import { useMemo } from 'react'
import { buildMediaAcceptTypes } from '@/utils/media'
import {
  getPromptsExploreSlugByCreditsScope,
  PROMPTS_EXPLORE_LNG_MAP,
} from '../utils/helpers'

type Translate = (key: string, options?: Record<string, number | string | undefined>) => string
type VideoModelConfig = ReturnType<typeof getVideoModelsCommonStaticConfig>

interface UseAiBatchPromptMetaParams {
  lng: string
  currentVideoModelInfo?: VideoModelInfo
  contentType: DraftContentType
  currentImageMaxInputImages: number
  currentVideoModelConfig: VideoModelConfig
  localImagesCount: number
  localVideosCount: number
  localAudiosCount: number
  t: Translate
}

export function useAiBatchPromptMeta({
  lng,
  currentVideoModelInfo,
  contentType,
  currentImageMaxInputImages,
  currentVideoModelConfig,
  localImagesCount,
  localVideosCount,
  localAudiosCount,
  t,
}: UseAiBatchPromptMetaParams) {
  const promptsExploreUrl = useMemo(() => {
    const lngPath = PROMPTS_EXPLORE_LNG_MAP[lng]
    const promptSlug = getPromptsExploreSlugByCreditsScope(currentVideoModelInfo?.creditsScope)
    return lngPath
      ? `https://youmind.com/${lngPath}/${promptSlug}`
      : `https://youmind.com/${promptSlug}`
  }, [currentVideoModelInfo?.creditsScope, lng])

  const placeholder = useMemo(() => {
    const limitParts: string[] = []
    const imageLimit = contentType === 'image_text' ? currentImageMaxInputImages : currentVideoModelConfig.maxImages

    if (contentType === 'video') {
      if (currentVideoModelConfig.maxVideos > 0) {
        limitParts.push(t('detail.promptPlaceholderVideoLimit', {
          count: currentVideoModelConfig.maxVideos,
          duration: currentVideoModelConfig.maxVideoDuration,
        }))
      }
      if (currentVideoModelConfig.maxAudios > 0) {
        limitParts.push(t('detail.promptPlaceholderAudioLimit', {
          count: currentVideoModelConfig.maxAudios,
          duration: currentVideoModelConfig.maxAudioDuration,
        }))
      }
    }

    if (imageLimit > 0) {
      limitParts.push(t('detail.promptPlaceholderImageLimit', { count: imageLimit }))
    }

    const mentionHint = t('detail.promptPlaceholderMentionHint')
    if (limitParts.length === 0) {
      return mentionHint
    }

    return `${limitParts.join(t('detail.promptPlaceholderSeparator'))}${t('detail.promptPlaceholderMentionSeparator')}${mentionHint}`
  }, [
    contentType,
    currentImageMaxInputImages,
    currentVideoModelConfig.maxAudioDuration,
    currentVideoModelConfig.maxAudios,
    currentVideoModelConfig.maxImages,
    currentVideoModelConfig.maxVideoDuration,
    currentVideoModelConfig.maxVideos,
    t,
  ])

  const maxUploadImages
    = contentType === 'image_text' ? currentImageMaxInputImages : currentVideoModelConfig.maxImages
  const canUploadImage = localImagesCount < maxUploadImages
  const canUploadReferenceMedia = contentType === 'video'
  const canUploadVideo
    = canUploadReferenceMedia
      && currentVideoModelConfig.maxVideos > 0
      && localVideosCount < currentVideoModelConfig.maxVideos
  const canUploadAudio
    = canUploadReferenceMedia
      && currentVideoModelConfig.maxAudios > 0
      && localAudiosCount < currentVideoModelConfig.maxAudios

  const mediaAccept = useMemo(
    () =>
      buildMediaAcceptTypes({
        canUploadImage,
        canUploadVideo,
        canUploadAudio,
        imageFormats:
          contentType === 'image_text'
            ? undefined
            : currentVideoModelConfig.imageInputConstraints?.formats,
        videoFormats: currentVideoModelConfig.videoInputConstraints?.formats,
        audioFormats: currentVideoModelConfig.audioInputConstraints?.formats,
      }),
    [canUploadAudio, canUploadImage, canUploadVideo, contentType, currentVideoModelConfig],
  )

  return {
    promptsExploreUrl,
    placeholder,
    canUploadImage,
    canUploadVideo,
    canUploadAudio,
    mediaAccept,
  }
}
