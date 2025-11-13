import type {
  StatisticsPeriodApiParams,
  StatisticsPeriodModel,
} from '@/api/types/dataStatistics'
import http from '@/utils/request'

// 获取数据统计信息
export function getStatisticsPeriodApi(data: StatisticsPeriodApiParams) {
  return http.post<StatisticsPeriodModel>(
    'statistics/channels/period-batch',
    data,
  )
}

// 获取抖音话题
export function getDouyinTopicsApi(keyword: string) {
  return http.post<string[]>('statistics/channels/douyin/searchTopic', {
    topic: keyword,
    language: 'en',
  })
}
