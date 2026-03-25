/**
 * AI 草稿生成 - 类型定义
 * pricing API 响应类型
 */

export interface ImageModelPricing {
  resolution: string
  pricePerImage: number
}

export interface ImageModelInfo {
  model: string
  displayName: string
  pricing: ImageModelPricing[]
  supportedAspectRatios?: string[]
  maxInputImages?: number
}

export interface VideoModelPricing {
  duration: number
  price: number
  resolution?: string
  aspectRatio?: string
  discount?: string
  originPrice?: number
}

export interface VideoModelInfo {
  name: string
  description: string
  resolutions: string[]
  durations: number[]
  maxInputImages: number
  aspectRatios: string[]
  tags: string[]
  defaults: {
    resolution?: string
    aspectRatio?: string
    duration?: number
  }
  pricing: VideoModelPricing[]
}

export interface DraftGenerationPricingVo {
  imageModels: ImageModelInfo[]
  videoModels?: VideoModelInfo[]
}
