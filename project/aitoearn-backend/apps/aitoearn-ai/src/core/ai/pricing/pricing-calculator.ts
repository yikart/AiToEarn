import { BigNumber } from 'bignumber.js'

const tokenModalities = ['text', 'image', 'video', 'audio'] as const

export interface TokenModalityPricing {
  text: string
  image?: string
  video?: string
  audio?: string
}

export interface TokenPricingTier {
  maxInputTokens?: number
  input: TokenModalityPricing
  output: TokenModalityPricing
}

export interface FlatPricing {
  price: string
}

export interface TieredTokenPricing {
  tiers: TokenPricingTier[]
}

export type ChatPricing = FlatPricing | TieredTokenPricing

export interface TokenUsageDetails {
  text?: number
  image?: number
  video?: number
  audio?: number
}

export interface BillableTokenUsage {
  input_tokens?: number
  output_tokens?: number
  input_token_details?: TokenUsageDetails
  output_token_details?: TokenUsageDetails
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function toSafeNumber(value: unknown): number {
  return isValidNumber(value) ? value : 0
}

function calculateModalityPoints(
  rates: TokenModalityPricing,
  details: TokenUsageDetails | undefined,
  totalTokens: number,
): BigNumber {
  const providedDetailsTotal = tokenModalities.reduce((sum, modality) => {
    const tokens = details?.[modality]
    return sum + (isValidNumber(tokens) ? tokens : 0)
  }, 0)

  let points = new BigNumber(0)

  for (const modality of tokenModalities) {
    const rate = rates[modality]
    if (rate == null) {
      continue
    }

    let tokens = details?.[modality]

    // If text tokens are missing and no modality details were provided at all,
    // consume remaining tokens as text (backward compat for APIs without breakdown).
    if (!isValidNumber(tokens) && modality === 'text' && details == null) {
      const residual = totalTokens - providedDetailsTotal
      tokens = residual > 0 ? residual : 0
    }

    if (!isValidNumber(tokens) || tokens <= 0) {
      continue
    }

    points = points.plus(new BigNumber(tokens).div(1000).times(rate))
  }

  return points
}

function selectTier(tiers: TokenPricingTier[], inputTokens: number): TokenPricingTier {
  const matched = tiers.find((tier) => {
    return tier.maxInputTokens == null || inputTokens <= tier.maxInputTokens
  })

  return matched || tiers[tiers.length - 1]
}

export function isFlatPricing(pricing: ChatPricing): pricing is FlatPricing {
  return 'price' in pricing
}

export function isTieredTokenPricing(pricing: ChatPricing): pricing is TieredTokenPricing {
  return 'tiers' in pricing
}

export function calculatePricingPoints(pricing: ChatPricing, usage: BillableTokenUsage): number {
  if (isFlatPricing(pricing)) {
    return new BigNumber(pricing.price || 0).toNumber()
  }

  if (pricing.tiers.length === 0) {
    return 0
  }

  const inputTokens = toSafeNumber(usage.input_tokens)
  const outputTokens = toSafeNumber(usage.output_tokens)

  const tier = selectTier(pricing.tiers, inputTokens)
  const inputPoints = calculateModalityPoints(tier.input, usage.input_token_details, inputTokens)
  const outputPoints = calculateModalityPoints(tier.output, usage.output_token_details, outputTokens)

  return inputPoints.plus(outputPoints).toNumber()
}
