import type { AiBatchGenerateBarProps } from '../types'
import type { DraftContentType, ImageModelInfo, VideoModelInfo, VideoModelType } from '@/api/ai/ai.types'
import type { PlatType } from '@/app/config/platConfig'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type {
  IPersistedMedia,
  ModelSelectionMode,
  VideoModelParams,
} from '@/store/draft-box/draftBoxConfigStore'
import isEqual from 'lodash/isEqual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useTaskPlatforms } from '@/hooks/usePlatformMetadata'
import { useGetClientLng } from '@/hooks/useSystem'
import { useDraftBoxConfigStore } from '@/store/draft-box/draftBoxConfigStore'
import { usePlanDetailStore } from '@/store/draft-box/planDetailStore'
import { cn } from '@/utils/className'
import { toast } from '@/utils/ui/toast'
import {
  buildAiBatchGenerateBarInitialState,
  useAiBatchGenerateBarLocalState,
  useAiBatchGenerateBarStoreActions,
} from '../store'
import styles from '../styles/AiBatchGenerateBar.module.scss'
import {
  getImageModelsCommonAspectRatios,
  getImageModelsMaxInputImages,
  getVideoModelDefaultResolution,
  getVideoModelResolutions,
  getVideoModelsCommonStaticConfig,
} from '../utils/constants'
import {
  buildAggregateImagePricing,
  buildPersistedMediaSignature,
  getDefaultVideoAspectRatio,
  getMediaDuration,
  getMediaDurationKeys,
  getSeededVideoModelParamsMap,
  getVideoModelFallbackResolution,
  getVideoModelParamsMap,
  getVideoModelParamsResolutionMap,
  getVideoModelResolutionMap,
  includesExactStringOption,
  includesOption,
  normalizeSelectedValues,
  PROMPT_MAX_LENGTH,
  removeAndReindexMediaMentionTokensAfterRemove,
  toPersistedLocalMedia,
} from '../utils/helpers'
import { useAiBatchCreditState } from './useAiBatchCreditState'
import { useAiBatchModelData } from './useAiBatchModelData'
import { useAiBatchPlatformPromptState } from './useAiBatchPlatformPromptState'
import { useAiBatchPromptMeta } from './useAiBatchPromptMeta'
import { useAiBatchSubmitHandler } from './useAiBatchSubmitHandler'
import { useDragUploadHandlers } from './useDragUploadHandlers'
import { useLocalUploadHandler } from './useLocalUploadHandler'
import { useMediaMentionControls } from './useMediaMentionControls'

export function useAiBatchGenerateBarController({
  groupId,
  onGenerated,
  className,
  forceDraftMode = false,
}: AiBatchGenerateBarProps) {
  const { t } = useTransClient('brandPromotion')
  const lng = useGetClientLng()

  // 配置 key：按 groupId 隔离
  const configKey = groupId || '__default__'

  // Store：按草稿箱隔离的持久化配置
  const { configSnapshot, getConfig, updateConfig, _hasHydrated } = useDraftBoxConfigStore(
    useShallow(state => ({
      configSnapshot: state.configs[configKey],
      getConfig: state.getConfig,
      updateConfig: state.updateConfig,
      _hasHydrated: state._hasHydrated,
    })),
  )

  const config = configSnapshot ?? getConfig(configKey)

  // Store：生成状态
  const {
    isGeneratingBatch,
    createBatchGenerationWithModels,
    createImageTextBatchGenerationWithModels,
  } = usePlanDetailStore(
    useShallow(state => ({
      isGeneratingBatch: state.isGeneratingBatch,
      createBatchGenerationWithModels: state.createBatchGenerationWithModels,
      createImageTextBatchGenerationWithModels: state.createImageTextBatchGenerationWithModels,
    })),
  )

  const taskPlatforms = useTaskPlatforms()
  // 计算当前区域可用平台
  const availablePlatformKey = taskPlatforms.map(([plat]) => plat).join('|')
  const availablePlatforms = useMemo<PlatType[]>(() => {
    if (!availablePlatformKey)
      return []
    return availablePlatformKey.split('|') as PlatType[]
  }, [availablePlatformKey])

  const defaultPlatforms = availablePlatforms

  const initialLocalState = useMemo(() => {
    return buildAiBatchGenerateBarInitialState({
      config,
      forceDraftMode,
      availablePlatforms,
    })
  }, [availablePlatforms, config, forceDraftMode])

  const {
    initializeLocalState,
    replaceLocalState,
    patchLocalState,
    setPromptValue,
    setPromptEditorOpen,
    setAspectRatio,
    setDuration,
    setResolution,
    setModelType,
    setSelectedVideoModels,
    setVideoModelSelectionMode,
    setVideoModelResolutions,
    setVideoModelParams,
    setContentType,
    setImageModel,
    setSelectedImageModels,
    setImageModelSelectionMode,
    setImageCount,
    setImageSize,
    setQuantity,
    setIsDraftMode,
    setCaptionSystemPrompt,
    setCaptionSystemPromptDefault,
    setMoreOptionsOpen,
    setSelectedPlatforms,
  } = useAiBatchGenerateBarStoreActions(configKey)

  useEffect(() => {
    initializeLocalState(initialLocalState)
  }, [configKey, initialLocalState, initializeLocalState])

  const {
    promptValue,
    promptEditorOpen,
    aspectRatio,
    duration,
    resolution,
    modelType,
    selectedVideoModels,
    videoModelSelectionMode,
    videoModelResolutions,
    videoModelParams,
    contentType,
    imageModel,
    selectedImageModels,
    imageModelSelectionMode,
    imageCount,
    imageSize,
    quantity,
    isDraftMode,
    captionSystemPrompt,
    captionSystemPromptDefault,
    moreOptionsOpen,
    selectedPlatforms,
  } = useAiBatchGenerateBarLocalState(configKey, initialLocalState)

  const replaceWithConfig = useCallback((nextConfig: typeof config) => {
    replaceLocalState(
      buildAiBatchGenerateBarInitialState({
        config: nextConfig,
        forceDraftMode,
        availablePlatforms,
      }),
    )
  }, [availablePlatforms, forceDraftMode, replaceLocalState])

  const promptValueRef = useRef(promptValue)
  const captionSystemPromptRef = useRef(captionSystemPrompt)
  const captionSystemPromptDefaultRef = useRef(captionSystemPromptDefault)
  // 追踪上一次的 configKey，用于同步 effect 检测切换
  const prevConfigKeyRef = useRef(configKey)
  const isMediaInitializedRef = useRef(false)
  const lastAppliedConfigSnapshotSignatureRef = useRef<string | null>(null)
  const lastRestoredMediaSignatureRef = useRef<string | null>(null)
  const [mediaRestoreState, setMediaRestoreState] = useState(() => ({
    configKey,
    ready: false,
  }))
  promptValueRef.current = promptValue
  captionSystemPromptRef.current = captionSystemPrompt
  captionSystemPromptDefaultRef.current = captionSystemPromptDefault

  // Pricing 数据
  const {
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
  } = useAiBatchModelData({
    selectedImageModels,
    selectedVideoModels,
    modelType,
    videoModelResolutions,
  })

  useEffect(() => {
    if (!pricingData?.imageModels?.length) {
      return
    }

    const availableModels = pricingData.imageModels.map(model => model.model)
    const nextSelectedModels = normalizeSelectedValues(
      selectedImageModels,
      availableModels,
      imageModel,
    )
    const nextPrimaryModel = nextSelectedModels[0] ?? ''
    const nextModelInfos = nextSelectedModels
      .map(model => pricingData.imageModels.find(item => item.model === model))
      .filter((model): model is ImageModelInfo => Boolean(model))
    const nextPricing = buildAggregateImagePricing(nextModelInfos)
    const nextRatios = getImageModelsCommonAspectRatios(nextModelInfos)

    if (!isEqual(nextSelectedModels, selectedImageModels)) {
      setSelectedImageModels(nextSelectedModels)
      updateConfig(configKey, { selectedImageModels: nextSelectedModels })
    }

    if (nextPrimaryModel && nextPrimaryModel !== imageModel) {
      setImageModel(nextPrimaryModel)
      updateConfig(configKey, { imageModel: nextPrimaryModel })
    }

    // 校验 imageSize 是否在当前模型定价中
    if (
      nextPricing.length > 0
      && !includesOption(
        nextPricing.map(p => p.resolution),
        imageSize,
      )
    ) {
      const firstSize = nextPricing[0]?.resolution ?? '1K'
      setImageSize(firstSize)
      updateConfig(configKey, { imageSize: firstSize })
    }
    // 图文模式下校验比例是否在当前图片模型支持范围内
    if (contentType === 'image_text') {
      if (nextRatios.length > 0 && !includesOption(nextRatios, aspectRatio)) {
        const firstRatio = nextRatios[0] ?? '1:1'
        setAspectRatio(firstRatio)
        updateConfig(configKey, { aspectRatio: firstRatio })
      }
    }
  }, [
    pricingData,
    selectedImageModels,
    imageModel,
    imageSize,
    contentType,
    aspectRatio,
    configKey,
    updateConfig,
  ])

  // pricing 加载后校验视频模型与分辨率是否可用
  useEffect(() => {
    if (!pricingData?.videoModels?.length) {
      return
    }

    const availableModels = pricingData.videoModels.map(model => model.name)
    const nextSelectedModels = normalizeSelectedValues(
      selectedVideoModels,
      availableModels,
      modelType,
    )
    const nextPrimaryModel = nextSelectedModels[0] ?? ''
    const nextModelInfos = nextSelectedModels
      .map(model => pricingData.videoModels?.find(item => item.name === model))
      .filter((model): model is VideoModelInfo => Boolean(model))
    const nextConfig = getVideoModelsCommonStaticConfig(nextModelInfos)
    const nextResolutionMap = getVideoModelResolutionMap(nextModelInfos, videoModelResolutions)

    if (!isEqual(nextSelectedModels, selectedVideoModels)) {
      setSelectedVideoModels(nextSelectedModels)
      updateConfig(configKey, { selectedVideoModels: nextSelectedModels })
    }

    if (nextPrimaryModel && nextPrimaryModel !== modelType) {
      setModelType(nextPrimaryModel)
      updateConfig(configKey, { modelType: nextPrimaryModel })
    }

    if (!isEqual(nextResolutionMap, videoModelResolutions)) {
      setVideoModelResolutions(nextResolutionMap)
      updateConfig(configKey, { videoModelResolutions: nextResolutionMap })
    }

    const primaryResolutions = getVideoModelResolutions(nextModelInfos[0])
    if (primaryResolutions.length > 0 && !includesExactStringOption(primaryResolutions, resolution)) {
      const nextResolution
        = nextResolutionMap[nextPrimaryModel] ?? getVideoModelFallbackResolution(nextModelInfos[0])
      setResolution(nextResolution)
      updateConfig(configKey, { resolution: nextResolution })
    }

    if (
      contentType === 'video'
      && nextConfig.supportedRatios.size > 0
      && !includesExactStringOption([...nextConfig.supportedRatios], aspectRatio)
    ) {
      const nextRatio = nextModelInfos.length === 1 && nextModelInfos[0]
        ? getDefaultVideoAspectRatio(nextModelInfos[0], aspectRatio)
        : ([...nextConfig.supportedRatios][0] ?? '9:16')
      setAspectRatio(nextRatio)
      updateConfig(configKey, { aspectRatio: nextRatio })
    }
  }, [
    pricingData,
    selectedVideoModels,
    modelType,
    resolution,
    contentType,
    aspectRatio,
    configKey,
    updateConfig,
    videoModelResolutions,
  ])

  // 旧用户数据迁移：jimeng/grok → 第一个可用视频模型
  useEffect(() => {
    if (config.modelType === 'jimeng' || config.modelType === 'grok') {
      const fallbackModel = pricingData?.videoModels?.[0]
      const fallback = fallbackModel?.name ?? ('' as VideoModelType)
      const fallbackResolution = getVideoModelDefaultResolution(fallbackModel)
      updateConfig(configKey, {
        modelType: fallback,
        videoModelResolutions:
            fallback && fallbackResolution ? { [fallback]: fallbackResolution } : {},
        videoModelParams: fallback
          ? {
              [fallback]: {
                resolution: fallbackResolution,
                duration,
                aspectRatio,
              },
            }
          : {},
      })
      setModelType(fallback)
      setResolution(fallbackResolution)
      setVideoModelResolutions(
        fallback && fallbackResolution ? { [fallback]: fallbackResolution } : {},
      )
      setVideoModelParams(
        fallback
          ? {
              [fallback]: {
                resolution: fallbackResolution,
                duration,
                aspectRatio,
              },
            }
          : {},
      )
      setSelectedVideoModels(fallback ? [fallback] : [])
      updateConfig(configKey, { selectedVideoModels: fallback ? [fallback] : [] })
    }
  }, [pricingData, config.modelType, configKey, updateConfig, duration, aspectRatio])

  // 本地上传媒体
  const {
    medias: localMedias,
    setMedias,
    isUploading,
    handleMediasChange: uploadMedias,
    handleMediaRemove: removeLocalMedia,
    clearMedias,
  } = useMediaUpload()
  const localMediasRef = useRef<IUploadedMedia[]>(localMedias)
  const mediaMentionUploadInputRef = useRef<HTMLInputElement>(null)
  localMediasRef.current = localMedias
  // 音视频时长追踪
  const videoDurationMapRef = useRef<Map<string, number>>(new Map())
  const audioDurationMapRef = useRef<Map<string, number>>(new Map())

  // 包装删除：同步清理媒体时长缓存
  const handleLocalMediaRemove = useCallback(
    (index: number) => {
      const media = localMedias[index]
      const beforePromptValue = promptValueRef.current
      const nextPromptValue = removeAndReindexMediaMentionTokensAfterRemove(
        beforePromptValue,
        media,
        localMedias,
      )
      if (nextPromptValue !== beforePromptValue) {
        promptValueRef.current = nextPromptValue
        setPromptValue(nextPromptValue)
        updateConfig(configKey, { promptValue: nextPromptValue })
      }
      if (media?.type === 'video') {
        getMediaDurationKeys(media).forEach(key => videoDurationMapRef.current.delete(key))
      }
      if (media?.type === 'audio') {
        getMediaDurationKeys(media).forEach(key => audioDurationMapRef.current.delete(key))
      }
      removeLocalMedia(index)
    },
    [configKey, localMedias, removeLocalMedia, updateConfig],
  )

  // 上传完成后自动同步媒体到 store 持久化
  useEffect(() => {
    // 守卫 1：hydration 完成前不同步，防止空 medias 覆写 IndexedDB 数据
    if (!_hasHydrated)
      return
      // 守卫 2：configKey 刚变化时跳过，此时 localMedias 还是旧草稿箱的数据
    if (prevConfigKeyRef.current !== configKey) {
      prevConfigKeyRef.current = configKey
      isMediaInitializedRef.current = false
      return
    }
    // 守卫 3：媒体尚未从 store 恢复前不同步，防止空 localMedias 覆写持久化数据
    if (!isMediaInitializedRef.current)
      return
    const completed: IPersistedMedia[] = localMedias.flatMap((m) => {
      const persistedMedia = toPersistedLocalMedia(m)
      if (!persistedMedia)
        return []
      return [
        {
          ...persistedMedia,
          duration:
              m.type === 'video'
                ? getMediaDuration(m, videoDurationMapRef.current)
                : m.type === 'audio'
                  ? getMediaDuration(m, audioDurationMapRef.current)
                  : undefined,
        },
      ]
    })
    const storedPersistedMedias = getConfig(configKey).persistedMedias ?? []
    if (
      buildPersistedMediaSignature(storedPersistedMedias)
      === buildPersistedMediaSignature(completed)
    ) {
      return
    }
    updateConfig(configKey, { persistedMedias: completed })
  }, [localMedias, configKey, getConfig, updateConfig, _hasHydrated])

  // 派生
  const localImages = useMemo(() => localMedias.filter(m => m.type === 'image'), [localMedias])
  const localVideos = useMemo(() => localMedias.filter(m => m.type === 'video'), [localMedias])
  const localAudios = useMemo(() => localMedias.filter(m => m.type === 'audio'), [localMedias])
  const hasVideos = useMemo(() => localVideos.some(v => v.url), [localVideos])

  useEffect(() => {
    if (
      !_hasHydrated
      || !isMediaInitializedRef.current
      || contentType !== 'video'
      || !areVideoModelLimitsReady
    ) {
      return
    }

    const mediaIndexesToRemove = new Set<number>()
    const currentVideos = localMedias
      .map((media, index) => ({ media, index }))
      .filter(item => item.media.type === 'video')
    if (currentVideos.length > currentVideoModelConfig.maxVideos) {
      for (let i = currentVideos.length - 1; i >= currentVideoModelConfig.maxVideos; i--) {
        const mediaIndex = currentVideos[i]?.index
        if (mediaIndex !== undefined)
          mediaIndexesToRemove.add(mediaIndex)
      }
      toast.warning(t('detail.videoCountExceeded', { max: currentVideoModelConfig.maxVideos }))
    }

    const currentAudios = localMedias
      .map((media, index) => ({ media, index }))
      .filter(item => item.media.type === 'audio')
    if (currentAudios.length > currentVideoModelConfig.maxAudios) {
      for (let i = currentAudios.length - 1; i >= currentVideoModelConfig.maxAudios; i--) {
        const mediaIndex = currentAudios[i]?.index
        if (mediaIndex !== undefined)
          mediaIndexesToRemove.add(mediaIndex)
      }
      toast.warning(t('detail.audioCountExceeded', { max: currentVideoModelConfig.maxAudios }))
    }

    if (mediaIndexesToRemove.size === 0) {
      return
    }[...mediaIndexesToRemove]
      .sort((a, b) => b - a)
      .forEach(index => handleLocalMediaRemove(index))
  }, [
    _hasHydrated,
    areVideoModelLimitsReady,
    contentType,
    currentVideoModelConfig,
    handleLocalMediaRemove,
    localMedias,
    t,
  ])

  const {
    effectiveQuantity,
    inputVideoDuration,
    isVideoEditMode,
    resolvedVideoModelParams,
    videoDurationLimits,
  } = useAiBatchCreditState({
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
  })

  // configKey 变化时（切换草稿箱），同步本地状态到新 config
  useEffect(() => {
    if (!_hasHydrated) {
      return // 等待 IndexedDB 恢复完成
    }

    const markMediaRestoreReady = () => {
      setMediaRestoreState(current =>
        current.configKey === configKey && current.ready
          ? current
          : { configKey, ready: true },
      )
    }

    const newConfig = getConfig(configKey)
    replaceWithConfig(newConfig)
    // 从 store 恢复持久化的媒体
    const persistedMedias = newConfig.persistedMedias ?? []
    const persistedMediaSignature = `${configKey}:${buildPersistedMediaSignature(persistedMedias)}`
    if (lastRestoredMediaSignatureRef.current === persistedMediaSignature) {
      isMediaInitializedRef.current = true
      markMediaRestoreReady()
      return
    }

    lastRestoredMediaSignatureRef.current = persistedMediaSignature
    if (persistedMedias.length > 0) {
      setMedias(
        persistedMedias.map(m => ({
          id: m.id,
          url: m.url,
          type: m.type,
          name: m.name,
        })),
      )
      // 恢复视频时长 map
      videoDurationMapRef.current.clear()
      audioDurationMapRef.current.clear()
      persistedMedias
        .filter(m => m.type === 'video' && m.duration)
        .forEach(m => videoDurationMapRef.current.set(m.id, m.duration!))
      persistedMedias
        .filter(m => m.type === 'audio' && m.duration)
        .forEach(m => audioDurationMapRef.current.set(m.id, m.duration!))
    }
    else {
      clearMedias()
      videoDurationMapRef.current.clear()
      audioDurationMapRef.current.clear()
    }
    isMediaInitializedRef.current = true

    markMediaRestoreReady()
  }, [configKey, _hasHydrated, clearMedias, getConfig, replaceWithConfig, setMedias])

  useEffect(() => {
    if (!forceDraftMode || !_hasHydrated)
      return
    setIsDraftMode(true)
    updateConfig(configKey, { isDraftMode: true })
  }, [_hasHydrated, configKey, forceDraftMode, updateConfig])

  // 响应外部对 persistedMedias 的追加（例如图片资源卡片一键添加到参考文件）
  useEffect(() => {
    if (!_hasHydrated || !isMediaInitializedRef.current) {
      return
    }

    const persistedMedias = config.persistedMedias ?? []
    const currentLocalMedias = localMediasRef.current
    const uploadingMedias = currentLocalMedias.filter(media => media.progress !== undefined)
    const completedLocalMedias = currentLocalMedias
      .filter(media => media.url && media.progress === undefined)
      .flatMap((media) => {
        const persistedMedia = toPersistedLocalMedia(media)
        if (!persistedMedia)
          return []
        return [
          {
            ...persistedMedia,
            duration:
                media.type === 'video'
                  ? getMediaDuration(media, videoDurationMapRef.current)
                  : media.type === 'audio'
                    ? getMediaDuration(media, audioDurationMapRef.current)
                    : undefined,
          },
        ]
      })

    const persistedSignature = buildPersistedMediaSignature(persistedMedias)
    const completedSignature = buildPersistedMediaSignature(completedLocalMedias)
    if (persistedSignature === completedSignature) {
      return
    }

    setMedias([
      ...persistedMedias.map(media => ({
        id: media.id,
        url: media.url,
        type: media.type,
        name: media.name,
      })),
      ...uploadingMedias,
    ])

    const nextVideoDurationMap = new Map<string, number>()
    const nextAudioDurationMap = new Map<string, number>()
    uploadingMedias.forEach((media) => {
      if ((media.type !== 'video' && media.type !== 'audio') || !media.file) {
        return
      }

      const cacheKey = media.file.name + media.file.size
      const durationMap
        = media.type === 'video' ? videoDurationMapRef.current : audioDurationMapRef.current
      const cachedDuration = durationMap.get(cacheKey)
      if (cachedDuration !== undefined) {
        if (media.type === 'video')
          nextVideoDurationMap.set(cacheKey, cachedDuration)
        else nextAudioDurationMap.set(cacheKey, cachedDuration)
      }
    })
    persistedMedias
      .filter(media => media.type === 'video' && media.duration)
      .forEach(media => nextVideoDurationMap.set(media.id, media.duration!))
    persistedMedias
      .filter(media => media.type === 'audio' && media.duration)
      .forEach(media => nextAudioDurationMap.set(media.id, media.duration!))

    videoDurationMapRef.current.clear()
    nextVideoDurationMap.forEach((duration, key) => {
      videoDurationMapRef.current.set(key, duration)
    })
    audioDurationMapRef.current.clear()
    nextAudioDurationMap.forEach((duration, key) => {
      audioDurationMapRef.current.set(key, duration)
    })
  }, [config.persistedMedias, setMedias, _hasHydrated])

  // 响应外部对当前草稿箱配置的回填，例如历史参数的一键使用
  useEffect(() => {
    if (!_hasHydrated || !configSnapshot) {
      return
    }

    const nextPromptValue = configSnapshot.promptValue ?? ''
    if (nextPromptValue !== promptValueRef.current) {
      setPromptValue(nextPromptValue)
    }
  }, [_hasHydrated, configSnapshot?.promptValue])

  useEffect(() => {
    if (!_hasHydrated || !configSnapshot) {
      return
    }

    const nextCaptionSystemPrompt = configSnapshot.captionSystemPrompt ?? ''
    if (nextCaptionSystemPrompt !== captionSystemPromptRef.current) {
      setCaptionSystemPrompt(nextCaptionSystemPrompt)
    }
  }, [_hasHydrated, configSnapshot?.captionSystemPrompt])

  useEffect(() => {
    if (!_hasHydrated || !configSnapshot) {
      return
    }

    const nextCaptionSystemPromptDefault = configSnapshot.captionSystemPromptDefault ?? ''
    if (nextCaptionSystemPromptDefault !== captionSystemPromptDefaultRef.current) {
      setCaptionSystemPromptDefault(nextCaptionSystemPromptDefault)
    }
  }, [_hasHydrated, configSnapshot?.captionSystemPromptDefault])

  useEffect(() => {
    if (!_hasHydrated || !configSnapshot) {
      return
    }

    const configSnapshotSignature = JSON.stringify({
      configKey,
      defaultPlatforms,
      forceDraftMode,
      snapshot: {
        aspectRatio: configSnapshot.aspectRatio,
        captionPromptOpen: configSnapshot.captionPromptOpen,
        contentType: configSnapshot.contentType,
        duration: configSnapshot.duration,
        imageCount: configSnapshot.imageCount,
        imageModel: configSnapshot.imageModel,
        imageSize: configSnapshot.imageSize,
        isDraftMode: configSnapshot.isDraftMode,
        modelType: configSnapshot.modelType,
        quantity: configSnapshot.quantity,
        resolution: configSnapshot.resolution,
        selectedImageModels: configSnapshot.selectedImageModels,
        selectedPlatforms: configSnapshot.selectedPlatforms,
        selectedVideoModels: configSnapshot.selectedVideoModels,
        videoModelParams: configSnapshot.videoModelParams,
        videoModelResolutions: configSnapshot.videoModelResolutions,
        videoModelSelectionMode: configSnapshot.videoModelSelectionMode,
        imageModelSelectionMode: configSnapshot.imageModelSelectionMode,
      },
    })

    if (lastAppliedConfigSnapshotSignatureRef.current === configSnapshotSignature) {
      return
    }
    lastAppliedConfigSnapshotSignatureRef.current = configSnapshotSignature

    if (configSnapshot.aspectRatio !== aspectRatio) {
      setAspectRatio(configSnapshot.aspectRatio)
    }
    if (configSnapshot.duration !== duration) {
      setDuration(configSnapshot.duration)
    }
    if (configSnapshot.resolution !== resolution) {
      setResolution(configSnapshot.resolution)
    }
    if (configSnapshot.modelType !== modelType) {
      setModelType(configSnapshot.modelType)
    }
    const nextSelectedVideoModels
      = configSnapshot.selectedVideoModels.length > 0
        ? configSnapshot.selectedVideoModels
        : configSnapshot.modelType
          ? [configSnapshot.modelType]
          : []
    if (!isEqual(nextSelectedVideoModels, selectedVideoModels)) {
      setSelectedVideoModels(nextSelectedVideoModels)
    }
    if ((configSnapshot.videoModelSelectionMode ?? 'single') !== videoModelSelectionMode) {
      setVideoModelSelectionMode(configSnapshot.videoModelSelectionMode ?? 'single')
    }
    if (!isEqual(configSnapshot.videoModelResolutions ?? {}, videoModelResolutions)) {
      setVideoModelResolutions(configSnapshot.videoModelResolutions ?? {})
    }
    if (!isEqual(configSnapshot.videoModelParams ?? {}, videoModelParams)) {
      setVideoModelParams(configSnapshot.videoModelParams ?? {})
    }
    if (configSnapshot.contentType !== contentType) {
      setContentType(configSnapshot.contentType)
    }
    if (configSnapshot.imageModel !== imageModel) {
      setImageModel(configSnapshot.imageModel)
    }
    const nextSelectedImageModels
      = configSnapshot.selectedImageModels.length > 0
        ? configSnapshot.selectedImageModels
        : configSnapshot.imageModel
          ? [configSnapshot.imageModel]
          : []
    if (!isEqual(nextSelectedImageModels, selectedImageModels)) {
      setSelectedImageModels(nextSelectedImageModels)
    }
    if ((configSnapshot.imageModelSelectionMode ?? 'single') !== imageModelSelectionMode) {
      setImageModelSelectionMode(configSnapshot.imageModelSelectionMode ?? 'single')
    }
    if (configSnapshot.imageCount !== imageCount) {
      setImageCount(configSnapshot.imageCount)
    }
    if (configSnapshot.imageSize !== imageSize) {
      setImageSize(configSnapshot.imageSize)
    }
    if (configSnapshot.quantity !== quantity) {
      setQuantity(configSnapshot.quantity)
    }

    const nextIsDraftMode = forceDraftMode ? true : (configSnapshot.isDraftMode ?? true)
    if (nextIsDraftMode !== isDraftMode) {
      setIsDraftMode(nextIsDraftMode)
    }

    const nextCaptionPromptOpen = configSnapshot.captionPromptOpen ?? true
    if (nextCaptionPromptOpen !== moreOptionsOpen) {
      setMoreOptionsOpen(nextCaptionPromptOpen)
    }

    const nextSelectedPlatforms
      = configSnapshot.selectedPlatforms.length === 0
        ? defaultPlatforms
        : configSnapshot.selectedPlatforms.filter(p => availablePlatforms.includes(p))

    if (!isEqual(nextSelectedPlatforms, selectedPlatforms)) {
      setSelectedPlatforms(nextSelectedPlatforms)
    }
  }, [
    _hasHydrated,
    configSnapshot,
    aspectRatio,
    duration,
    resolution,
    modelType,
    selectedVideoModels,
    videoModelSelectionMode,
    videoModelResolutions,
    videoModelParams,
    contentType,
    imageModel,
    selectedImageModels,
    imageModelSelectionMode,
    imageCount,
    imageSize,
    quantity,
    isDraftMode,
    moreOptionsOpen,
    defaultPlatforms,
    selectedPlatforms,
    forceDraftMode,
  ])

  const {
    defaultCaptionSystemPrompt,
    effectiveLimitsDetailed,
    effectiveSelectedPlatforms,
    incompatiblePlatforms,
  } = useAiBatchPlatformPromptState({
    configKey,
    hydrated: _hasHydrated,
    contentType,
    aspectRatio,
    duration,
    imageCount,
    availablePlatforms,
    selectedPlatforms,
    isDraftMode,
    captionSystemPromptDefault,
    setCaptionSystemPrompt,
    setCaptionSystemPromptDefault,
    updateConfig,
    t,
  })

  // 事件处理
  const handlePromptValueChange = useCallback(
    (value: string, persist = true) => {
      setPromptValue(value)
      if (persist) {
        updateConfig(configKey, { promptValue: value })
      }
    },
    [configKey, updateConfig],
  )

  const handleAspectRatioChange = useCallback(
    (ratio: string) => {
      setAspectRatio(ratio)
      if (modelType) {
        const currentParams
          = resolvedVideoModelParams[modelType] ?? videoModelParams[modelType] ?? {}
        const nextVideoModelParams = {
          ...videoModelParams,
          [modelType]: { ...currentParams, aspectRatio: ratio },
        }
        setVideoModelParams(nextVideoModelParams)
        updateConfig(configKey, { aspectRatio: ratio, videoModelParams: nextVideoModelParams })
        return
      }
      updateConfig(configKey, { aspectRatio: ratio })
    },
    [configKey, modelType, resolvedVideoModelParams, updateConfig, videoModelParams],
  )

  const handleContentTypeChange = useCallback(
    (ct: DraftContentType) => {
      setContentType(ct)
      updateConfig(configKey, { contentType: ct })
      // 切换内容类型时校验并重置比例
      if (ct === 'image_text') {
        const supported = currentImageAspectRatios
        if (!includesOption(supported, aspectRatio)) {
          const defaultRatio = supported[0] ?? '1:1'
          setAspectRatio(defaultRatio)
          updateConfig(configKey, { aspectRatio: defaultRatio })
        }
      }
      else {
        const supported = currentVideoModelConfig.supportedRatios
        if (!includesOption([...supported], aspectRatio)) {
          const defaultRatio = supported.has('9:16') ? '9:16' : ([...supported][0] ?? '9:16')
          setAspectRatio(defaultRatio)
          updateConfig(configKey, { aspectRatio: defaultRatio })
        }
      }
      const maxImages
        = ct === 'image_text' ? currentImageMaxInputImages : currentVideoModelConfig.maxImages
      const maxVideos = ct === 'video' ? currentVideoModelConfig.maxVideos : 0
      const maxAudios = ct === 'video' ? currentVideoModelConfig.maxAudios : 0
      const nextLocalImages = localMedias.filter(m => m.type === 'image')
      const nextLocalVideos
        = ct === 'video' ? localMedias.filter(m => m.type === 'video').slice(0, maxVideos) : []
      const nextLocalAudios
        = ct === 'video' ? localMedias.filter(m => m.type === 'audio').slice(0, maxAudios) : []
      const nextLocalMediaIds = new Set(
        [...nextLocalImages, ...nextLocalVideos, ...nextLocalAudios].map(media => media.id),
      )
      videoDurationMapRef.current.forEach((_, key) => {
        if (!nextLocalMediaIds.has(key))
          videoDurationMapRef.current.delete(key)
      })
      audioDurationMapRef.current.forEach((_, key) => {
        if (!nextLocalMediaIds.has(key))
          audioDurationMapRef.current.delete(key)
      })

      setMedias([...nextLocalImages, ...nextLocalVideos, ...nextLocalAudios])
    },
    [
      configKey,
      updateConfig,
      currentVideoModelConfig,
      currentImageMaxInputImages,
      currentImageAspectRatios,
      aspectRatio,
      localMedias,
      setMedias,
    ],
  )

  const handleImageModelsChange = useCallback(
    (models: string[]) => {
      if (models.length === 0)
        return

      const modelInfos = models
        .map(model => pricingData?.imageModels?.find(item => item.model === model))
        .filter((model): model is ImageModelInfo => Boolean(model))
      const commonRatios = getImageModelsCommonAspectRatios(modelInfos)
      const commonPricing = buildAggregateImagePricing(modelInfos)
      if (
        modelInfos.length !== models.length
        || commonRatios.length === 0
        || commonPricing.length === 0
      ) {
        toast.warning(t('detail.noCommonModelParams'))
        return
      }

      const nextPrimaryModel = models[0]!
      setSelectedImageModels(models)
      setImageModel(nextPrimaryModel)
      updateConfig(configKey, { selectedImageModels: models, imageModel: nextPrimaryModel })

      const maxImages = getImageModelsMaxInputImages(modelInfos)
      if (maxImages === 0) {
        clearMedias()
      }
      // 切换模型后校验 imageSize 是否在新模型定价中
      if (
        !includesOption(
          commonPricing.map(p => p.resolution),
          imageSize,
        )
      ) {
        const firstSize = commonPricing[0]?.resolution ?? '1K'
        setImageSize(firstSize)
        updateConfig(configKey, { imageSize: firstSize })
      }
      if (!includesOption(commonRatios, aspectRatio)) {
        const firstRatio = commonRatios[0] ?? '1:1'
        setAspectRatio(firstRatio)
        updateConfig(configKey, { aspectRatio: firstRatio })
      }
    },
    [configKey, updateConfig, clearMedias, pricingData, imageSize, aspectRatio, t],
  )

  const handleImageModelSelectionModeChange = useCallback(
    (mode: ModelSelectionMode) => {
      setImageModelSelectionMode(mode)
      const nextModels = mode === 'single' ? selectedImageModels.slice(0, 1) : selectedImageModels
      setSelectedImageModels(nextModels)
      if (nextModels[0]) {
        setImageModel(nextModels[0])
      }
      updateConfig(configKey, {
        imageModelSelectionMode: mode,
        selectedImageModels: nextModels,
        imageModel: nextModels[0] ?? imageModel,
      })
    },
    [configKey, imageModel, selectedImageModels, updateConfig],
  )

  const handleImageSizeChange = useCallback(
    (size: string) => {
      setImageSize(size)
      updateConfig(configKey, { imageSize: size })
    },
    [configKey, updateConfig],
  )

  const handleImageCountChange = useCallback(
    (count: number) => {
      setImageCount(count)
      updateConfig(configKey, { imageCount: count })
    },
    [configKey, updateConfig],
  )

  const handleDurationChange = useCallback(
    (d: number) => {
      setDuration(d)
      if (modelType) {
        const currentParams
          = resolvedVideoModelParams[modelType] ?? videoModelParams[modelType] ?? {}
        const nextVideoModelParams = {
          ...videoModelParams,
          [modelType]: { ...currentParams, duration: d },
        }
        setVideoModelParams(nextVideoModelParams)
        updateConfig(configKey, { duration: d, videoModelParams: nextVideoModelParams })
        return
      }
      updateConfig(configKey, { duration: d })
    },
    [configKey, modelType, resolvedVideoModelParams, updateConfig, videoModelParams],
  )

  const handleResolutionChange = useCallback(
    (nextResolution: string) => {
      const nextResolutionMap = modelType
        ? { ...videoModelResolutions, [modelType]: nextResolution }
        : videoModelResolutions
      const nextVideoModelParams = modelType
        ? {
            ...videoModelParams,
            [modelType]: {
              ...(resolvedVideoModelParams[modelType] ?? videoModelParams[modelType] ?? {}),
              resolution: nextResolution,
            },
          }
        : videoModelParams
      setResolution(nextResolution)
      setVideoModelResolutions(nextResolutionMap)
      setVideoModelParams(nextVideoModelParams)
      updateConfig(configKey, {
        resolution: nextResolution,
        videoModelResolutions: nextResolutionMap,
        videoModelParams: nextVideoModelParams,
      })
    },
    [
      configKey,
      modelType,
      resolvedVideoModelParams,
      updateConfig,
      videoModelParams,
      videoModelResolutions,
    ],
  )

  const handleQuantityChange = useCallback(
    (q: number) => {
      setQuantity(q)
      updateConfig(configKey, { quantity: q })
    },
    [configKey, updateConfig],
  )

  const handleVideoModelParamChange = useCallback(
    (model: VideoModelType, params: VideoModelParams) => {
      const currentParams = resolvedVideoModelParams[model] ?? videoModelParams[model] ?? {}
      const nextModelParams = { ...currentParams, ...params }
      const nextVideoModelParams = { ...videoModelParams, [model]: nextModelParams }
      const nextVideoModelResolutions = params.resolution
        ? { ...videoModelResolutions, [model]: params.resolution }
        : videoModelResolutions
      setVideoModelParams(nextVideoModelParams)
      setVideoModelResolutions(nextVideoModelResolutions)
      updateConfig(configKey, {
        videoModelParams: nextVideoModelParams,
        videoModelResolutions: nextVideoModelResolutions,
      })
      if (videoModelSelectionMode === 'single' && model === modelType) {
        if (params.resolution) {
          setResolution(params.resolution)
          updateConfig(configKey, { resolution: params.resolution })
        }
        if (params.duration !== undefined) {
          setDuration(params.duration)
          updateConfig(configKey, { duration: params.duration })
        }
        if (params.aspectRatio) {
          setAspectRatio(params.aspectRatio)
          updateConfig(configKey, { aspectRatio: params.aspectRatio })
        }
      }
    },
    [
      configKey,
      modelType,
      resolvedVideoModelParams,
      updateConfig,
      videoModelParams,
      videoModelResolutions,
      videoModelSelectionMode,
    ],
  )

  const handleVideoModelsChange = useCallback(
    (models: VideoModelType[]) => {
      if (models.length === 0)
        return

      const modelInfos = models
        .map(model => pricingData?.videoModels?.find(item => item.name === model))
        .filter((model): model is VideoModelInfo => Boolean(model))
      const newConfig = getVideoModelsCommonStaticConfig(modelInfos)
      const requiresCommonOutputParams = videoModelSelectionMode === 'single'
      if (
        modelInfos.length !== models.length
        || (requiresCommonOutputParams && newConfig.supportedRatios.size === 0)
      ) {
        toast.warning(t('detail.noCommonModelParams'))
        return
      }

      const nextModelType = models[0]!
      const nextResolutionMap = getVideoModelResolutionMap(modelInfos, videoModelResolutions)
      const nextResolution
        = nextResolutionMap[nextModelType] ?? getVideoModelFallbackResolution(modelInfos[0])
      const storedPrimaryParams = resolvedVideoModelParams[nextModelType]
      const shouldUseStoredModelParams = videoModelSelectionMode === 'multiple'
      const nextFallbackResolution
        = (shouldUseStoredModelParams ? storedPrimaryParams?.resolution : resolution)
          || nextResolution
      const nextFallbackDuration
        = inputVideoDuration
          ?? (shouldUseStoredModelParams ? storedPrimaryParams?.duration : duration)
          ?? duration
      const nextFallbackAspectRatio
        = (shouldUseStoredModelParams ? storedPrimaryParams?.aspectRatio : aspectRatio) ?? aspectRatio
      const nextSeedParams = {
        resolution: nextFallbackResolution,
        duration: nextFallbackDuration,
        aspectRatio: nextFallbackAspectRatio,
      }
      const nextStoredParams = getSeededVideoModelParamsMap(
        modelInfos,
        shouldUseStoredModelParams ? videoModelParams : {},
        nextSeedParams,
      )
      const nextLegacyResolutionMap = shouldUseStoredModelParams
        ? getVideoModelParamsResolutionMap(videoModelParams)
        : {}
      const nextResolvedParams = getVideoModelParamsMap(
        modelInfos,
        nextStoredParams,
        nextLegacyResolutionMap,
        nextSeedParams,
        isVideoEditMode,
      )
      const nextVideoModelParams = { ...videoModelParams, ...nextResolvedParams }
      const nextVideoModelResolutions = {
        ...nextResolutionMap,
        ...getVideoModelParamsResolutionMap(nextResolvedParams),
      }
      const nextPrimaryParams = nextResolvedParams[nextModelType]
      const nextPrimaryResolution = nextPrimaryParams?.resolution ?? nextResolution
      const nextPrimaryDuration = nextPrimaryParams?.duration ?? duration
      const nextPrimaryAspectRatio = nextPrimaryParams?.aspectRatio ?? aspectRatio
      setSelectedVideoModels(models)
      setModelType(nextModelType)
      setResolution(nextPrimaryResolution)
      if (videoModelSelectionMode === 'single') {
        setDuration(nextPrimaryDuration)
        setAspectRatio(nextPrimaryAspectRatio)
      }
      setVideoModelResolutions(nextVideoModelResolutions)
      setVideoModelParams(nextVideoModelParams)
      updateConfig(configKey, {
        selectedVideoModels: models,
        modelType: nextModelType,
        resolution: nextPrimaryResolution,
        duration: videoModelSelectionMode === 'single' ? nextPrimaryDuration : duration,
        aspectRatio: videoModelSelectionMode === 'single' ? nextPrimaryAspectRatio : aspectRatio,
        videoModelResolutions: nextVideoModelResolutions,
        videoModelParams: nextVideoModelParams,
      })
      const maxImages = newConfig.maxImages
      // 清理超出限制的本地上传图片
      const currentLocalImages = localMedias.filter(m => m.type === 'image')
      if (currentLocalImages.length > maxImages) {
        const allowedLocal = Math.max(0, maxImages)
        for (let i = currentLocalImages.length - 1; i >= allowedLocal; i--) {
          const mediaIndex = localMedias.indexOf(currentLocalImages[i]!)
          if (mediaIndex >= 0)
            handleLocalMediaRemove(mediaIndex)
        }
      }
      // 模型切换时检查音视频数量是否超限
      const mediaIndexesToRemove = new Set<number>()
      const maxVideos = newConfig.maxVideos
      const currentVideos = localMedias
        .map((media, index) => ({ media, index }))
        .filter(item => item.media.type === 'video')
      if (currentVideos.length > maxVideos) {
        for (let i = currentVideos.length - 1; i >= maxVideos; i--) {
          const mediaIndex = currentVideos[i]?.index
          if (mediaIndex !== undefined)
            mediaIndexesToRemove.add(mediaIndex)
        }
        toast.warning(t('detail.videoCountExceeded', { max: maxVideos }))
      }
      const maxAudios = newConfig.maxAudios
      const currentAudios = localMedias
        .map((media, index) => ({ media, index }))
        .filter(item => item.media.type === 'audio')
      if (currentAudios.length > maxAudios) {
        for (let i = currentAudios.length - 1; i >= maxAudios; i--) {
          const mediaIndex = currentAudios[i]?.index
          if (mediaIndex !== undefined)
            mediaIndexesToRemove.add(mediaIndex)
        }
        toast.warning(t('detail.audioCountExceeded', { max: maxAudios }))
      }
      if (mediaIndexesToRemove.size > 0) {
        ;[...mediaIndexesToRemove]
          .sort((a, b) => b - a)
          .forEach(index => handleLocalMediaRemove(index))
      }
    },
    [
      aspectRatio,
      duration,
      configKey,
      updateConfig,
      localMedias,
      localVideos.length,
      handleLocalMediaRemove,
      t,
      pricingData?.videoModels,
      isVideoEditMode,
      videoModelResolutions,
      videoModelSelectionMode,
      videoModelParams,
      inputVideoDuration,
      resolution,
      resolvedVideoModelParams,
    ],
  )

  const handleVideoModelSelectionModeChange = useCallback(
    (mode: ModelSelectionMode) => {
      if (mode === videoModelSelectionMode)
        return

      setVideoModelSelectionMode(mode)
      const nextModels = mode === 'single' ? selectedVideoModels.slice(0, 1) : selectedVideoModels
      const modelInfos = nextModels
        .map(model => pricingData?.videoModels?.find(item => item.name === model))
        .filter((model): model is VideoModelInfo => Boolean(model))
      const nextResolutionMap = getVideoModelResolutionMap(modelInfos, videoModelResolutions)
      const nextModelType = nextModels[0] ?? modelType
      const nextResolution = nextResolutionMap[nextModelType] ?? resolution
      const primaryParams = resolvedVideoModelParams[nextModelType]
      const shouldUseStoredModelParams = videoModelSelectionMode === 'multiple'
      const nextFallbackResolution
        = (shouldUseStoredModelParams ? primaryParams?.resolution : resolution) || nextResolution
      const nextSeedParams = {
        resolution: nextFallbackResolution,
        duration:
            inputVideoDuration
            ?? (shouldUseStoredModelParams ? primaryParams?.duration : duration)
            ?? duration,
        aspectRatio:
            (shouldUseStoredModelParams ? primaryParams?.aspectRatio : aspectRatio) ?? aspectRatio,
      }
      const nextStoredParams = getSeededVideoModelParamsMap(
        modelInfos,
        shouldUseStoredModelParams ? videoModelParams : {},
        nextSeedParams,
      )
      const nextLegacyResolutionMap = shouldUseStoredModelParams
        ? getVideoModelParamsResolutionMap(videoModelParams)
        : {}
      const nextResolvedParams = getVideoModelParamsMap(
        modelInfos,
        nextStoredParams,
        nextLegacyResolutionMap,
        nextSeedParams,
        isVideoEditMode,
      )
      const nextVideoModelParams = { ...videoModelParams, ...nextResolvedParams }
      const nextVideoModelResolutions = {
        ...nextResolutionMap,
        ...getVideoModelParamsResolutionMap(nextResolvedParams),
      }
      const nextPrimaryParams = nextResolvedParams[nextModelType]
      setSelectedVideoModels(nextModels)
      setModelType(nextModelType)
      setResolution(nextPrimaryParams?.resolution ?? nextResolution)
      if (mode === 'single' && nextPrimaryParams?.duration !== undefined) {
        setDuration(nextPrimaryParams.duration)
      }
      if (mode === 'single' && nextPrimaryParams?.aspectRatio) {
        setAspectRatio(nextPrimaryParams.aspectRatio)
      }
      setVideoModelResolutions(nextVideoModelResolutions)
      setVideoModelParams(nextVideoModelParams)
      updateConfig(configKey, {
        videoModelSelectionMode: mode,
        selectedVideoModels: nextModels,
        modelType: nextModelType,
        resolution: nextPrimaryParams?.resolution ?? nextResolution,
        duration: mode === 'single' ? (nextPrimaryParams?.duration ?? duration) : duration,
        aspectRatio:
            mode === 'single' ? (nextPrimaryParams?.aspectRatio ?? aspectRatio) : aspectRatio,
        videoModelResolutions: nextVideoModelResolutions,
        videoModelParams: nextVideoModelParams,
      })
    },
    [
      aspectRatio,
      configKey,
      duration,
      inputVideoDuration,
      isVideoEditMode,
      modelType,
      pricingData?.videoModels,
      resolution,
      resolvedVideoModelParams,
      selectedVideoModels,
      updateConfig,
      videoModelParams,
      videoModelResolutions,
      videoModelSelectionMode,
    ],
  )

  const handlePlatformsChange = useCallback(
    (platforms: PlatType[]) => {
      setSelectedPlatforms(platforms)
      updateConfig(configKey, { selectedPlatforms: platforms })
    },
    [configKey, updateConfig],
  )

  const handleDraftModeChange = useCallback(
    (isDraft: boolean) => {
      if (forceDraftMode) {
        setIsDraftMode(true)
        updateConfig(configKey, { isDraftMode: true })
        return
      }
      setIsDraftMode(isDraft)
      updateConfig(configKey, { isDraftMode: isDraft })
    },
    [configKey, forceDraftMode, updateConfig],
  )

  const handleCaptionSystemPromptChange = useCallback(
    (value: string) => {
      setCaptionSystemPrompt(value)
      updateConfig(configKey, { captionSystemPrompt: value })
    },
    [configKey, updateConfig],
  )

  const handleMoreOptionsOpenChange = useCallback(
    (open: boolean) => {
      setMoreOptionsOpen(open)
      updateConfig(configKey, { captionPromptOpen: open })
    },
    [configKey, updateConfig],
  )

  // 重置所有配置到默认值
  const handleReset = useCallback(() => {
    clearMedias()
    videoDurationMapRef.current.clear()
    audioDurationMapRef.current.clear()
    const firstVideoModel = pricingData?.videoModels?.[0]?.name ?? ('' as VideoModelType)
    const firstVideoModelInfo = pricingData?.videoModels?.[0]
    const firstVideoResolution = getVideoModelDefaultResolution(firstVideoModelInfo)
    const nextAspectRatio = firstVideoModelInfo
      ? getDefaultVideoAspectRatio(firstVideoModelInfo, '9:16')
      : '9:16'
    const firstImageModel = pricingData?.imageModels?.[0]
    const nextConfig = {
      aspectRatio: nextAspectRatio,
      duration: 8,
      resolution: firstVideoResolution,
      quantity: 1,
      modelType: firstVideoModel,
      selectedVideoModels: firstVideoModel ? [firstVideoModel] : [],
      videoModelSelectionMode: 'single' as const,
      videoModelResolutions:
        firstVideoModel && firstVideoResolution
          ? { [firstVideoModel]: firstVideoResolution }
          : {},
      videoModelParams: firstVideoModel
        ? {
            [firstVideoModel]: {
              resolution: firstVideoResolution,
              duration: 8,
              aspectRatio: nextAspectRatio,
            },
          }
        : {},
      contentType: 'video' as const,
      imageModel: firstImageModel?.model ?? 'nb2',
      selectedImageModels: firstImageModel?.model ? [firstImageModel.model] : [],
      imageModelSelectionMode: 'single' as const,
      imageCount: 3,
      imageSize: firstImageModel?.pricing?.[0]?.resolution ?? '1K',
      selectedPlatforms: defaultPlatforms,
      persistedMedias: [],
      promptValue: '',
      captionPrompt: '',
      captionPromptOpen: true,
      captionSystemPrompt: defaultCaptionSystemPrompt,
      captionSystemPromptDefault: defaultCaptionSystemPrompt,
      isDraftMode: true,
    }

    updateConfig(configKey, nextConfig)
    replaceLocalState(
      buildAiBatchGenerateBarInitialState({
        config: nextConfig,
        forceDraftMode,
        availablePlatforms,
      }),
    )
  }, [
    availablePlatforms,
    clearMedias,
    configKey,
    defaultCaptionSystemPrompt,
    defaultPlatforms,
    forceDraftMode,
    pricingData,
    replaceLocalState,
    updateConfig,
  ])

  const handleLocalUpload = useLocalUploadHandler({
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
  })

  const {
    isDragging,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
  } = useDragUploadHandlers(handleLocalUpload)

  const handleSubmit = useAiBatchSubmitHandler({
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
  })

  const {
    promptsExploreUrl,
    placeholder,
    canUploadImage,
    canUploadVideo,
    canUploadAudio,
    mediaAccept,
  } = useAiBatchPromptMeta({
    lng,
    currentVideoModelInfo,
    contentType,
    currentImageMaxInputImages,
    currentVideoModelConfig,
    localImagesCount: localImages.length,
    localVideosCount: localVideos.length,
    localAudiosCount: localAudios.length,
    t,
  })

  const canRemoveUnavailableMediaMentions
    = _hasHydrated && mediaRestoreState.configKey === configKey && mediaRestoreState.ready

  const {
    handlePasteFiles,
    handleMediaMentionUploadRequest,
    handleMediaMentionUploadChange,
    mediaMentions,
  } = useMediaMentionControls({
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
  })

  const handleClearPromptAndMedia = useCallback(() => {
    handlePromptValueChange('')
    clearMedias()
    videoDurationMapRef.current.clear()
    audioDurationMapRef.current.clear()
    updateConfig(configKey, { persistedMedias: [] })
  }, [clearMedias, configKey, handlePromptValueChange, updateConfig])

  return {
    containerProps: {
      className: cn(
        styles.container,
        '@container',
        className,
        isVideoEditMode && styles.videoEditMode,
        isDragging && styles.dragging,
      ),
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    promptComposerProps: {
      uploadInputRef: mediaMentionUploadInputRef,
      mediaAccept,
      localMedias,
      canUploadImage,
      canUploadVideo,
      canUploadAudio,
      promptValue,
      placeholder,
      maxLength: PROMPT_MAX_LENGTH,
      mediaMentions,
      labels: {
        missingMedia: t('detail.mediaMentionMissing'),
        emptyMedia: t('detail.mediaMentionEmpty'),
        emptyMediaHint: t('detail.mediaMentionHint'),
        loading: t('detail.mediaMentionLoading'),
        uploadMedia: t('detail.mediaMentionUpload'),
        resetConfig: t('detail.resetConfig'),
        openPromptEditor: t('detail.openPromptEditor'),
      },
      onUploadInputChange: handleMediaMentionUploadChange,
      onLocalMediaRemove: handleLocalMediaRemove,
      onLocalUpload: handleLocalUpload,
      onPromptChange: handlePromptValueChange,
      onPasteFiles: handlePasteFiles,
      onRequestUpload: handleMediaMentionUploadRequest,
      onReset: handleReset,
      onOpenPromptEditor: () => setPromptEditorOpen(true),
      onClear: handleClearPromptAndMedia,
    },
    toolBarProps: {
      configKey,
      fallbackState: initialLocalState,
      imageAspectRatios: currentImageAspectRatios,
      imageModelOptions,
      imagePricing,
      videoModels: pricingData?.videoModels,
      videoAspectRatios: [...currentVideoModelConfig.supportedRatios],
      videoResolutions: currentVideoResolutions,
      videoModelOptions,
      resolvedVideoModelParams,
      videoDurationLimits,
      isVideoEditMode,
      inputVideoDuration,
      isLoading: isGeneratingBatch || isUploading,
      promptsExploreUrl,
      promptsExploreLabel: t('detail.exploreMorePrompts'),
      hideNonDraftModes: forceDraftMode,
      effectiveLimitsDetailed,
      disabledPlatforms: incompatiblePlatforms,
      actions: {
        onDraftModeChange: handleDraftModeChange,
        onContentTypeChange: handleContentTypeChange,
        onVideoModelsChange: handleVideoModelsChange,
        onVideoModelSelectionModeChange: handleVideoModelSelectionModeChange,
        onVideoModelParamChange: handleVideoModelParamChange,
        onResolutionChange: handleResolutionChange,
        onAspectRatioChange: handleAspectRatioChange,
        onDurationChange: handleDurationChange,
        onQuantityChange: handleQuantityChange,
        onImageModelsChange: handleImageModelsChange,
        onImageModelSelectionModeChange: handleImageModelSelectionModeChange,
        onImageCountChange: handleImageCountChange,
        onImageSizeChange: handleImageSizeChange,
        onPlatformsChange: handlePlatformsChange,
        onMoreOptionsChange: handleMoreOptionsOpenChange,
        onSubmit: handleSubmit,
      },
    },
    captionPromptFieldProps: isDraftMode && moreOptionsOpen
      ? {
          compactBottomPadding: false,
          label: t('detail.systemCaptionPrompt'),
          tip: t('detail.systemCaptionPromptTip'),
          placeholder: defaultCaptionSystemPrompt || t('detail.systemCaptionPromptPlaceholder'),
          value: captionSystemPrompt,
          maxLength: PROMPT_MAX_LENGTH,
          onChange: handleCaptionSystemPromptChange,
        }
      : null,
    promptEditorDialogProps: promptEditorOpen
      ? {
          open: promptEditorOpen,
          value: promptValue,
          placeholder,
          maxLength: PROMPT_MAX_LENGTH,
          enableMediaMention: true,
          mediaMentions,
          missingMediaLabel: t('detail.mediaMentionMissing'),
          emptyMediaLabel: t('detail.mediaMentionEmpty'),
          emptyMediaHintLabel: t('detail.mediaMentionHint'),
          loadingLabel: t('detail.mediaMentionLoading'),
          uploadMediaLabel: t('detail.mediaMentionUpload'),
          onOpenChange: setPromptEditorOpen,
          onSave: handlePromptValueChange,
          onPaste: handlePaste,
          onPasteFiles: handlePasteFiles,
          onRequestUpload: handleMediaMentionUploadRequest,
        }
      : null,
    dragUploadOverlayLabel: isDragging ? t('detail.dropToUpload') : null,
  }
}
