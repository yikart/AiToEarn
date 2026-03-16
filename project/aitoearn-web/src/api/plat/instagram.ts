/**
 * Instagram API - Instagram 平台相关接口
 */

import http from '@/utils/request'

export interface InstagramNoUserAuthUrlParams {
  materialGroupId: string // 推广码（素材组ID）
}

/**
 * Instagram 公开授权接口（无需登录）
 * 获取 Instagram 授权 URL，用于推广码发布场景
 */
export function apiGetInstagramNoUserAuthUrl(params: InstagramNoUserAuthUrlParams) {
  return http.post<{ url: string }>('plat/meta/auth/url/public', params)
}
