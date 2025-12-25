import type { UptimeItem, UptimeModule, UptimeType } from '@/api/types/uptime'
import http from '@/utils/request'

/**
 * 获取状态页面列表
 * @param params 查询参数
 * @param params.type 类型筛选（可选）
 * @param params.module 模块筛选（可选）
 * @param params.time 时间区间（可选）
 * @param params.page 页码
 * @param params.pageSize 每页数量
 */
export function getUptimeListApi(params: {
  type?: UptimeType
  module?: UptimeModule
  time?: string[]
  page: number
  pageSize: number
}) {
  return http.get<
    {
      list: UptimeItem[]
      total: number
    }
  >('uptime/list', {
    date: {
      params,
    },
  })
}
