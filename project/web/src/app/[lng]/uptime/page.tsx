'use client'

import type { UptimeItem, UptimeModule, UptimeStatus } from '@/api/types/uptime'
import dayjs from 'dayjs'
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { UptimeModule as UptimeModuleEnum, UptimeStatus as UptimeStatusEnum, UptimeType } from '@/api/types/uptime'
import { getUptimeListApi } from '@/api/uptime'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// 模块名称映射
const moduleNameMap: Record<UptimeModule, string> = {
  [UptimeModuleEnum.Agent]: 'Agent',
  [UptimeModuleEnum.Server]: '服务器',
  [UptimeModuleEnum.Database]: '数据库',
  [UptimeModuleEnum.Network]: '网络',
  [UptimeModuleEnum.Other]: '其他',
}
// 类型名称映射
const typeNameMap: Record<UptimeType, string> = {
  [UptimeType.AgentStatus]: 'Agent状态',
}
// 状态配置
const statusConfig = {
  [UptimeStatusEnum.NORMAL]: {
    label: '正常',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    dotColor: 'bg-green-500',
  },
  [UptimeStatusEnum.TIMEOUT]: {
    label: '超时',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    dotColor: 'bg-yellow-500',
  },
  [UptimeStatusEnum.UNAVAILABLE]: {
    label: '不可用',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
  },
}

export default function UptimePage() {
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [uptimeList, setUptimeList] = useState<UptimeItem[]>([])

  // 加载历史数据用于状态条
  const loadHistoryData = async () => {
    setLoadingHistory(true)
    try {
      const endDate = dayjs()
      const startDate = endDate.subtract(90, 'day')

      // 使用接口获取过去90天的数据
      const allItems: UptimeItem[] = []
      let page = 1
      const pageSize = 1000
      let hasMore = true

      // 分页获取所有数据
      while (hasMore) {
        const params = {
          page,
          pageSize,
          time: [startDate.toISOString(), endDate.toISOString()],
        }
        console.log('------ response ------', params)

        const response = await getUptimeListApi(params)

        console.log('------ response ------', response)

        let items: UptimeItem[] = []
        let total = 0

        if (response?.data) {
          // 根据 API 定义，响应格式应该是 { list: UptimeItem[], total: number }
          if (typeof response.data === 'object' && response.data !== null && 'list' in response.data) {
            const data = response.data as { list: UptimeItem[], total: number }
            items = data.list || []
            total = data.total || 0
          }
          else if (typeof response.data === 'object' && response.data !== null && 'items' in response.data) {
            // 兼容 { items, total } 格式
            const data = response.data as { items: UptimeItem[], total: number }
            items = data.items || []
            total = data.total || 0
          }
          else if (Array.isArray(response.data)) {
            const dataArray = response.data as unknown[]
            // 如果是数组格式 [items, total]
            if (dataArray.length === 2 && Array.isArray(dataArray[0])) {
              items = (dataArray[0] as UptimeItem[]) || []
              total = (dataArray[1] as number) || 0
            }
            else {
              // 如果直接是数组
              items = dataArray as UptimeItem[]
              total = dataArray.length
            }
          }
        }

        allItems.push(...items)

        // 检查是否还有更多数据
        const currentTotal = (page - 1) * pageSize + items.length
        hasMore = currentTotal < total && items.length === pageSize
        page++
      }

      // 按创建时间排序
      allItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      setUptimeList(allItems)
    }
    catch (error: any) {
      console.error('Failed to load history data:', error)
    }
    finally {
      setLoadingHistory(false)
    }
  }

  // 历史数据只在组件挂载时加载一次
  useEffect(() => {
    loadHistoryData()
  }, [])

  // 计算整体状态
  const overallStatus = (() => {
    if (uptimeList.length === 0)
      return null

    const latestStatuses = new Map<string, UptimeItem>()

    // 获取每个模块的最新状态
    uptimeList.forEach((item) => {
      const key = `${item.module}-${item.type}`
      const existing = latestStatuses.get(key)
      if (!existing || new Date(item.createdAt) > new Date(existing.createdAt))
        latestStatuses.set(key, item)
    })

    const statuses = Array.from(latestStatuses.values())
    const hasUnavailable = statuses.some(s => s.status === UptimeStatusEnum.UNAVAILABLE)
    const hasTimeout = statuses.some(s => s.status === UptimeStatusEnum.TIMEOUT)

    if (hasUnavailable)
      return 'major-outage'
    if (hasTimeout)
      return 'partial-outage'
    return 'operational'
  })()

  // 获取整体状态文本
  const getOverallStatusText = () => {
    switch (overallStatus) {
      case 'major-outage':
        return '部分系统不可用'
      case 'partial-outage':
        return '部分系统性能下降'
      case 'operational':
        return '所有系统运行正常'
    }
  }

  // 获取整体状态颜色
  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'major-outage':
        return 'text-red-600'
      case 'partial-outage':
        return 'text-yellow-600'
      case 'operational':
        return 'text-green-600'
    }
  }

  // 获取模块的最新状态
  const getModuleLatestStatus = (module: UptimeModule) => {
    const moduleItems = uptimeList.filter(item => item.module === module)
    if (moduleItems.length === 0)
      return null

    const latest = moduleItems.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    })

    return latest.status
  }

  // 获取所有唯一模块
  const uniqueModules = Array.from(new Set(uptimeList.map(item => item.module)))

  // 计算正常运行时间百分比（整体）
  const calculateUptimePercentage = () => {
    if (uptimeList.length === 0)
      return 100

    const operationalDays = uptimeList.filter(d => d.status === UptimeStatusEnum.NORMAL).length
    return Math.round((operationalDays / uptimeList.length) * 100 * 100) / 100
  }

  // 计算指定模块和类型的正常运行时间百分比
  const calculateModuleTypeUptimePercentage = (module: UptimeModule, type: UptimeType) => {
    const items = uptimeList.filter(d => d.module === module && d.type === type)
    if (!items || items.length === 0)
      return 100
    const operationalDays = items.filter(d => d.status === UptimeStatusEnum.NORMAL).length
    return Math.round((operationalDays / items.length) * 100 * 100) / 100
  }

  // 获取状态条颜色
  const getStatusBarColor = (status: UptimeStatus) => {
    switch (status) {
      case UptimeStatusEnum.NORMAL:
        return 'bg-green-500'
      case UptimeStatusEnum.TIMEOUT:
        return 'bg-yellow-500'
      case UptimeStatusEnum.UNAVAILABLE:
        return 'bg-red-500'
    }
  }

  // 获取状态条标题
  const getStatusBarTitle = (status: UptimeStatus) => {
    switch (status) {
      case UptimeStatusEnum.NORMAL:
        return '正常运行'
      case UptimeStatusEnum.TIMEOUT:
        return '部分中断'
      case UptimeStatusEnum.UNAVAILABLE:
        return '重大中断'
    }
  }

  // 按模块和类型分组数据
  const getGroupedData = () => {
    const grouped = new Map<string, { module: UptimeModule, type: UptimeType, items: UptimeItem[] }>()

    uptimeList.forEach((item) => {
      const key = `${item.module}-${item.type}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          module: item.module,
          type: item.type,
          items: [],
        })
      }
      grouped.get(key)!.items.push(item)
    })

    return Array.from(grouped.values())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部横幅 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">系统状态</h1>
              <div className="flex items-center gap-2">
                <div
                  className={cn('w-3 h-3 rounded-full', {
                    'bg-green-500': overallStatus === 'operational',
                    'bg-yellow-500': overallStatus === 'partial-outage',
                    'bg-red-500': overallStatus === 'major-outage',
                  })}
                />
                <span className={cn('text-lg font-semibold', getOverallStatusColor())}>
                  {getOverallStatusText()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 为每个模块-类型组合显示状态条 */}
        {loadingHistory ? (
          <Card className="mb-8">
            <div className="p-6">
              <div className="py-8 text-center text-gray-500">
                <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p>加载中...</p>
              </div>
            </div>
          </Card>
        ) : (
          uptimeList.length > 0 ? (
            getGroupedData().map((group) => {
              // 按时间排序
              const sortedItems = [...group.items].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              )

              return (
                <Card key={`${group.module}-${group.type}`} className="mb-8">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {moduleNameMap[group.module]}
                        {typeNameMap[group.type] && ` - ${typeNameMap[group.type]}`}
                        {' '}
                        - 过去90天运行状态
                      </h2>
                      <div className="text-sm text-gray-600">
                        正常运行时间：
                        <span className="font-semibold text-gray-900 ml-1">
                          {calculateModuleTypeUptimePercentage(group.module, group.type)}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {sortedItems.map(item => (
                          <div
                            key={item.id}
                            className={cn(
                              'w-2 h-8 rounded-sm cursor-pointer transition-all hover:scale-110 hover:z-10 relative group',
                              getStatusBarColor(item.status),
                            )}
                            title={`${dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}: ${getStatusBarTitle(item.status)}`}
                          >
                            {/* 悬停提示 */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                <div className="font-semibold">
                                  {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                                </div>
                                <div className="text-gray-300">{getStatusBarTitle(item.status)}</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                  <div className="border-4 border-transparent border-t-gray-900" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* 图例 */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-green-500" />
                          <span>正常</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                          <span>中断</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-red-500" />
                          <span>重大中断</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-gray-200" />
                          <span>无数据</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className="mb-8">
              <div className="p-6">
                <div className="py-8 text-center text-gray-500">
                  <p>暂无数据</p>
                </div>
              </div>
            </Card>
          )
        )}
      </div>
    </div>
  )
}
