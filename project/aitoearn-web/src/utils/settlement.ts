/**
 * settlement.ts - CPM/CPE 预估计算工具
 * 计算互动分与预估金额（与后端 common.ts 权重一致）
 */

/** CPE 互动分权重 */
export const ENGAGEMENT_WEIGHTS = { LIKE: 1, SHARE: 1, COLLECT: 3, COMMENT: 5 } as const

export interface CpeCapMetricCounts {
  score: number
  likes: number
  shares: number
  favorites: number
  comments: number
}

/** 计算互动分 */
export function calculateEngagementScore(
  likes: number,
  favorites: number,
  comments: number,
  shares: number = 0,
): number {
  return (
    likes * ENGAGEMENT_WEIGHTS.LIKE
    + shares * ENGAGEMENT_WEIGHTS.SHARE
    + favorites * ENGAGEMENT_WEIGHTS.COLLECT
    + comments * ENGAGEMENT_WEIGHTS.COMMENT
  )
}

/** 计算预估金额（分），count 为播放量或互动分，pricePerThousand 为每千次单价（分） */
export function calculateEstimatedAmount(
  count: number,
  pricePerThousand: number,
  amountCap?: number,
): number {
  const amount = Math.round((count / 1000) * pricePerThousand)
  if (amountCap == null || amountCap <= 0)
    return amount
  return Math.min(amount, amountCap)
}

/** 计算达到封顶金额需要的播放量或互动分 */
export function calculateCapMetricCount(capAmount: number, rewardPerThousand: number) {
  if (capAmount <= 0 || rewardPerThousand <= 0)
    return null

  return Math.ceil((capAmount / rewardPerThousand) * 1000)
}

/** 计算 CPE 封顶金额对应的各类互动次数 */
export function calculateCpeCapMetricCounts(capAmount: number, cpeReward: number) {
  const score = calculateCapMetricCount(capAmount, cpeReward)
  if (!score)
    return null

  return {
    score,
    likes: Math.ceil(score / ENGAGEMENT_WEIGHTS.LIKE),
    shares: Math.ceil(score / ENGAGEMENT_WEIGHTS.SHARE),
    favorites: Math.ceil(score / ENGAGEMENT_WEIGHTS.COLLECT),
    comments: Math.ceil(score / ENGAGEMENT_WEIGHTS.COMMENT),
  }
}
