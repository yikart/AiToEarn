import { isChina } from '@/constant'
import http from '@/utils/request'

/**
 * Search Douyin Topics
 * Search topics on Douyin/TikTok platforms.
 */
export function getDouyinTopicsApi(keyword: string) {
  return http.post<string[]>('statistics/channels/douyin/searchTopic', {
    topic: keyword,
    language: isChina ? 'zh-CN' : 'en',
  })
}
