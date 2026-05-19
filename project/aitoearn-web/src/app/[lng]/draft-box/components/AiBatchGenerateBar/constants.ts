/**
 * AI 批量生成 - 模型配置常量
 * 积分与时长等动态数据已由 pricing API 驱动，此处仅保留 API 不提供的静态配置
 */

import type { ImageModelInfo, VideoModelInfo, VideoModelPricing } from '@/api/types/draftGeneration'

/** 根据比例字符串（如 "9:16"）计算预览方块的 w/h（缩放到合适的 UI 尺寸） */
export function ratioToPreviewSize(label: string): { w: number, h: number } {
  const [a, b] = label.split(':').map(Number)
  if (!a || !b)
    return { w: 14, h: 14 }
  const maxDim = 18
  const scale = maxDim / Math.max(a, b)
  return { w: Math.round(a * scale), h: Math.round(b * scale) }
}

// ==================== 视频模型配置 ====================

/** 视频模型静态配置 */
export interface VideoModelStaticConfig {
  supportedRatios: Set<string>
  maxImages: number
  maxVideos: number
  maxVideoDuration: number
}

/** 允许上传图片的 modes */
const IMAGE_UPLOAD_MODES = new Set(['image2video', 'multi-image2video', 'flf2video', 'lf2video'])
const DEFAULT_VIDEO_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4']

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
  return {
    supportedRatios: new Set(getVideoModelAspectRatios(model)),
    maxImages: model.modes.some(m => IMAGE_UPLOAD_MODES.has(m)) ? model.maxInputImages : 0,
    maxVideos: model.modes.includes('video2video') ? 1 : 0,
    maxVideoDuration: model.durations.length > 0 ? Math.max(...model.durations) : 8,
  }
}

/** 默认静态配置，API 数据不可用时兜底 */
const DEFAULT_STATIC_CONFIG: VideoModelStaticConfig = {
  supportedRatios: new Set(DEFAULT_VIDEO_ASPECT_RATIOS),
  maxImages: 1,
  maxVideos: 1,
  maxVideoDuration: 8,
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

  return getUniqueStrings(model?.pricing.map(item => item.resolution).filter((item): item is string => !!item) ?? [])
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
    maxVideoDuration: Math.min(...configs.map(config => config.maxVideoDuration)),
  }
}

/** 获取视频模型默认分辨率 */
export function getVideoModelDefaultResolution(model?: VideoModelInfo): string {
  return model?.defaults?.resolution ?? getVideoModelResolutions(model)[0] ?? ''
}

/** 按模式与分辨率过滤视频定价；模型无分辨率定价时复用通用价格 */
export function filterVideoPricingByResolution(
  pricing: VideoModelPricing[],
  resolution: string,
  isVideoEditMode: boolean,
): VideoModelPricing[] {
  const modePricing = isVideoEditMode
    ? pricing.filter(item => item.mode === 'video2video')
    : pricing.filter(item => !item.mode)
  const effectiveModePricing = modePricing.length > 0 ? modePricing : pricing.filter(item => !item.mode)

  if (resolution) {
    const resolutionPricing = effectiveModePricing.filter(item => item.resolution?.toLowerCase() === resolution.toLowerCase())
    if (resolutionPricing.length > 0)
      return resolutionPricing
  }

  const genericPricing = effectiveModePricing.filter(item => !item.resolution)
  return genericPricing.length > 0 ? genericPricing : effectiveModePricing
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
