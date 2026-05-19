/**
 * AI 模块类型定义
 */

export interface ChatModel {
  name: string
  description?: string
  logo?: string
  channel?: string
  scenes?: string[]
  inputModalities?: string[]
  outputModalities?: string[]
  pricing?: ChatModelPricing
  fixedImagePricing?: ChatModelFixedImagePricing[]
  tags?: string[]
  mainTag?: boolean
}

export interface ChatModelPricingTier {
  maxInputTokens?: number
  input?: Record<string, string>
  output?: Record<string, string>
}

export interface ChatModelPricing {
  prompt?: string
  completion?: string
  tiers?: ChatModelPricingTier[]
  originPricing?: {
    tiers?: ChatModelPricingTier[]
  }
}

export interface ChatModelFixedImagePricing {
  resolution: string
  price: number
}
