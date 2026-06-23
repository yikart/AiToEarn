import type FullCalendar from '@fullcalendar/react'
import type { ChannelPublishRecordItem, ChannelPublishRecordListVo } from '@/api/channels/channel.types'
import type { PublishRecordItem } from '@/api/platforms/publish.types'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { getChannelPublishRecordApi, getChannelPublishRecordsApi } from '@/api/channels/channel.api'
import { PublishStatus } from '@/api/platforms/publish.constants'
import { getDays } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useAccountStore } from '@/store/account'

const PUBLISH_RECORD_POLLING_INTERVAL = 20_000

const pollingPublishStatuses = new Set<PublishStatus>([
  PublishStatus.QUEUED,
  PublishStatus.PUB_LOADING,
])

interface CalendarTimingQueryOptions {
  status?: number
  dateRange?: [Date, Date]
}

function shouldPollPublishRecord(status: PublishStatus) {
  return pollingPublishStatuses.has(status)
}

export interface ICalendarTimingStore {
  // 日历单元格宽度
  calendarCallWidth: number
  // 发布记录数据，key=年月日，value=发布记录
  recordMap: Map<string, PublishRecordItem[]>
  // 请求发布记录loading
  listLoading: boolean
  // 当前日历ref
  calendarRef?: FullCalendar
  // 是否正在轮询
  polling: boolean
  // 最近一次列表查询条件
  lastQueryOptions?: CalendarTimingQueryOptions
}

const store: ICalendarTimingStore = {
  calendarCallWidth: 0,
  recordMap: new Map(),
  listLoading: false,
  calendarRef: undefined,
  polling: false,
  lastQueryOptions: undefined,
}

function getStore() {
  return lodash.cloneDeep(store)
}

function getPublishRecordList(data?: ChannelPublishRecordListVo) {
  if (!data) {
    return []
  }

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data.records)) {
    return data.records
  }

  if (Array.isArray(data.list)) {
    return data.list
  }

  if (Array.isArray(data.items)) {
    return data.items
  }

  if (Array.isArray(data.rows)) {
    return data.rows
  }

  return []
}

function normalizePublishRecord(record: ChannelPublishRecordItem): PublishRecordItem {
  return {
    option: record.option || {},
    userId: record.userId || '',
    flowId: record.flowId || '',
    userTaskId: record.userTaskId || '',
    taskId: record.taskId || record.id,
    taskMaterialId: record.taskMaterialId || '',
    type: record.type,
    title: record.title || '',
    desc: record.desc || '',
    accountId: record.accountId || '',
    topics: record.topics || [],
    accountType: record.accountType,
    uid: record.uid || '',
    videoUrl: record.videoUrl || '',
    coverUrl: record.coverUrl || '',
    imgUrlList: record.imgUrlList || [],
    publishTime: new Date(record.publishTime),
    status: Number(record.status) as PublishStatus,
    inQueue: record.inQueue || false,
    dataId: record.dataId || record.platformWorkId || '',
    workLink: record.workLink || '',
    linkStatus: record.linkStatus,
    linkError: record.linkError,
    linkMeta: record.linkMeta,
    platformWorkId: record.platformWorkId,
    createdAt: record.createdAt || '',
    updatedAt: record.updatedAt || '',
    id: record.id,
    errorMsg: record.errorMsg || '',
    engagement: record.engagement,
  }
}

function updateRecordMapItem(
  recordMap: Map<string, PublishRecordItem[]>,
  nextRecord: PublishRecordItem,
) {
  const nextRecordMap = new Map(recordMap)
  let previousRecord: PublishRecordItem | undefined

  nextRecordMap.forEach((recordList, dayKey) => {
    const currentRecord = recordList.find(item => item.id === nextRecord.id)
    if (currentRecord) {
      previousRecord = currentRecord
    }

    nextRecordMap.set(dayKey, recordList.filter(item => item.id !== nextRecord.id))
  })

  const publishTime = getDays(nextRecord.publishTime)
  const timeStr = publishTime.format('YYYY-MM-DD')
  const nextList = nextRecordMap.get(timeStr) ?? []
  nextList.push(nextRecord)
  nextList.sort((a, b) => new Date(a.publishTime).getTime() - new Date(b.publishTime).getTime())
  nextRecordMap.set(timeStr, nextList)

  return previousRecord ? nextRecordMap : recordMap
}

function removeRecordMapItem(recordMap: Map<string, PublishRecordItem[]>, recordId: string) {
  const nextRecordMap = new Map(recordMap)
  let hasRemoved = false

  nextRecordMap.forEach((recordList, dayKey) => {
    const nextList = recordList.filter(item => item.id !== recordId)
    if (nextList.length !== recordList.length) {
      hasRemoved = true
      nextRecordMap.set(dayKey, nextList)
    }
  })

  return hasRemoved ? nextRecordMap : recordMap
}

export const useCalendarTiming = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        setCalendarCallWidth(calendarCallWidth: number) {
          set({ calendarCallWidth })
        },
        setRecordMap(recordMap: Map<string, PublishRecordItem[]>) {
          set({ recordMap })
        },
        setListLoading(listLoading: boolean) {
          set({ listLoading })
        },
        setCalendarRef(calendarRef: FullCalendar) {
          set({ calendarRef })
        },
        setPolling(polling: boolean) {
          set({ polling })
        },
        removePubRecord(recordId: string) {
          const recordMap = removeRecordMapItem(get().recordMap, recordId)
          methods.setRecordMap(recordMap)
        },
        async refreshPubRecordDetail(recordId: string) {
          const res = await getChannelPublishRecordApi(recordId)
          if (!res || !res.data) {
            return undefined
          }

          const newPubRecord = normalizePublishRecord(res.data)
          const recordMap = updateRecordMapItem(get().recordMap, newPubRecord)
          methods.setRecordMap(recordMap)

          if (shouldPollPublishRecord(newPubRecord.status)) {
            methods.queryPubTask()
          }

          return newPubRecord
        },

        // 获取发布记录数据
        // dateRange: 可选的日期范围参数，用于周视图场景
        async getPubRecord(options?: CalendarTimingQueryOptions) {
          const { status, dateRange } = options || {}
          set({ lastQueryOptions: options })

          try {
            methods.setListLoading(true)

            let startDay, endDay

            if (dateRange) {
              // 使用传入的日期范围（周视图场景）
              startDay = getDays(dateRange[0]).startOf('day')
              endDay = getDays(dateRange[1]).endOf('day')
            }
            else {
              // 使用 FullCalendar 的日期范围（月视图场景）
              const calendarApi = get().calendarRef?.getApi()
              const view = calendarApi?.view
              const visibleStart = view?.activeStart
              const visibleEnd = view?.activeEnd

              if (visibleStart && visibleEnd) {
                startDay = getDays(visibleStart).startOf('day')
                endDay = getDays(visibleEnd).subtract(1, 'day').endOf('day')
              }
              else {
                // calendarRef 不可用时（移动端、未初始化等），默认当月范围
                startDay = getDays().startOf('month').startOf('day')
                endDay = getDays().endOf('month').endOf('day')
              }
            }

            const activeAccount = useAccountStore.getState().accountActive
            const requestParams = {
              time: [startDay.toISOString(), endDay.toISOString()] as [string, string],
              accountType: activeAccount?.type,
              status,
            }

            const res = await getChannelPublishRecordsApi(requestParams)
            methods.setListLoading(false)
            const records = getPublishRecordList(res?.data)

            // 检查响应数据是否有效
            if (!res || !res.data) {
              console.warn('获取发布记录数据失败或数据格式不正确:', res)
              methods.setRecordMap(new Map())
              return
            }

            const recordMap = new Map<string, PublishRecordItem[]>()
            // 将数据分拣到对应天中
            records.map((record) => {
              const v = normalizePublishRecord(record)
              const days = getDays(v.publishTime)
              const timeStr = days.format('YYYY-MM-DD')
              let list = recordMap.get(timeStr)
              if (!list) {
                list = []
                recordMap.set(timeStr, list)
              }
              list.push(v)
              recordMap.set(timeStr, list)
            })
            // 对每一天的记录按照 publishTime 时间从早到晚排序
            recordMap.forEach((v, k) => {
              let list = recordMap.get(k)
              if (list) {
                list = list.sort(
                  (a, b) =>
                    new Date(a?.publishTime ?? 0).getTime()
                      - new Date(b?.publishTime ?? 0).getTime(),
                )
                recordMap.set(k, list)
              }
            })
            methods.setRecordMap(recordMap)
            // 获取完数据后，启动轮询检查
            methods.queryPubTask()
          }
          catch (error) {
            console.error('获取发布记录数据时发生错误:', error)
            methods.setListLoading(false)
            methods.setRecordMap(new Map())
          }
        },

        async refreshCurrentPubRecords() {
          await methods.getPubRecord(get().lastQueryOptions)
        },

        // 查询列表是否有在队列中/发布中的数据，如果有则串行轮询查询详情，直到状态完成
        async queryPubTask() {
          if (get().polling) {
            return
          }
          methods.setPolling(true)

          let pollRecord: PublishRecordItem | null = null
          const recordMap = get().recordMap

          // 遍历 recordMap 查找队列中或发布中的记录，同一时间只轮询一条
          for (const [_dayKey, recordList] of recordMap.entries()) {
            if (pollRecord !== null) {
              break
            }
            for (const item of recordList) {
              if (shouldPollPublishRecord(item.status)) {
                pollRecord = item
                break
              }
            }
          }

          if (pollRecord === null) {
            methods.setPolling(false)
            return
          }

          methods._pollQueryPubTask(pollRecord)
        },

        // 轮询查询发布任务详情
        async _pollQueryPubTask(pubRecord: PublishRecordItem) {
          await new Promise(resolve => setTimeout(resolve, PUBLISH_RECORD_POLLING_INTERVAL))

          try {
            const res = await getChannelPublishRecordApi(pubRecord.id)
            if (!res || !res.data) {
              methods.setPolling(false)
              return
            }

            const newPubRecord = normalizePublishRecord(res.data)
            const recordMap = updateRecordMapItem(get().recordMap, newPubRecord)
            methods.setRecordMap(recordMap)

            if (shouldPollPublishRecord(newPubRecord.status)) {
              // 状态仍为队列中或发布中，继续轮询当前记录
              methods._pollQueryPubTask(newPubRecord)
            }
            else {
              methods.setPolling(false)
              // 当前记录已结束，继续串行查询下一条队列中或发布中的任务
              methods.queryPubTask()
            }
          }
          catch (error) {
            console.error('轮询查询发布任务详情时发生错误:', error)
            methods.setPolling(false)
          }
        },

        clear() {
          set({
            ...getStore(),
          })
        },
      }
      return methods
    },
  ),
)
