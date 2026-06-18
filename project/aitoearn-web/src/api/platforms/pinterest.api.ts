import type { PinterestBoardCreateParams } from './pinterest.types'
import type { PublishOptionCreatedValueVo, PublishOptionValuesVo } from '@/api/channels/channel.types'
import http from '@/utils/request'
import { PINTEREST_BOARD_FIELD } from './pinterest.constants'

// Source: pinterest.ts
function getPinterestBoardOptionValuesUrl(accountId: string) {
  return `v2/channels/accounts/${encodeURIComponent(accountId)}/publish-options/${PINTEREST_BOARD_FIELD}/values`
}

/**
 * 创建board
 */
export function createPinterestBoardApi(data: PinterestBoardCreateParams, accountId: string) {
  return http.post<PublishOptionCreatedValueVo>(getPinterestBoardOptionValuesUrl(accountId), data)
}

/**
 * 获取board列表信息
 */
export function getPinterestBoardListApi(accountId: string) {
  return http.get<PublishOptionValuesVo>(getPinterestBoardOptionValuesUrl(accountId))
}
