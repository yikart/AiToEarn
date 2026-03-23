/**
 * settlement.ts - CPM/CPE 预估计算工具
 * 计算互动分与预估金额（与后端 common.ts 权重一致）
 */

/** CPE 互动分权重 */
export const ENGAGEMENT_WEIGHTS = { LIKE: 1, COLLECT: 3, COMMENT: 5 } as const

/** 计算互动分 */
export function calculateEngagementScore(likes: number, favorites: number, comments: number): number {
  return likes * ENGAGEMENT_WEIGHTS.LIKE + favorites * ENGAGEMENT_WEIGHTS.COLLECT + comments * ENGAGEMENT_WEIGHTS.COMMENT
}

/** 预估金额上限（分），50 元 */
export const ESTIMATED_AMOUNT_CAP = 5000

/** 计算预估金额（分），count 为播放量或互动分，pricePerThousand 为每千次单价（分） */
export function calculateEstimatedAmount(count: number, pricePerThousand: number): number {
  const amount = Math.round((count / 1000) * pricePerThousand)
  return Math.min(amount, ESTIMATED_AMOUNT_CAP)
}
