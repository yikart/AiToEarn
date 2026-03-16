/**
 * AI 批量生成 - 模型配置常量
 * 积分与时长等动态数据已由 pricing API 驱动，此处仅保留 API 不提供的静态配置
 */

import type { VideoModelInfo } from '@/api/types/draftGeneration'

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

/** 从 API 返回的 VideoModelInfo 动态生成静态配置 */
export function getVideoModelConfigFromApi(model: VideoModelInfo): VideoModelStaticConfig {
  return {
    supportedRatios: new Set(model.aspectRatios),
    maxImages: model.modes.some(m => IMAGE_UPLOAD_MODES.has(m)) ? model.maxInputImages : 0,
    maxVideos: model.modes.includes('video2video') ? 1 : 0,
    maxVideoDuration: model.durations.length > 0 ? Math.max(...model.durations) : 8,
  }
}

/** 默认静态配置，API 数据不可用时兜底 */
const DEFAULT_STATIC_CONFIG: VideoModelStaticConfig = {
  supportedRatios: new Set(['1:1', '16:9', '9:16', '4:3', '3:4']),
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

export const IMAGE_COUNT_LIMITS = { min: 1, max: 9 }
