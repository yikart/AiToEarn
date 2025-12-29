'use client'

import type {
  UptimeItem,
  UptimeModule,
  UptimeStatus,
} from '@/api/types/uptime'
import dayjs from 'dayjs'
import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  UptimeModule as UptimeModuleEnum,
  UptimeStatus as UptimeStatusEnum,
  UptimeType,
} from '@/api/types/uptime'
import { getUptimeListApi } from '@/api/uptime'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// 模块名称映射
const moduleNameMap: Record<UptimeModule, string> = {
  [UptimeModuleEnum.Agent]: 'Agent',
  [UptimeModuleEnum.Server]: '服务器',
  [UptimeModuleEnum.Ai]: 'Ai',
  [UptimeModuleEnum.Database]: '数据库',
  [UptimeModuleEnum.Network]: '网络',
  [UptimeModuleEnum.Other]: '其他',
}
// 类型名称映射
const typeNameMap: Record<UptimeType, string> = {
  [UptimeType.AgentStatus]: 'Agent状态',
  [UptimeType.AgentMcpStatus]: 'Agent Mcp 状态',
  [UptimeType.NewApiStatus]: 'NewApi 状态',
}

export default function UptimePage() {
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [dataMap, setDataMap] = useState<Map<UptimeType, UptimeItem[]>>(new Map())

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
        const response = await getUptimeListApi(params)

        let items: UptimeItem[] = []
        let total = 0

        if (response?.data) {
          const data = response.data
          items = data.list || []
          total = data.total || 0
        }

        allItems.push(...items)

        // 检查是否还有更多数据
        const currentTotal = (page - 1) * pageSize + items.length
        hasMore = currentTotal < total && items.length === pageSize
        page++
      }

      // 按类型分类
      const typeMap = new Map<UptimeType, UptimeItem[]>()
      allItems.forEach((item) => {
        const typeItems = typeMap.get(item.type) || []
        typeItems.push(item)
        typeMap.set(item.type, typeItems)
      })
      setDataMap(typeMap)
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

  // 计算指定模块和类型的正常运行时间百分比
  const calculateModuleTypeUptimePercentage = (
    module: UptimeModule,
    type: UptimeType,
  ) => {
    const items = dataMap.get(type) || []
    if (!items || items.length === 0)
      return 100
    const operationalDays = items.filter(
      d => d.module === module && d.status === UptimeStatusEnum.NORMAL,
    ).length
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
        return '正常'
      case UptimeStatusEnum.TIMEOUT:
        return '超时'
      case UptimeStatusEnum.UNAVAILABLE:
        return '中断'
    }
  }

  // 按模块和类型分组数据
  const getGroupedData = () => {
    const grouped = new Map<
      UptimeType,
      { module: UptimeModule, type: UptimeType, items: UptimeItem[] }
    >()

    dataMap.forEach((items, type) => {
      items.forEach((item) => {
        if (!grouped.has(type)) {
          grouped.set(
            type,
            {
              module: item.module,
              type,
              items: [],
            },
          )
        }
        grouped.get(type)!.items.push(item)
      })
    })

    return Array.from(grouped.values())
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        ) : dataMap.size > 0 ? (
          getGroupedData().map((group) => {
            // 按时间排序
            const sortedItems = [...group.items].sort(
              (a, b) =>
                new Date(a.createdAt).getTime()
                  - new Date(b.createdAt).getTime(),
            )

            return (
              <Card key={`${group.module}-${group.type}`} className="mb-8">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {' '}
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                        {moduleNameMap[group.module]}
                        {typeNameMap[group.type] && (
                          <>
                            <span className="text-gray-400">/</span>
                            <span className="text-blue-600">
                              {typeNameMap[group.type]}
                            </span>
                          </>
                        )}
                      </h2>
                    </h2>
                    <div className="text-sm text-gray-600">
                      正常运行时间：
                      <span className="font-semibold text-gray-900 ml-1">
                        {calculateModuleTypeUptimePercentage(
                          group.module,
                          group.type,
                        )}
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
                          title={`${dayjs(item.createdAt).format(
                            'YYYY-MM-DD HH:mm:ss',
                          )}: ${getStatusBarTitle(item.status)}`}
                        >
                          {/* 悬停提示 */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              <div className="font-semibold">
                                {dayjs(item.createdAt).format(
                                  'YYYY-MM-DD HH:mm:ss',
                                )}
                              </div>
                              <div className="text-gray-300">
                                {getStatusBarTitle(item.status)}
                              </div>
                              <div className="text-gray-100">{item.id}</div>
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
                        <span>超时</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <span>中断</span>
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
        )}
      </div>
    </div>
  )
}