import type { PublishOptionValueItem, PublishOptionValuesVo } from '@/api/channels/channel.types'
import type { BiblPartItem } from '@/components/PublishDialog/publishDialog.type'
import http from '@/utils/request'

// Source: plat/bilibili.ts
function toNumber(value: unknown) {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : 0

  if (typeof value === 'string') {
    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : 0
  }

  return 0
}

function mapPublishOptionItemsToBilibiliPartitions(items: PublishOptionValueItem[]): BiblPartItem[] {
  return items.map(item => ({
    description: item.description ?? '',
    id: toNumber(item.value),
    name: item.label,
    parent: toNumber(item.extra?.parent),
    children: item.children ? mapPublishOptionItemsToBilibiliPartitions(item.children) : [],
  }))
}

/**
 * 获取B站分区列表
 * @param accountId 账户ID
 * @returns B 站分区选项
 */
export function apiGetBilibiliPartitions(accountId: string) {
  return http
    .get<PublishOptionValuesVo>(`v2/channels/accounts/${encodeURIComponent(accountId)}/publish-options/tid/values`)
    .then((response) => {
      if (!response)
        return response

      return {
        ...response,
        data: response.code === 0 ? mapPublishOptionItemsToBilibiliPartitions(response.data.items) : [],
      }
    })
}
