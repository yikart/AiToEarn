/**
 * AI 批量生成 - 模型配置常量
 * 积分与时长等动态数据已由 pricing API 驱动，此处仅保留 API 不提供的静态配置
 */

import type { CreditsScope } from '@/api/_shared/credits.types'
import type { ImageModelInfo, VideoModelInfo, VideoModelInputConstraint, VideoModelPricing } from '@/api/ai/ai.types'

/** 根据比例字符串（如 "9:16"）计算预览方块的 w/h（缩放到合适的 UI 尺寸） */
export function ratioToPreviewSize(label: string): { w: number, h: number } {
  const [a, b] = label.split(':').map(Number)
  if (!a || !b)
    return { w: 14, h: 14 }
  const maxDim = 18
  const scale = maxDim / Math.max(a, b)
  return { w: Math.round(a * scale), h: Math.round(b * scale) }
}

export function getVideoModelCreditsScope(model?: VideoModelInfo): CreditsScope {
  if (model?.creditsScope === 'seedance')
    return 'seedance'
  return 'general'
}

export function isSeedanceCreditsModel(model?: VideoModelInfo): boolean {
  return getVideoModelCreditsScope(model) === 'seedance'
}

// ==================== 视频模型配置 ====================

/** 视频模型静态配置 */
export interface VideoModelStaticConfig {
  supportedRatios: Set<string>
  maxImages: number
  maxVideos: number
  maxAudios: number
  maxVideoDuration: number
  maxAudioDuration: number
  imageInputConstraints?: VideoModelInputConstraint
  videoInputConstraints?: VideoModelInputConstraint
  audioInputConstraints?: VideoModelInputConstraint
}

/** 允许上传图片的 modes */
const IMAGE_UPLOAD_MODES = new Set(['image2video', 'multi-image2video', 'flf2video', 'lf2video', 'multi-ref'])
const VIDEO_UPLOAD_MODE = 'video2video'
const MIXED_REFERENCE_MODE = 'multi-ref'
const DEFAULT_VIDEO_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4']
const DEFAULT_VIDEO_DURATION_LIMITS = { min: 4, max: 15 }

function normalizeOptionValue(value: string) {
  return value.trim()
}

function getOptionCompareKey(value: string) {
  return normalizeOptionValue(value).replace(/\s+/g, '').toLowerCase()
}

function getUniqueStrings(values: string[]) {
  const normalizedValues = new Map<string, string>()
  values.forEach((value) => {
    const normalizedValue = normalizeOptionValue(value)
    if (!normalizedValue)
      return
    const normalizedKey = getOptionCompareKey(normalizedValue)
    if (!normalizedValues.has(normalizedKey))
      normalizedValues.set(normalizedKey, normalizedValue)
  })
  return [...normalizedValues.values()]
}

function getCommonStrings(groups: string[][]) {
  const nonEmptyGroups = groups
    .map(group => getUniqueStrings(group))
    .filter(group => group.length > 0)
  if (nonEmptyGroups.length === 0)
    return []

  const [firstGroup, ...restGroups] = nonEmptyGroups
  if (!firstGroup)
    return []

  return firstGroup.filter(item => restGroups.every(group =>
    group.some(value => getOptionCompareKey(value) === getOptionCompareKey(item))))
}

export function getVideoModelAspectRatios(model?: VideoModelInfo): string[] {
  const ratios = getUniqueStrings(model?.aspectRatios?.filter(Boolean) ?? [])
  return ratios.length > 0 ? ratios : DEFAULT_VIDEO_ASPECT_RATIOS
}

/** 从 API 返回的 VideoModelInfo 动态生成静态配置 */
export function getVideoModelConfigFromApi(model: VideoModelInfo): VideoModelStaticConfig {
  const canUploadMixedReference = model.modes.includes(MIXED_REFERENCE_MODE)
  const canUploadVideo = model.modes.includes(VIDEO_UPLOAD_MODE) || canUploadMixedReference
  const videoInputConstraints = model.inputConstraints?.videos
  const audioInputConstraints = model.inputConstraints?.audios
  const imageInputConstraints = model.inputConstraints?.images
  const maxModelDuration = model.durations.length > 0 ? Math.max(...model.durations) : 8
  return {
    supportedRatios: new Set(getVideoModelAspectRatios(model)),
    maxImages: model.modes.some(m => IMAGE_UPLOAD_MODES.has(m)) ? imageInputConstraints?.maxCount ?? model.maxInputImages : 0,
    maxVideos: canUploadVideo ? videoInputConstraints?.maxCount ?? 1 : 0,
    maxAudios: canUploadMixedReference ? audioInputConstraints?.maxCount ?? 1 : 0,
    maxVideoDuration: canUploadVideo
      ? videoInputConstraints?.maxTotalDuration ?? videoInputConstraints?.maxDuration ?? maxModelDuration
      : maxModelDuration,
    maxAudioDuration: canUploadMixedReference
      ? audioInputConstraints?.maxTotalDuration ?? audioInputConstraints?.maxDuration ?? maxModelDuration
      : maxModelDuration,
    imageInputConstraints,
    videoInputConstraints: canUploadVideo ? videoInputConstraints : undefined,
    audioInputConstraints: canUploadMixedReference ? audioInputConstraints : undefined,
  }
}

/** 默认静态配置，API 数据不可用时兜底 */
const DEFAULT_STATIC_CONFIG: VideoModelStaticConfig = {
  supportedRatios: new Set(DEFAULT_VIDEO_ASPECT_RATIOS),
  maxImages: 1,
  maxVideos: 0,
  maxAudios: 0,
  maxVideoDuration: 8,
  maxAudioDuration: 8,
}

/** 获取视频模型的静态配置：优先从 API 数据动态生成，兜底用默认值 */
export function getVideoModelStaticConfig(modelName: string, videoModels?: VideoModelInfo[]): VideoModelStaticConfig {
  if (videoModels) {
    const model = videoModels.find(m => m.name === modelName)
    if (model)
      return getVideoModelConfigFromApi(model)
  }
  return DEFAULT_STATIC_CONFIG
}

/** 获取视频模型可选分辨率，优先使用模型字段，缺失时从 pricing 兜底 */
export function getVideoModelResolutions(model?: VideoModelInfo): string[] {
  const resolutions = getUniqueStrings(model?.resolutions?.filter(Boolean) ?? [])
  if (resolutions.length > 0)
    return resolutions

  return getUniqueStrings(model?.pricing?.map(item => item.resolution).filter((item): item is string => !!item) ?? [])
}

export function getVideoModelsCommonResolutions(models: VideoModelInfo[]): string[] {
  return getCommonStrings(models.map(model => getVideoModelResolutions(model)))
}

export function getVideoModelsCommonAspectRatios(models: VideoModelInfo[]): string[] {
  return getCommonStrings(models.map(model => getVideoModelAspectRatios(model)))
}

export function getVideoModelsCommonStaticConfig(models: VideoModelInfo[]): VideoModelStaticConfig {
  if (models.length === 0)
    return DEFAULT_STATIC_CONFIG

  const configs = models.map(model => getVideoModelConfigFromApi(model))
  return {
    supportedRatios: new Set(getVideoModelsCommonAspectRatios(models)),
    maxImages: Math.min(...configs.map(config => config.maxImages)),
    maxVideos: Math.min(...configs.map(config => config.maxVideos)),
    maxAudios: Math.min(...configs.map(config => config.maxAudios)),
    maxVideoDuration: Math.min(...configs.map(config => config.maxVideoDuration)),
    maxAudioDuration: Math.min(...configs.map(config => config.maxAudioDuration)),
    imageInputConstraints: mergeInputConstraints(configs.map(config => config.imageInputConstraints)),
    videoInputConstraints: mergeInputConstraints(configs.map(config => config.videoInputConstraints)),
    audioInputConstraints: mergeInputConstraints(configs.map(config => config.audioInputConstraints)),
  }
}

function mergeInputConstraints(constraints: Array<VideoModelInputConstraint | undefined>) {
  const items = constraints.filter((item): item is VideoModelInputConstraint => Boolean(item))
  if (items.length === 0)
    return undefined
  return {
    maxCount: minOptional(items.map(item => item.maxCount)),
    formats: intersectFormats(items.map(item => item.formats)),
    minDuration: maxOptional(items.map(item => item.minDuration)),
    maxDuration: minOptional(items.map(item => item.maxDuration)),
    maxTotalDuration: minOptional(items.map(item => item.maxTotalDuration)),
    maxSizeMb: minOptional(items.map(item => item.maxSizeMb)),
    minAspectRatio: maxOptional(items.map(item => item.minAspectRatio)),
    maxAspectRatio: minOptional(items.map(item => item.maxAspectRatio)),
    minWidth: maxOptional(items.map(item => item.minWidth)),
    maxWidth: minOptional(items.map(item => item.maxWidth)),
    minPixels: maxOptional(items.map(item => item.minPixels)),
    maxPixels: minOptional(items.map(item => item.maxPixels)),
    minFps: maxOptional(items.map(item => item.minFps)),
    maxFps: minOptional(items.map(item => item.maxFps)),
  }
}

function minOptional(values: Array<number | undefined>) {
  const items = values.filter((value): value is number => value !== undefined)
  return items.length > 0 ? Math.min(...items) : undefined
}

function maxOptional(values: Array<number | undefined>) {
  const items = values.filter((value): value is number => value !== undefined)
  return items.length > 0 ? Math.max(...items) : undefined
}

function intersectFormats(formatGroups: Array<string[] | undefined>) {
  const groups = formatGroups
    .filter((formats): formats is string[] => Boolean(formats?.length))
    .map(formats => formats.map(format => format.trim().toLowerCase()).filter(Boolean))
  if (groups.length === 0)
    return undefined
  const [firstGroup, ...restGroups] = groups
  return firstGroup?.filter(format => restGroups.every(group => group.includes(format)))
}

/** 获取视频模型默认分辨率 */
export function getVideoModelDefaultResolution(model?: VideoModelInfo): string {
  return model?.defaults?.resolution ?? getVideoModelResolutions(model)[0] ?? ''
}

export function getVideoModelDurationLimits(
  model: VideoModelInfo | undefined,
  resolution: string,
  isVideoEditMode: boolean,
): { min: number, max: number } {
  if (!model)
    return DEFAULT_VIDEO_DURATION_LIMITS

  const pricing = filterVideoPricingByResolution(model.pricing, resolution, isVideoEditMode)
  const durations = pricing.length > 0 ? pricing.map(item => item.duration) : model.durations
  if (durations.length === 0)
    return DEFAULT_VIDEO_DURATION_LIMITS

  return {
    min: Math.min(...durations),
    max: Math.max(...durations),
  }
}

/** 按模式与分辨率过滤视频定价；模型无分辨率定价时复用通用价格 */
export function filterVideoPricingByResolution(
  pricing: VideoModelPricing[] | undefined,
  resolution: string,
  isVideoEditMode: boolean,
): VideoModelPricing[] {
  const pricingItems = pricing ?? []
  const modePricing = isVideoEditMode
    ? pricingItems.filter(item => item.mode === 'video2video')
    : pricingItems.filter(item => !item.mode)
  const effectiveModePricing = modePricing.length > 0 ? modePricing : pricingItems.filter(item => !item.mode)

  if (resolution) {
    const resolutionPricing = effectiveModePricing.filter(item => item.resolution?.toLowerCase() === resolution.toLowerCase())
    if (resolutionPricing.length > 0)
      return resolutionPricing
  }

  const genericPricing = effectiveModePricing.filter(item => !item.resolution)
  return genericPricing.length > 0 ? genericPricing : effectiveModePricing
}

/** 按目标时长获取最接近的视频定价项 */
export function getNearestVideoPricing(pricing: VideoModelPricing[], duration: number) {
  const exactMatch = pricing.find(item => item.duration === duration)
  if (exactMatch)
    return exactMatch
  return [...pricing].sort(
    (a, b) => Math.abs(a.duration - duration) - Math.abs(b.duration - duration),
  )[0]
}

/** 获取视频模型指定分辨率的每秒积分价格 */
export function getVideoModelPricePerSecond(
  model: VideoModelInfo | undefined,
  resolution: string,
  duration: number,
  isVideoEditMode: boolean,
) {
  if (!model)
    return null

  const pricing = filterVideoPricingByResolution(model.pricing, resolution, isVideoEditMode)
  const nearestPricing = getNearestVideoPricing(pricing, duration)
  if (!nearestPricing || nearestPricing.duration <= 0)
    return null

  return nearestPricing.price / nearestPricing.duration
}

// ==================== 视频比例匹配 ====================

/** 将视频宽高匹配到最近的支持比例 */
export function matchClosestRatio(width: number, height: number, supportedRatios: Set<string>): string | null {
  const videoRatio = width / height
  let closest: string | null = null
  let minDiff = Infinity
  for (const label of supportedRatios) {
    const [w, h] = label.split(':').map(Number)
    const ratio = w! / h!
    const diff = Math.abs(videoRatio - ratio)
    if (diff < minDiff) {
      minDiff = diff
      closest = label
    }
  }
  return closest
}

// ==================== 图文模型常量 ====================

export const DEFAULT_MAX_INPUT_IMAGES = 14

export const IMAGE_TEXT_ASPECT_RATIOS = [
  { label: '1:1', w: 14, h: 14 },
  { label: '3:4', w: 12, h: 16 },
  { label: '4:3', w: 16, h: 12 },
  { label: '9:16', w: 10, h: 18 },
  { label: '16:9', w: 18, h: 10 },
]

/** 获取图片模型支持的比例，优先使用 pricing API 返回值，缺失时使用旧兜底 */
export function getImageModelAspectRatios(model?: ImageModelInfo): string[] {
  const supported = getUniqueStrings(model?.supportedAspectRatios?.filter(Boolean) ?? [])
  if (supported?.length)
    return supported
  return IMAGE_TEXT_ASPECT_RATIOS.map(ratio => ratio.label)
}

export function getImageModelsCommonAspectRatios(models: ImageModelInfo[]): string[] {
  return getCommonStrings(models.map(model => getImageModelAspectRatios(model)))
}

export function getImageModelsCommonResolutions(models: ImageModelInfo[]): string[] {
  return getCommonStrings(models.map(model => model.pricing.map(item => item.resolution).filter(Boolean)))
}

export function getImageModelsMaxInputImages(models: ImageModelInfo[]): number {
  if (models.length === 0)
    return DEFAULT_MAX_INPUT_IMAGES

  return Math.min(...models.map(model => model.maxInputImages ?? DEFAULT_MAX_INPUT_IMAGES))
}

export const IMAGE_COUNT_LIMITS = { min: 1, max: 9 }
