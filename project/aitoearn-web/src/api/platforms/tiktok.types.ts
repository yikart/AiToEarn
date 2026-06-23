// Source: platforms/tiktok.api.ts inline types
// Source: plat/tiktok.ts

/**
 * TikTokPrivacyLevel 类型。
 */
export type TikTokPrivacyLevel
  = | 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'

/**
 * TikTokNoUserAuthUrlParams 请求参数。
 */
export interface TikTokNoUserAuthUrlParams {
  promotionCode: string
}
/**
 * TikTok public auth URL response.
 */
export interface TikTokNoUserAuthUrlVo {
  url: string
  promotionCode: string
}
