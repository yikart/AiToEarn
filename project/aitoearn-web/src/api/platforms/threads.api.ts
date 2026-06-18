import type { ThreadsLocationsResponse } from './threads.types'
import http from '@/utils/request'

/**
 * 获取Threads位置列表
 * @param accountId 账户ID
 * @param keyword 搜索关键词（可选）
 * @returns Threads 位置选项
 */
export function apiGetThreadsLocations(accountId: string, keyword?: string) {
  const params: any = { accountId }
  if (keyword) {
    params.keyword = keyword
  }
  return http.get<ThreadsLocationsResponse>(`plat/meta/threads/locations`, params)
}
