/**
 * AiBatchGenerateBar - AI 批量生成内联输入栏
 * 聊天式输入界面：图片堆叠 + 提示词输入 + 工具栏，始终可见
 */

'use client'

import type { IPersistedMedia } from '../../draftBoxConfigStore'
import type { EffectiveLimitsDetailed } from './platformLimits'
import type { DraftContentType, VideoModelType } from '@/api/draftGeneration'
import type { ImageModelInfo, ImageModelPricing, VideoModelInfo, VideoModelPricing } from '@/api/types/draftGeneration'
import type { PlatType } from '@/app/config/platConfig'
import { RotateCcw, Upload, X } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
import { AccountPlatInfoMap, RegionTaskPlatInfoArr, TASK_EXCLUDED_PLATFORMS } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useGetClientLng } from '@/hooks/useSystem'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import { getVideoMeta } from '@/utils/media'
import { getOssUrl } from '@/utils/oss'
import { useDraftBoxConfigStore } from '../../draftBoxConfigStore'
import styles from './AiBatchGenerateBar.module.scss'
import {
  DEFAULT_MAX_INPUT_IMAGES,
  getVideoModelConfigFromApi,
  getVideoModelStaticConfig,
  IMAGE_TEXT_ASPECT_RATIOS,
  matchClosestRatio,
} from './constants'
import ImageStack from './ImageStack'
import { checkPlatformCompatibility } from './platformCompatibility'
import { calcEffectiveLimitsDetailed } from './platformLimits'
import ToolBarInline from './ToolBarInline'
import { usePricingData } from './usePricingData'

const PROMPT_MAX_LENGTH = 2000

/** youmind.com URL 语言路径映射：英语等无前缀，日语/韩语使用不同代码 */
const PROMPTS_EXPLORE_LNG_MAP: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
}

/** 品牌图片类型（原 BrandImage，品牌库模块移除后本地保留） */
export interface BrandImage {
  id: string
  url: string
}

/** 模块级常量，避免 selector 每次返回新引用导致无限重渲染 */
const EMPTY_IMAGE_LIST: BrandImage[] = []

interface AiBatchGenerateBarProps {
  /** 外部传入 groupId，不从 store 读取 */
  groupId?: string
  /** 生成成功后回调 */
  onGenerated?: () => void
  /** 自定义容器类名 */
  className?: string
}

const AiBatchGenerateBar = memo(({ groupId, onGenerated, className }: AiBatchGenerateBarProps) => {
  const { t } = useTransClient('brandPromotion')
  const lng = useGetClientLng()

  const imageList = EMPTY_IMAGE_LIST

  // 配置 key：按 groupId 隔离
  const configKey = groupId || '__default__'

  // Store：按草稿箱隔离的持久化配置
  const { getConfig, updateConfig, resetConfig, _hasHydrated } = useDraftBoxConfigStore(useShallow(state => ({
    getConfig: state.getConfig,
    updateConfig: state.updateConfig,
    resetConfig: state.resetConfig,
    _hasHydrated: state._hasHydrated,
  })))

  const config = getConfig(configKey)

  // Store：生成状态
  const {
    isGeneratingBatch,
    createBatchGeneration,
    createImageTextBatchGeneration,
  } = usePlanDetailStore(useShallow(state => ({
    isGeneratingBatch: state.isGeneratingBatch,
    createBatchGeneration: state.createBatchGeneration,
    createImageTextBatchGeneration: state.createImageTextBatchGeneration,
  })))

  // 默认提示词
  const defaultPrompt = ''

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false)
  const dragCountRef = useRef(0)

  // 本地状态（从 config 初始化）
  const [promptValue, setPromptValue] = useState('')
  const [aspectRatio, setAspectRatio] = useState(config.aspectRatio)
  const [duration, setDuration] = useState(config.duration)
  const [modelType, setModelType] = useState<VideoModelType>(config.modelType)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [contentType, setContentType] = useState<DraftContentType>(config.contentType)
  const [imageModel, setImageModel] = useState<string>(config.imageModel)
  const [imageCount, setImageCount] = useState(config.imageCount)
  const [imageSize, setImageSize] = useState(config.imageSize)
  const [quantity, setQuantity] = useState(config.quantity)
  const [isDraftMode, setIsDraftMode] = useState(config.isDraftMode ?? true)
  // 计算当前区域可用平台
  const availablePlatforms = useMemo(() =>
    RegionTaskPlatInfoArr.map(([plat]) => plat), [])

  // 默认选中平台
  const defaultPlatforms = useMemo(() => availablePlatforms, [availablePlatforms])

  // 初始化 selectedPlatforms：过滤不可用 + 空时默认全选
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatType[]>(() => {
    const stored = config.selectedPlatforms
    if (stored.length === 0) {
      // 首次（无持久化数据）：默认全选（国外版排除小红书）
      return defaultPlatforms
    }
    // 有持久化数据：过滤掉不可用平台
    return stored.filter(p => AccountPlatInfoMap.has(p) && !TASK_EXCLUDED_PLATFORMS.has(p))
  })

  // 用 ref 追踪是否已完成初始自动选中
  const initialSelectionDone = useRef(false)
  // 追踪上一次的 configKey，用于同步 effect 检测切换
  const prevConfigKeyRef = useRef(configKey)
  const isMediaInitializedRef = useRef(false)
  // 防止同一品牌 ID 重复应用默认值
  const lastAppliedBrandIdRef = useRef<string | null>(null)

  // Pricing 数据
  const { pricingData, isLoading: isPricingLoading } = usePricingData()

  // 派生：图文模型选项列表
  const imageModelOptions = useMemo(() => {
    if (!pricingData?.imageModels)
      return []
    return pricingData.imageModels.map(m => ({ value: m.model, label: m.displayName }))
  }, [pricingData])

  // 派生：当前选中图文模型的信息
  const currentImageModelInfo: ImageModelInfo | undefined = useMemo(() => {
    return pricingData?.imageModels?.find(m => m.model === imageModel)
  }, [pricingData, imageModel])

  // 派生：当前模型的定价列表
  const imagePricing: ImageModelPricing[] = useMemo(() => {
    return currentImageModelInfo?.pricing ?? []
  }, [currentImageModelInfo])

  // ==================== 视频模型派生数据（不依赖 hasVideos 的部分） ====================

  // 派生：视频模型选项列表（从 API 数据）
  const videoModelOptions = useMemo(() => {
    if (!pricingData?.videoModels)
      return []
    return pricingData.videoModels.map(m => ({ value: m.name, label: m.description || m.name }))
  }, [pricingData])

  // 派生：当前选中视频模型的完整信息
  const currentVideoModelInfo: VideoModelInfo | undefined = useMemo(() => {
    if (!pricingData?.videoModels)
      return undefined
    return pricingData.videoModels.find(m => m.name === modelType)
  }, [pricingData, modelType])

  // 派生：当前视频模型的动态配置（从 API 数据计算）
  const currentVideoModelConfig = useMemo(() => {
    if (currentVideoModelInfo)
      return getVideoModelConfigFromApi(currentVideoModelInfo)
    return getVideoModelStaticConfig(modelType)
  }, [currentVideoModelInfo, modelType])

  // pricing 加载后校验图文模型是否可用
  useEffect(() => {
    if (!pricingData?.imageModels?.length)
      return
    const modelExists = pricingData.imageModels.some(m => m.model === imageModel)
    if (!modelExists) {
      const firstModel = pricingData.imageModels[0]!.model
      setImageModel(firstModel)
      updateConfig(configKey, { imageModel: firstModel })
    }
    // 校验 imageSize 是否在当前模型定价中
    const currentInfo = pricingData.imageModels.find(m => m.model === (modelExists ? imageModel : pricingData.imageModels[0]!.model))
    if (currentInfo && !currentInfo.pricing.some(p => p.resolution === imageSize)) {
      const firstSize = currentInfo.pricing[0]?.resolution ?? '1K'
      setImageSize(firstSize)
      updateConfig(configKey, { imageSize: firstSize })
    }
  }, [pricingData, imageModel, imageSize])

  // pricing 加载后校验视频模型是否可用
  useEffect(() => {
    if (!pricingData?.videoModels?.length)
      return
    const modelExists = pricingData.videoModels.some(m => m.name === modelType)
    if (!modelExists) {
      const firstName = pricingData.videoModels[0]!.name
      setModelType(firstName)
      updateConfig(configKey, { modelType: firstName })
    }
  }, [pricingData, modelType])

  // 旧用户数据迁移：jimeng/grok → 第一个可用视频模型
  useEffect(() => {
    if (config.modelType === 'jimeng' || config.modelType === 'grok') {
      const fallback = pricingData?.videoModels?.[0]?.name ?? ('' as VideoModelType)
      updateConfig(configKey, { modelType: fallback })
      setModelType(fallback)
    }
  }, [pricingData, config.modelType])

  // 默认提示词自动填充
  const defaultPromptFilledRef = useRef(false)
  useEffect(() => {
    if (defaultPrompt && !defaultPromptFilledRef.current && !promptValue) {
      setPromptValue(defaultPrompt)
      updateConfig(configKey, { promptValue: defaultPrompt })
      defaultPromptFilledRef.current = true
    }
  }, [defaultPrompt, promptValue])

  // imageList 异步加载后自动选中默认图片
  useEffect(() => {
    if (!initialSelectionDone.current && imageList.length > 0) {
      const maxImages = contentType === 'image_text'
        ? (currentImageModelInfo?.maxInputImages ?? DEFAULT_MAX_INPUT_IMAGES)
        : currentVideoModelConfig.maxImages
      const defaultCount = Math.min(5, maxImages, imageList.length)
      const defaultIds = imageList.slice(0, defaultCount).map(img => img.id)
      setSelectedIds(defaultIds)
      updateConfig(configKey, { selectedImageIds: defaultIds })
      initialSelectionDone.current = true
    }
  }, [imageList, modelType, contentType, imageModel, configKey, updateConfig, currentVideoModelConfig])

  // 本地上传媒体
  const {
    medias: localMedias,
    setMedias,
    isUploading,
    handleMediasChange: uploadMedias,
    handleMediaRemove: removeLocalMedia,
    clearMedias,
  } = useMediaUpload()

  // 包装删除：同步清理 videoDurationMapRef
  const handleLocalMediaRemove = useCallback((index: number) => {
    const media = localMedias[index]
    if (media?.type === 'video' && media.file) {
      videoDurationMapRef.current.delete(media.file.name + media.file.size)
    }
    removeLocalMedia(index)
  }, [localMedias, removeLocalMedia])

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
    const completed: IPersistedMedia[] = localMedias
      .filter(m => m.url && m.progress === undefined)
      .map(m => ({
        id: m.id!,
        url: m.url,
        type: m.type as 'image' | 'video',
        name: m.name,
        duration: m.type === 'video' && m.id ? videoDurationMapRef.current.get(m.id) : undefined,
      }))
    updateConfig(configKey, { persistedMedias: completed })
  }, [localMedias, configKey, updateConfig, _hasHydrated])

  // 派生
  const localImages = useMemo(() => localMedias.filter(m => m.type === 'image'), [localMedias])
  const localVideos = useMemo(() => localMedias.filter(m => m.type === 'video'), [localMedias])
  const hasVideos = useMemo(() => localVideos.some(v => v.url), [localVideos])

  // ==================== 视频模型派生数据（依赖 hasVideos） ====================

  // 是否为视频编辑模式（上传了视频 + 视频内容类型）
  const isVideoEditMode = hasVideos && contentType === 'video'

  // 派生：当前模型的定价数组
  const videoPricing: VideoModelPricing[] = useMemo(() => {
    if (!currentVideoModelInfo?.pricing)
      return []
    return currentVideoModelInfo.pricing
  }, [currentVideoModelInfo])

  // 派生：从 pricing 数据的 duration 范围派生时长限制
  const videoDurationLimits = useMemo(() => {
    if (videoPricing.length === 0)
      return { min: 4, max: 15 }
    const durations = videoPricing.map(p => p.duration)
    return { min: Math.min(...durations), max: Math.max(...durations) }
  }, [videoPricing])

  // 派生：按 duration 查表得到价格 × quantity
  const videoCredits = useMemo(() => {
    if (videoPricing.length === 0)
      return 0
    const exactMatch = videoPricing.find(p => p.duration === duration)
    if (exactMatch)
      return exactMatch.price * quantity
    const sorted = [...videoPricing].sort((a, b) => Math.abs(a.duration - duration) - Math.abs(b.duration - duration))
    return (sorted[0]?.price ?? 0) * quantity
  }, [videoPricing, duration, quantity])

  // hasVideos 变化时自动 clamp duration（video2video 最大 duration 可能更小）
  useEffect(() => {
    if (contentType !== 'video')
      return
    if (duration > videoDurationLimits.max) {
      setDuration(videoDurationLimits.max)
      updateConfig(configKey, { duration: videoDurationLimits.max })
      toast.info(t('detail.durationAutoAdjusted', { duration: videoDurationLimits.max }))
    }
    else if (duration < videoDurationLimits.min) {
      setDuration(videoDurationLimits.min)
      updateConfig(configKey, { duration: videoDurationLimits.min })
    }
  }, [videoDurationLimits, contentType])

  // 视频时长追踪
  const videoDurationMapRef = useRef<Map<string, number>>(new Map())

  // 视频编辑模式：输入视频总时长（用于锁定 duration）
  const inputVideoDuration = useMemo(() => {
    if (!isVideoEditMode)
      return null
    let total = 0
    videoDurationMapRef.current.forEach(d => total += d)
    return Math.round(total)
  }, [isVideoEditMode, localVideos])

  // 视频编辑模式：自动将 duration 设为输入视频总时长
  useEffect(() => {
    if (inputVideoDuration !== null && inputVideoDuration !== duration) {
      setDuration(inputVideoDuration)
      updateConfig(configKey, { duration: inputVideoDuration })
    }
  }, [inputVideoDuration])

  // configKey 变化时（切换草稿箱），同步本地状态到新 config
  useEffect(() => {
    if (!_hasHydrated)
      return // 等待 IndexedDB 恢复完成

    const newConfig = getConfig(configKey)
    setAspectRatio(newConfig.aspectRatio)
    setDuration(newConfig.duration)
    setModelType(newConfig.modelType)
    setContentType(newConfig.contentType)
    setImageModel(newConfig.imageModel)
    setImageCount(newConfig.imageCount)
    setImageSize(newConfig.imageSize)
    setQuantity(newConfig.quantity)
    setIsDraftMode(newConfig.isDraftMode ?? true)
    // selectedPlatforms 需要区域过滤 + 空时默认全选
    const storedPlatforms = newConfig.selectedPlatforms
    if (storedPlatforms.length === 0) {
      setSelectedPlatforms(defaultPlatforms)
    }
    else {
      setSelectedPlatforms(storedPlatforms.filter(p => AccountPlatInfoMap.has(p) && !TASK_EXCLUDED_PLATFORMS.has(p)))
    }
    // 从 store 恢复描述
    const storedPrompt = newConfig.promptValue ?? ''
    setPromptValue(storedPrompt)
    defaultPromptFilledRef.current = !!storedPrompt
    // 从 store 恢复图片选择
    const storedImageIds = newConfig.selectedImageIds ?? []
    if (storedImageIds.length > 0) {
      setSelectedIds(storedImageIds)
      initialSelectionDone.current = true
    }
    else {
      setSelectedIds([])
      initialSelectionDone.current = false
    }
    lastAppliedBrandIdRef.current = newConfig.linkedBrandId || null
    // 从 store 恢复持久化的媒体
    const persistedMedias = newConfig.persistedMedias ?? []
    if (persistedMedias.length > 0) {
      setMedias(persistedMedias.map(m => ({
        id: m.id,
        url: m.url,
        type: m.type,
        name: m.name,
      })))
      // 恢复视频时长 map
      videoDurationMapRef.current.clear()
      persistedMedias
        .filter(m => m.type === 'video' && m.duration)
        .forEach(m => videoDurationMapRef.current.set(m.id, m.duration!))
    }
    else {
      clearMedias()
      videoDurationMapRef.current.clear()
    }
    isMediaInitializedRef.current = true
  }, [configKey, _hasHydrated])

  // 已选图片对象
  const selectedImages = useMemo(() => {
    const imageMap = new Map(imageList.map(img => [img.id, img]))
    return selectedIds.map(id => imageMap.get(id)).filter(Boolean) as BrandImage[]
  }, [selectedIds, imageList])

  // 平台兼容性检查
  const incompatiblePlatforms = useMemo(() => {
    return checkPlatformCompatibility(
      { contentType, aspectRatio, duration, imageCount },
      availablePlatforms,
      t,
    )
  }, [contentType, aspectRatio, duration, imageCount, availablePlatforms, t])

  // 有效选中平台（排除不兼容的），用于限制计算和 API 提交
  const effectiveSelectedPlatforms = useMemo(() =>
    selectedPlatforms.filter(p => !incompatiblePlatforms.has(p)), [selectedPlatforms, incompatiblePlatforms])

  // 平台限制计算（基于有效平台）
  const effectiveLimitsDetailed: EffectiveLimitsDetailed = useMemo(() => {
    return calcEffectiveLimitsDetailed(effectiveSelectedPlatforms)
  }, [effectiveSelectedPlatforms])

  // 事件处理
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptValue(e.target.value)
    updateConfig(configKey, { promptValue: e.target.value })
  }, [configKey, updateConfig])

  const handleImagesChange = useCallback((ids: string[]) => {
    setSelectedIds(ids)
    updateConfig(configKey, { selectedImageIds: ids })
  }, [configKey, updateConfig])

  const handleAspectRatioChange = useCallback((ratio: string) => {
    setAspectRatio(ratio)
    updateConfig(configKey, { aspectRatio: ratio })
  }, [configKey, updateConfig])

  const handleContentTypeChange = useCallback((ct: DraftContentType) => {
    setContentType(ct)
    updateConfig(configKey, { contentType: ct })
    // 切换内容类型时清理已上传的媒体资源
    clearMedias()
    videoDurationMapRef.current.clear()
    // 切换内容类型时校验并重置比例
    if (ct === 'image_text') {
      const supported = IMAGE_TEXT_ASPECT_RATIOS.map(r => r.label)
      if (!supported.includes(aspectRatio)) {
        const defaultRatio = supported.includes('9:16') ? '9:16' : (supported[0] ?? '9:16')
        setAspectRatio(defaultRatio)
        updateConfig(configKey, { aspectRatio: defaultRatio })
      }
    }
    else {
      const supported = currentVideoModelConfig.supportedRatios
      if (!supported.has(aspectRatio)) {
        const defaultRatio = supported.has('9:16') ? '9:16' : ([...supported][0] ?? '9:16')
        setAspectRatio(defaultRatio)
        updateConfig(configKey, { aspectRatio: defaultRatio })
      }
    }
    // 重置店铺图片选择（重新自动选中）
    const maxImages = ct === 'image_text'
      ? (currentImageModelInfo?.maxInputImages ?? DEFAULT_MAX_INPUT_IMAGES)
      : currentVideoModelConfig.maxImages
    const defaultCount = Math.min(5, maxImages, imageList.length)
    const newIds = imageList.slice(0, defaultCount).map(img => img.id)
    setSelectedIds(newIds)
    updateConfig(configKey, { selectedImageIds: newIds })
  }, [configKey, updateConfig, clearMedias, currentVideoModelConfig, currentImageModelInfo, imageList, aspectRatio])

  const handleImageModelChange = useCallback((im: string) => {
    setImageModel(im)
    updateConfig(configKey, { imageModel: im })
    const modelInfo = pricingData?.imageModels?.find(m => m.model === im)
    const maxImages = modelInfo?.maxInputImages ?? DEFAULT_MAX_INPUT_IMAGES
    if (maxImages === 0) {
      setSelectedIds([])
      updateConfig(configKey, { selectedImageIds: [] })
      clearMedias()
    }
    else if (selectedIds.length > maxImages) {
      const trimmed = selectedIds.slice(0, maxImages)
      setSelectedIds(trimmed)
      updateConfig(configKey, { selectedImageIds: trimmed })
    }
    // 切换模型后校验 imageSize 是否在新模型定价中
    if (modelInfo && !modelInfo.pricing.some(p => p.resolution === imageSize)) {
      const firstSize = modelInfo.pricing[0]?.resolution ?? '1K'
      setImageSize(firstSize)
      updateConfig(configKey, { imageSize: firstSize })
    }
  }, [selectedIds.length, configKey, updateConfig, clearMedias, pricingData, imageSize])

  const handleImageSizeChange = useCallback((size: string) => {
    setImageSize(size)
    updateConfig(configKey, { imageSize: size })
  }, [configKey, updateConfig])

  const handleImageCountChange = useCallback((count: number) => {
    setImageCount(count)
    updateConfig(configKey, { imageCount: count })
  }, [configKey, updateConfig])

  const handleDurationChange = useCallback((d: number) => {
    setDuration(d)
    updateConfig(configKey, { duration: d })
  }, [configKey, updateConfig])

  const handleQuantityChange = useCallback((q: number) => {
    setQuantity(q)
    updateConfig(configKey, { quantity: q })
  }, [configKey, updateConfig])

  const handleModelTypeChange = useCallback((mt: VideoModelType) => {
    setModelType(mt)
    updateConfig(configKey, { modelType: mt })
    const newConfig = getVideoModelStaticConfig(mt, pricingData?.videoModels)
    const supported = newConfig.supportedRatios
    // 切换模型时默认选 9:16，不支持则选第一个可用比例
    const defaultRatio = supported.has('9:16')
      ? '9:16'
      : ([...supported][0] ?? '9:16')
    setAspectRatio(defaultRatio)
    updateConfig(configKey, { aspectRatio: defaultRatio })
    // 根据新模型的 maxImages 重新初始化选中的图片
    const maxImages = newConfig.maxImages
    const defaultCount = Math.min(maxImages, imageList.length)
    const newIds = imageList.slice(0, defaultCount).map(img => img.id)
    setSelectedIds(newIds)
    updateConfig(configKey, { selectedImageIds: newIds })
    // 清理超出限制的本地上传图片
    const currentLocalImages = localMedias.filter(m => m.type === 'image')
    if (currentLocalImages.length > 0 && newIds.length + currentLocalImages.length > maxImages) {
      const allowedLocal = Math.max(0, maxImages - newIds.length)
      for (let i = currentLocalImages.length - 1; i >= allowedLocal; i--) {
        const mediaIndex = localMedias.indexOf(currentLocalImages[i]!)
        if (mediaIndex >= 0)
          removeLocalMedia(mediaIndex)
      }
    }
    // 模型切换时检查视频数量是否超限
    const maxVideos = newConfig.maxVideos
    const currentVideos = localMedias.filter(m => m.type === 'video')
    if (currentVideos.length > maxVideos) {
      // 从后往前移除超限视频
      for (let i = currentVideos.length - 1; i >= maxVideos; i--) {
        const mediaIndex = localMedias.indexOf(currentVideos[i]!)
        if (mediaIndex >= 0)
          removeLocalMedia(mediaIndex)
      }
      toast.warning(t('detail.videoCountExceeded', { max: maxVideos }))
    }
    // 切换模型后 clamp duration 到新模型范围
    const newMaxDuration = newConfig.maxVideoDuration
    if (duration > newMaxDuration) {
      setDuration(newMaxDuration)
      updateConfig(configKey, { duration: newMaxDuration })
    }
  }, [aspectRatio, duration, configKey, updateConfig, imageList, localMedias, removeLocalMedia, t, pricingData?.videoModels])

  const handlePlatformsChange = useCallback((platforms: PlatType[]) => {
    setSelectedPlatforms(platforms)
    updateConfig(configKey, { selectedPlatforms: platforms })
  }, [configKey, updateConfig])

  const handleDraftModeChange = useCallback((isDraft: boolean) => {
    setIsDraftMode(isDraft)
    updateConfig(configKey, { isDraftMode: isDraft })
  }, [configKey, updateConfig])

  // 重置所有配置到默认值
  const handleReset = useCallback(() => {
    resetConfig(configKey)
    // 重置本地状态到默认值
    setAspectRatio('9:16')
    setDuration(8)
    const firstVideoModel = pricingData?.videoModels?.[0]?.name ?? ('' as VideoModelType)
    setModelType(firstVideoModel)
    setContentType('video')
    // 图文模型：优先用 API 返回的第一个有效值，回退到默认值
    const firstImageModel = pricingData?.imageModels?.[0]
    setImageModel(firstImageModel?.model ?? 'nb2')
    setImageCount(3)
    setImageSize(firstImageModel?.pricing?.[0]?.resolution ?? '1K')
    setQuantity(1)
    setIsDraftMode(true)
    setSelectedPlatforms(availablePlatforms)
    // 清空媒体
    clearMedias()
    videoDurationMapRef.current.clear()

    // 直接恢复默认提示词（不依赖 effect，避免多次点击时 deps 不变导致 effect 不触发）
    if (defaultPrompt) {
      setPromptValue(defaultPrompt)
      updateConfig(configKey, { promptValue: defaultPrompt })
      defaultPromptFilledRef.current = true
    }
    else {
      setPromptValue('')
      updateConfig(configKey, { promptValue: '' })
      defaultPromptFilledRef.current = false
    }

    // 直接恢复默认图片选中（不依赖 effect）
    if (imageList.length > 0) {
      const maxImages = getVideoModelStaticConfig(firstVideoModel, pricingData?.videoModels).maxImages
      const defaultCount = Math.min(5, maxImages, imageList.length)
      setSelectedIds(imageList.slice(0, defaultCount).map(img => img.id))
      initialSelectionDone.current = true
    }
    else {
      setSelectedIds([])
      initialSelectionDone.current = false
    }
  }, [configKey, resetConfig, clearMedias, defaultPlatforms, defaultPrompt, imageList, pricingData])

  // 本地上传处理
  const handleLocalUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'))
    const videoFiles = fileArray.filter(f => f.type.startsWith('video/'))

    // 验证图片数量
    const maxImages = contentType === 'image_text'
      ? (currentImageModelInfo?.maxInputImages ?? DEFAULT_MAX_INPUT_IMAGES)
      : currentVideoModelConfig.maxImages
    const currentImageCount = selectedIds.length + localImages.length
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

    // 图文模式不支持视频上传，过滤掉视频文件
    const validVideoFiles: File[] = []
    if (contentType === 'image_text') {
      if (videoFiles.length > 0) {
        toast.warning(t('detail.videoNotSupported'))
      }
    }
    else {
      // 验证视频数量
      const maxVideos = currentVideoModelConfig.maxVideos
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

      // 验证视频时长
      const maxDuration = currentVideoModelConfig.maxVideoDuration
      let currentTotalDuration = 0
      videoDurationMapRef.current.forEach(d => currentTotalDuration += d)

      let firstVideoMeta: { width: number, height: number } | null = null
      for (const vf of videoFiles) {
        try {
          const { duration: vDuration, width: vWidth, height: vHeight } = await getVideoMeta(vf)
          if (currentTotalDuration + vDuration > maxDuration) {
            toast.warning(t('detail.videoDurationExceeded', { max: maxDuration }))
            break
          }
          currentTotalDuration += vDuration
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

      // 用第一个有效视频的宽高自动匹配比例（仅在之前没有视频时）
      if (firstVideoMeta && localVideos.length === 0) {
        const supported = currentVideoModelConfig.supportedRatios
        const matched = matchClosestRatio(firstVideoMeta.width, firstVideoMeta.height, supported)
        if (matched && matched !== aspectRatio) {
          setAspectRatio(matched)
          updateConfig(configKey, { aspectRatio: matched })
        }
      }
    }

    const validFiles = [...imageFiles, ...validVideoFiles]
    if (validFiles.length > 0) {
      // 构建 FileList
      const dt = new DataTransfer()
      validFiles.forEach(f => dt.items.add(f))
      uploadMedias(dt.files)
    }
  }, [currentVideoModelConfig, contentType, imageModel, selectedIds.length, localImages.length, localVideos.length, uploadMedias, aspectRatio, configKey, updateConfig, t])

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current++
    if (dragCountRef.current === 1)
      setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current--
    if (dragCountRef.current === 0)
      setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current = 0
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0)
      handleLocalUpload(files)
  }, [handleLocalUpload])

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

    // 将平台参数限制追加到 prompt，让 AI 感知限制（非草稿模式不需要，因为不生成文案）
    const buildPromptWithLimits = (basePrompt: string): string => {
      if (!isDraftMode)
        return basePrompt
      const limits: string[] = []
      if (effectiveLimitsDetailed.titleMax) {
        limits.push(`标题字数限制：${effectiveLimitsDetailed.titleMax.value}`)
      }
      if (effectiveLimitsDetailed.desMax) {
        limits.push(`描述字数限制：${effectiveLimitsDetailed.desMax.value}`)
      }
      if (effectiveLimitsDetailed.topicMax) {
        limits.push(`话题数量限制：${effectiveLimitsDetailed.topicMax.value}`)
      }
      if (limits.length === 0)
        return basePrompt
      return `${basePrompt}\n\n重要：${limits.join('，')}`
    }

    const imageUrls = [
      ...selectedImages.map(img => getOssUrl(img.url)),
      ...localImages.filter(m => m.url).map(m => m.url),
    ]

    if (contentType === 'image_text') {
      // 图文模式积分验证
      const currentPricing = imagePricing.find(p => p.resolution === imageSize)
      const pricePerImage = currentPricing?.pricePerImage ?? 0
      const totalCredits = Math.ceil(pricePerImage * imageCount * quantity * 100) / 100
      const creditsBalance = useUserStore.getState().creditsBalance
      if (creditsBalance < totalCredits) {
        toast.error(t('detail.insufficientBalance', { total: totalCredits, balance: creditsBalance }))
        useAccountStore.getState().setLowBalanceAlertOpen(true)
        return
      }

      const success = await createImageTextBatchGeneration(
        quantity,
        imageModel,
        buildPromptWithLimits(promptValue.trim()),
        imageCount,
        aspectRatio,
        imageUrls.length > 0 ? imageUrls : undefined,
        groupId,
        imageSize,
        effectiveSelectedPlatforms.length > 0 ? effectiveSelectedPlatforms : undefined,
        isDraftMode ? 'draft' : 'image',
      )
      if (success) {
        toast.success(t('detail.imageTextGenerated'))
        onGenerated?.()
      }
    }
    else {
      // 视频模式积分验证（使用 API 驱动的查表积分）
      const totalCredits = videoCredits
      const creditsBalance = useUserStore.getState().creditsBalance
      if (creditsBalance < totalCredits) {
        toast.error(t('detail.insufficientBalance', { total: totalCredits, balance: creditsBalance }))
        useAccountStore.getState().setLowBalanceAlertOpen(true)
        return
      }

      const videoUrls = localVideos.filter(v => v.url).map(v => v.url)

      const success = await createBatchGeneration(
        quantity,
        modelType,
        duration,
        aspectRatio,
        buildPromptWithLimits(promptValue.trim()) || undefined,
        imageUrls.length > 0 ? imageUrls : undefined,
        videoUrls.length > 0 ? videoUrls : undefined,
        groupId,
        effectiveSelectedPlatforms.length > 0 ? effectiveSelectedPlatforms : undefined,
        isDraftMode ? 'draft' : 'video',
      )
      if (success) {
        toast.success(t('detail.aiBatchGenerate'))
        onGenerated?.()
      }
    }
  }, [promptValue, aspectRatio, duration, modelType, selectedImages, localImages, localVideos, hasVideos, quantity, createBatchGeneration, createImageTextBatchGeneration, contentType, imageModel, imageCount, imageSize, imagePricing, videoCredits, isUploading, t, groupId, onGenerated, effectiveSelectedPlatforms, effectiveLimitsDetailed, isDraftMode])

  // Prompts 探索页 URL（不同语言对应不同路径）
  const promptsExploreUrl = useMemo(() => {
    const lngPath = PROMPTS_EXPLORE_LNG_MAP[lng]
    return lngPath
      ? `https://youmind.com/${lngPath}/grok-imagine-prompts`
      : 'https://youmind.com/grok-imagine-prompts'
  }, [lng])

  // 动态 Placeholder
  const placeholder = useMemo(() => {
    return t('detail.promptPlaceholder')
  }, [t])

  // 视频提示文本（传给 ImageStack 用于 Tooltip）
  const videoHintText = useMemo(() => {
    return t('detail.videoHintGrok')
  }, [t])

  // 上传能力判断
  const maxUploadImages = contentType === 'image_text' ? (currentImageModelInfo?.maxInputImages ?? DEFAULT_MAX_INPUT_IMAGES) : currentVideoModelConfig.maxImages
  const canUploadImage = selectedIds.length + localImages.length < maxUploadImages
  const canUploadVideo = contentType === 'video' && currentVideoModelConfig.maxVideos > 0 && localVideos.length < currentVideoModelConfig.maxVideos

  return (
    <div
      className={cn(styles.container, isVideoEditMode && styles.videoEditMode, isDragging && styles.dragging, className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 上半区：图片堆叠 + textarea */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 p-4 pb-2">
        <div className="flex-shrink-0 pt-1 w-full sm:w-auto">
          <ImageStack
            images={selectedImages}
            allImages={imageList}
            selectedIds={selectedIds}
            maxImages={contentType === 'image_text' ? (currentImageModelInfo?.maxInputImages ?? DEFAULT_MAX_INPUT_IMAGES) : currentVideoModelConfig.maxImages}
            onImagesChange={handleImagesChange}
            localMedias={localMedias}
            onLocalMediaRemove={handleLocalMediaRemove}
            onLocalUpload={handleLocalUpload}
            modelType={modelType}
            canUploadImage={canUploadImage}
            canUploadVideo={canUploadVideo}
            videoHintText={videoHintText}
            localImageCount={localImages.length}
          />
        </div>
        <div className="relative w-full sm:flex-1 sm:min-w-0">
          <textarea
            data-testid="draftbox-ai-prompt-input"
            className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none min-h-[80px] max-h-[160px] md:min-h-[100px] pr-7"
            placeholder={placeholder}
            value={promptValue}
            onChange={handlePromptChange}
            maxLength={PROMPT_MAX_LENGTH}
            rows={3}
          />
          <div className="absolute top-0 right-0 flex flex-col items-center gap-0.5">
            {/* 刷新按钮 - 始终可见 */}
            <button
              data-testid="draftbox-ai-reset-btn"
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={handleReset}
              title={t('detail.resetConfig')}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            {/* 清空按钮 - 有内容时才显示 */}
            {promptValue && (
              <button
                data-testid="draftbox-ai-clear-btn"
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                onClick={() => {
                  setPromptValue('')
                  setSelectedIds([])
                  clearMedias()
                  videoDurationMapRef.current.clear()
                  updateConfig(configKey, { persistedMedias: [], selectedImageIds: [], promptValue: '' })
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 下半区：工具栏 */}
      <div className="px-4 pb-3 pt-0">
        <ToolBarInline
          contentType={contentType}
          modelType={modelType}
          aspectRatio={aspectRatio}
          duration={duration}
          quantity={quantity}
          imageModel={imageModel}
          imageCount={imageCount}
          imageSize={imageSize}
          imageModelOptions={imageModelOptions}
          imagePricing={imagePricing}
          videoModels={pricingData?.videoModels}
          videoModelOptions={videoModelOptions}
          videoDurationLimits={videoDurationLimits}
          videoCredits={videoCredits}
          isVideoEditMode={isVideoEditMode}
          inputVideoDuration={inputVideoDuration}
          isPricingLoading={isPricingLoading}
          isLoading={isGeneratingBatch || isUploading}
          hasVideos={hasVideos}
          promptsExploreUrl={promptsExploreUrl}
          promptsExploreLabel={t('detail.exploreMorePrompts')}
          isDraftMode={isDraftMode}
          selectedPlatforms={selectedPlatforms}
          effectiveLimitsDetailed={effectiveLimitsDetailed}
          disabledPlatforms={incompatiblePlatforms}
          onDraftModeChange={handleDraftModeChange}
          onContentTypeChange={handleContentTypeChange}
          onModelTypeChange={handleModelTypeChange}
          onAspectRatioChange={handleAspectRatioChange}
          onDurationChange={handleDurationChange}
          onQuantityChange={handleQuantityChange}
          onImageModelChange={handleImageModelChange}
          onImageCountChange={handleImageCountChange}
          onImageSizeChange={handleImageSizeChange}
          onPlatformsChange={handlePlatformsChange}
          onSubmit={handleSubmit}
        />
      </div>

      {/* 拖拽上传遮罩 */}
      {isDragging && (
        <div className={styles.overlay}>
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('detail.dropToUpload')}</span>
        </div>
      )}
    </div>
  )
})

AiBatchGenerateBar.displayName = 'AiBatchGenerateBar'

export default AiBatchGenerateBar
