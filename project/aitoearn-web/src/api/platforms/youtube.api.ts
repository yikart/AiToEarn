import type { PublishOptionValuesVo } from '@/api/channels/channel.types'
import { request } from '@/utils/request'

// Source: plat/youtube.ts
/**
 * 获取账号平台动态发布选项取值
 */
export function apiGetYouTubeCategories(accountId: string, regionCode: string) {
  return request<PublishOptionValuesVo>({
    url: `v2/channels/accounts/${encodeURIComponent(accountId)}/publish-options/categoryId/values`,
    method: 'GET',
    params: {
      regionCode,
    },
  })
}
