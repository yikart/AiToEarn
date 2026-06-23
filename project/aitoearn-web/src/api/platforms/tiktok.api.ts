import type { TikTokNoUserAuthUrlParams, TikTokNoUserAuthUrlVo } from './tiktok.types'
import http from '@/utils/request'

/**
 * 获取 TikTok 无账号授权链接。
 */
export function apiGetTikTokNoUserAuthUrl(params: TikTokNoUserAuthUrlParams) {
  return http.post<TikTokNoUserAuthUrlVo>('plat/tiktok/authUrl', params)
}
