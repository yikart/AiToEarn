import type { MutableRefObject } from 'react'
import type { getVideoModelsCommonStaticConfig } from '../utils/constants'
import type { DraftContentType, VideoModelInfo } from '@/api/ai/ai.types'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type { DraftBoxConfig } from '@/store/draft-box/draftBoxConfigStore'
import { useCallback } from 'react'
import {
  getAudioDuration,
  getMediaTypeFromFile,
  getVideoMeta,
  isMediaFileFormatAllowed,
} from '@/utils/media'
import { toast } from '@/utils/ui/toast'
import { matchClosestRatio } from '../utils/constants'
import {
  getMediaDuration,
  getMediaDurationLimit,
  getVideoDurationLimits,
  isDurationAboveLimit,
  isDurationBelowLimit,
  isFileSizeAllowed,
  shouldUseVideoEditMode,
} from '../utils/helpers'

type Translate = (key: string, options?: Record<string, number | string | undefined>) => string
type VideoModelConfig = ReturnType<typeof getVideoModelsCommonStaticConfig>

interface UseLocalUploadHandlerParams {
  contentType: DraftContentType
  currentVideoModelConfig: VideoModelConfig
  currentImageMaxInputImages: number
  localImages: IUploadedMedia[]
  localVideos: IUploadedMedia[]
  localAudios: IUploadedMedia[]
  selectedVideoModelInfos: VideoModelInfo[]
  resolvedVideoModelResolutions: Record<string, string>
  uploadMedias: (files: FileList) => void
  aspectRatio: string
  setAspectRatio: (value: string) => void
  configKey: string
  updateConfig: (groupId: string, partial: Partial<DraftBoxConfig>) => void
  t: Translate
  videoDurationMapRef: MutableRefObject<Map<string, number>>
  audioDurationMapRef: MutableRefObject<Map<string, number>>
}

export function useLocalUploadHandler({
  contentType,
  currentVideoModelConfig,
  currentImageMaxInputImages,
  localImages,
  localVideos,
  localAudios,
  selectedVideoModelInfos,
  resolvedVideoModelResolutions,
  uploadMedias,
  aspectRatio,
  setAspectRatio,
  configKey,
  updateConfig,
  t,
  videoDurationMapRef,
  audioDurationMapRef,
}: UseLocalUploadHandlerParams) {
  // 本地上传处理
  const handleLocalUpload = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files)
      const imageFormats
        = contentType === 'image_text'
          ? undefined
          : currentVideoModelConfig.imageInputConstraints?.formats
      const videoFormats = currentVideoModelConfig.videoInputConstraints?.formats
      const audioFormats = currentVideoModelConfig.audioInputConstraints?.formats
      const imageFiles: File[] = []
      const videoFiles: File[] = []
      const audioFiles: File[] = []

      fileArray.forEach((file) => {
        const mediaType = getMediaTypeFromFile(file, { imageFormats, videoFormats, audioFormats })
        if (mediaType === 'image') {
          imageFiles.push(file)
        }
        else if (mediaType === 'video') {
          videoFiles.push(file)
        }
        else if (mediaType === 'audio') {
          audioFiles.push(file)
        }
      })

      // 验证图片数量
      const maxImages
        = contentType === 'image_text'
          ? currentImageMaxInputImages
          : currentVideoModelConfig.maxImages
      const currentImageCount = localImages.length
      if (imageFiles.length > 0 && currentImageCount + imageFiles.length > maxImages) {
        const allowed = Math.max(0, maxImages - currentImageCount)
        if (allowed === 0) {
          toast.warning(t('detail.imageCountExceeded', { max: maxImages }))
          imageFiles.length = 0
        }
        else {
          toast.warning(t('detail.imageCountExceeded', { max: maxImages }))
          imageFiles.splice(allowed)
        }
      }

      // 图文模式不支持音视频上传，过滤掉音视频文件
      const validVideoFiles: File[] = []
      const validAudioFiles: File[] = []
      if (contentType === 'image_text') {
        if (videoFiles.length > 0) {
          toast.warning(t('detail.videoNotSupported'))
        }
        if (audioFiles.length > 0) {
          toast.warning(t('detail.audioNotSupported'))
        }
      }
      else {
        // 验证视频数量
        const maxVideos = currentVideoModelConfig.maxVideos
        if (videoFiles.length > 0 && maxVideos === 0) {
          toast.warning(t('detail.videoNotSupported'))
          videoFiles.length = 0
        }
        if (videoFiles.length > 0 && localVideos.length + videoFiles.length > maxVideos) {
          const allowed = Math.max(0, maxVideos - localVideos.length)
          if (allowed === 0) {
            toast.warning(t('detail.videoCountExceeded', { max: maxVideos }))
            videoFiles.length = 0
          }
          else {
            toast.warning(t('detail.videoCountExceeded', { max: maxVideos }))
            videoFiles.splice(allowed)
          }
        }

        const maxAudios = currentVideoModelConfig.maxAudios
        if (audioFiles.length > 0 && maxAudios === 0) {
          toast.warning(t('detail.audioNotSupported'))
          audioFiles.length = 0
        }
        if (audioFiles.length > 0 && localAudios.length + audioFiles.length > maxAudios) {
          const allowed = Math.max(0, maxAudios - localAudios.length)
          if (allowed === 0) {
            toast.warning(t('detail.audioCountExceeded', { max: maxAudios }))
            audioFiles.length = 0
          }
          else {
            toast.warning(t('detail.audioCountExceeded', { max: maxAudios }))
            audioFiles.splice(allowed)
          }
        }

        const videoConstraint = currentVideoModelConfig.videoInputConstraints
        const audioConstraint = currentVideoModelConfig.audioInputConstraints
        const maxVideoDurationLimit = getMediaDurationLimit(
          videoConstraint,
          currentVideoModelConfig.maxVideoDuration,
        )
        const maxAudioDurationLimit = getMediaDurationLimit(
          audioConstraint,
          currentVideoModelConfig.maxAudioDuration,
        )
        const willUseVideoEditMode = shouldUseVideoEditMode(selectedVideoModelInfos)
        const videoEditDurationLimits = willUseVideoEditMode
          ? getVideoDurationLimits(selectedVideoModelInfos, resolvedVideoModelResolutions, true)
          : null
        const minVideoDuration = Math.max(
          videoConstraint?.minDuration ?? 0,
          videoEditDurationLimits?.min ?? 0,
        )
        const maxVideoDuration = videoEditDurationLimits
          ? Math.min(maxVideoDurationLimit, videoEditDurationLimits.max)
          : maxVideoDurationLimit
        const maxSingleVideoDuration = Math.min(
          videoConstraint?.maxDuration ?? maxVideoDuration,
          maxVideoDuration,
        )
        const maxSingleAudioDuration = audioConstraint?.maxDuration ?? maxAudioDurationLimit
        let currentVideoTotalDuration = localVideos.reduce((sum, media) => {
          return sum + (getMediaDuration(media, videoDurationMapRef.current) ?? 0)
        }, 0)
        let currentAudioTotalDuration = localAudios.reduce((sum, media) => {
          return sum + (getMediaDuration(media, audioDurationMapRef.current) ?? 0)
        }, 0)

        let firstVideoMeta: { width: number, height: number } | null = null
        for (const vf of videoFiles) {
          if (!isMediaFileFormatAllowed(vf, videoConstraint?.formats)) {
            toast.warning(t('detail.videoFormatUnsupported'))
            continue
          }
          if (!isFileSizeAllowed(vf, videoConstraint?.maxSizeMb)) {
            toast.warning(t('detail.videoSizeExceeded', { max: videoConstraint?.maxSizeMb }))
            continue
          }
          try {
            const { duration: vDuration, width: vWidth, height: vHeight } = await getVideoMeta(vf)
            if (minVideoDuration > 0 && isDurationBelowLimit(vDuration, minVideoDuration)) {
              toast.warning(t('detail.videoDurationTooShort', { min: minVideoDuration }))
              continue
            }
            if (isDurationAboveLimit(vDuration, maxSingleVideoDuration)) {
              toast.warning(t('detail.videoDurationExceeded', { max: maxSingleVideoDuration }))
              continue
            }
            if (isDurationAboveLimit(currentVideoTotalDuration + vDuration, maxVideoDuration)) {
              toast.warning(t('detail.videoDurationExceeded', { max: maxVideoDuration }))
              break
            }
            const ratio = vWidth / vHeight
            const pixels = vWidth * vHeight
            if (
              (videoConstraint?.minAspectRatio !== undefined
                && ratio < videoConstraint.minAspectRatio)
              || (videoConstraint?.maxAspectRatio !== undefined
                && ratio > videoConstraint.maxAspectRatio)
              || (videoConstraint?.minWidth !== undefined && vWidth < videoConstraint.minWidth)
              || (videoConstraint?.maxWidth !== undefined && vWidth > videoConstraint.maxWidth)
              || (videoConstraint?.minPixels !== undefined && pixels < videoConstraint.minPixels)
              || (videoConstraint?.maxPixels !== undefined && pixels > videoConstraint.maxPixels)
            ) {
              toast.warning(t('detail.videoNotSupported'))
              continue
            }
            currentVideoTotalDuration += vDuration
            videoDurationMapRef.current.set(vf.name + vf.size, vDuration)
            validVideoFiles.push(vf)
            if (!firstVideoMeta) {
              firstVideoMeta = { width: vWidth, height: vHeight }
            }
          }
          catch {
            toast.error(t('detail.videoLoadFailed'))
          }
        }

        for (const af of audioFiles) {
          if (!isMediaFileFormatAllowed(af, audioConstraint?.formats)) {
            toast.warning(t('detail.audioFormatUnsupported'))
            continue
          }
          if (!isFileSizeAllowed(af, audioConstraint?.maxSizeMb)) {
            toast.warning(t('detail.audioSizeExceeded', { max: audioConstraint?.maxSizeMb }))
            continue
          }
          try {
            const audioDuration = await getAudioDuration(af)
            if (
              audioConstraint?.minDuration !== undefined
              && isDurationBelowLimit(audioDuration, audioConstraint.minDuration)
            ) {
              toast.warning(
                t('detail.audioDurationTooShort', { min: audioConstraint.minDuration }),
              )
              continue
            }
            if (isDurationAboveLimit(audioDuration, maxSingleAudioDuration)) {
              toast.warning(t('detail.audioDurationExceeded', { max: maxSingleAudioDuration }))
              continue
            }
            if (
              isDurationAboveLimit(
                currentAudioTotalDuration + audioDuration,
                maxAudioDurationLimit,
              )
            ) {
              toast.warning(t('detail.audioDurationExceeded', { max: maxAudioDurationLimit }))
              break
            }
            currentAudioTotalDuration += audioDuration
            audioDurationMapRef.current.set(af.name + af.size, audioDuration)
            validAudioFiles.push(af)
          }
          catch {
            toast.error(t('detail.audioLoadFailed'))
          }
        }

        // 用第一个有效视频的宽高自动匹配比例（仅在之前没有视频时）
        if (firstVideoMeta && localVideos.length === 0) {
          const supported = currentVideoModelConfig.supportedRatios
          const matched = matchClosestRatio(
            firstVideoMeta.width,
            firstVideoMeta.height,
            supported,
          )
          if (matched && matched !== aspectRatio) {
            setAspectRatio(matched)
            updateConfig(configKey, { aspectRatio: matched })
          }
        }
      }

      const validFiles = [...imageFiles, ...validVideoFiles, ...validAudioFiles]
      if (validFiles.length > 0) {
        // 构建 FileList
        const dt = new DataTransfer()
        validFiles.forEach(f => dt.items.add(f))
        uploadMedias(dt.files)
      }
    },
    [
      currentVideoModelConfig,
      currentImageMaxInputImages,
      contentType,
      localImages.length,
      localVideos,
      localVideos.length,
      localAudios,
      localAudios.length,
      selectedVideoModelInfos,
      resolvedVideoModelResolutions,
      uploadMedias,
      aspectRatio,
      configKey,
      updateConfig,
      t,
    ],
  )

  // 拖拽事件处理

  return handleLocalUpload
}
