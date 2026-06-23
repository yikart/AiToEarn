import type { MutableRefObject, RefObject } from 'react'
import type { MediaMentionItem } from '../components/MediaMentionPromptInput'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type { DraftBoxConfig } from '@/store/draft-box/draftBoxConfigStore'
import { useCallback, useEffect, useMemo } from 'react'
import {
  getMediaDisplayName,
  MEDIA_MENTION_MAX_AUDIOS,
  MEDIA_MENTION_MAX_IMAGES,
  MEDIA_MENTION_MAX_VIDEOS,
  removeUnavailableMediaMentionTokens,
} from '../utils/helpers'

type Translate = (key: string, options?: Record<string, number | string | undefined>) => string

interface UseMediaMentionControlsParams {
  localImages: IUploadedMedia[]
  localVideos: IUploadedMedia[]
  localAudios: IUploadedMedia[]
  handleLocalUpload: (files: FileList) => void
  canRemoveUnavailableMediaMentions: boolean
  mediaMentionUploadInputRef: RefObject<HTMLInputElement>
  promptValueRef: MutableRefObject<string>
  configKey: string
  updateConfig: (groupId: string, partial: Partial<DraftBoxConfig>) => void
  setPromptValue: (value: string) => void
  t: Translate
}

export function useMediaMentionControls({
  localImages,
  localVideos,
  localAudios,
  handleLocalUpload,
  canRemoveUnavailableMediaMentions,
  mediaMentionUploadInputRef,
  promptValueRef,
  configKey,
  updateConfig,
  setPromptValue,
  t,
}: UseMediaMentionControlsParams) {
  const handlePasteFiles = useCallback((files: FileList) => {
    void handleLocalUpload(files)
  }, [handleLocalUpload])

  const handleMediaMentionUploadRequest = useCallback(() => {
    mediaMentionUploadInputRef.current?.click()
  }, [])

  const handleMediaMentionUploadChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      void handleLocalUpload(files)
    }
    event.target.value = ''
  }, [handleLocalUpload])

  const mediaMentions = useMemo<MediaMentionItem[]>(() => {
    const imageLabel = t('detail.mediaMentionImage')
    const videoLabel = t('detail.mediaMentionVideo')
    const audioLabel = t('detail.mediaMentionAudio')

    const imageItems = localImages
      .filter(media => media.url && media.progress === undefined)
      .slice(0, MEDIA_MENTION_MAX_IMAGES)
      .map((media, index) => {
        const value = `Image${index + 1}`
        return {
          value,
          token: `@${value}`,
          type: 'image' as const,
          src: media.url,
          file: media.file,
          displayName: getMediaDisplayName(media, value),
          typeLabel: imageLabel,
          previewTitle: getMediaDisplayName(media, value),
        }
      })

    const videoItems = localVideos
      .filter(media => media.url && media.progress === undefined)
      .slice(0, MEDIA_MENTION_MAX_VIDEOS)
      .map((media, index) => {
        const value = `Video${index + 1}`
        return {
          value,
          token: `@${value}`,
          type: 'video' as const,
          src: media.url,
          file: media.file,
          displayName: getMediaDisplayName(media, value),
          typeLabel: videoLabel,
          previewTitle: getMediaDisplayName(media, value),
        }
      })

    const audioItems = localAudios
      .filter(media => media.url && media.progress === undefined)
      .slice(0, MEDIA_MENTION_MAX_AUDIOS)
      .map((media, index) => {
        const value = `Audio${index + 1}`
        return {
          value,
          token: `@${value}`,
          type: 'audio' as const,
          src: media.url,
          file: media.file,
          displayName: getMediaDisplayName(media, value),
          typeLabel: audioLabel,
          previewTitle: getMediaDisplayName(media, value),
        }
      })

    return [...imageItems, ...videoItems, ...audioItems]
  }, [localAudios, localImages, localVideos, t])

  useEffect(() => {
    if (!canRemoveUnavailableMediaMentions)
      return

    const availableMentionValues = new Set(mediaMentions.map(item => item.value))
    const nextPromptValue = removeUnavailableMediaMentionTokens(
      promptValueRef.current,
      availableMentionValues,
    )
    if (nextPromptValue === promptValueRef.current)
      return

    promptValueRef.current = nextPromptValue
    setPromptValue(nextPromptValue)
    updateConfig(configKey, { promptValue: nextPromptValue })
  }, [canRemoveUnavailableMediaMentions, configKey, mediaMentions, setPromptValue, updateConfig])

  // 上传能力判断

  return {
    handlePasteFiles,
    handleMediaMentionUploadRequest,
    handleMediaMentionUploadChange,
    mediaMentions,
  }
}
