import type { InstagramNoUserAuthUrlParams, InstagramNoUserAuthUrlVo } from './instagram.types'
import http from '@/utils/request'

/**
 * Instagram 公开授权接口（无需登录）
 * 获取 Instagram 授权 URL，用于推广码发布场景
 */
export function apiGetInstagramNoUserAuthUrl(params: InstagramNoUserAuthUrlParams) {
  return http.post<InstagramNoUserAuthUrlVo>('plat/meta/auth/url/public', params)
}
