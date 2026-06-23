import type { ThreadsLocationItem, ThreadsLocationsResponse } from './threads.types'
import type { PublishOptionValueItem, PublishOptionValuesVo } from '@/api/channels/channel.types'
import http from '@/utils/request'

const THREADS_LOCATION_FIELD = 'location_id'

function getThreadsLocationOptionValuesUrl(accountId: string) {
  return `v2/channels/accounts/${encodeURIComponent(accountId)}/publish-options/${THREADS_LOCATION_FIELD}/values`
}

function mapPublishOptionItemToThreadsLocation(item: PublishOptionValueItem): ThreadsLocationItem {
  return {
    id: item.value,
    label: item.label,
    description: item.description,
  }
}

/**
 * 获取Threads位置列表
 * @param accountId 账户ID
 * @param keyword 搜索关键词
 * @returns Threads 位置选项
 */
export function apiGetThreadsLocations(accountId: string, keyword: string) {
  return http
    .get<PublishOptionValuesVo>(getThreadsLocationOptionValuesUrl(accountId), { keyword })
    .then((response): ThreadsLocationsResponse | null => {
      if (!response)
        return response

      return {
        ...response,
        data: response.code === 0
          ? response.data.items.map(mapPublishOptionItemToThreadsLocation)
          : [],
      }
    })
}
