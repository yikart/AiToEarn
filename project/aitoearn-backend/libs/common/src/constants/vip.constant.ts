import { VipTier } from '../enums/vip.enum'

export const VIP_DURATION_DAYS = 365

export const VipBenefitMap: Record<VipTier, {
  displayName: string
  discountFactor: number
}> = {
  [VipTier.Fortune]: {
    displayName: '招财',
    discountFactor: 0.8,
  },
  [VipTier.Treasure]: {
    displayName: '聚宝',
    discountFactor: 0.5,
  },
}
