import type { DouyinMiniAppChannelAuthCompleteParams, DouyinMiniAppChannelAuthCompleteVo, DouyinMiniAppFansCount } from './douyin.types'
import http from '@/utils/request'

/**
 * 完成抖音小程序渠道授权。
 */
export function apiDouyinMiniAppChannelAuthComplete(params: DouyinMiniAppChannelAuthCompleteParams) {
  return http.post<DouyinMiniAppChannelAuthCompleteVo>('plat/douyin/miniapp-auth/complete', params)
}

/**
 * 获取抖音小程序首页粉丝数。
 */
export function apiDouyinMiniAppHomepageFansCount(dateType = 7, silent = true) {
  return http.get<DouyinMiniAppFansCount>('plat/douyin-miniapp/homepage-data/fans-count', { dateType }, silent)
}
