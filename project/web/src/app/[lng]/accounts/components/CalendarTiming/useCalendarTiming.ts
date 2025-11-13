import type FullCalendar from '@fullcalendar/react'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { getPublishList, getPublishQueue } from '@/api/plat/publish'
import { getDays } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useAccountStore } from '@/store/account'

export interface ICalendarTimingStore {
  // 日历单元格宽度
  calendarCallWidth: number
  // 发布记录数据，key=年月日，value=发布记录
  recordMap: Map<string, PublishRecordItem[]>
  // 请求发布记录loading
  listLoading: boolean
  // 当前日历ref
  calendarRef?: FullCalendar
}

const store: ICalendarTimingStore = {
  calendarCallWidth: 0,
  recordMap: new Map(),
  listLoading: false,
  calendarRef: undefined,
}

function getStore() {
  return lodash.cloneDeep(store)
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

        // 获取发布记录数据
        async getPubRecord(status?: number) {
          try {
            methods.setListLoading(true)
            const calendarApi = get().calendarRef?.getApi()
            const view = calendarApi?.view
            const visibleStart = view?.activeStart
            const visibleEnd = view?.activeEnd
            const startDay = getDays(visibleStart).startOf('day')
            const endDay = getDays(visibleEnd).subtract(1, 'day').endOf('day')

            const res = await getPublishList({
              time: [startDay.utc().format(), endDay.utc().format()],
              accountType: useAccountStore.getState().accountActive?.type,
              status,
              publishingChannel: 'internal',
            })
            methods.setListLoading(false)

            // 检查响应数据是否有效
            if (!res || !res.data || !Array.isArray(res.data)) {
              console.warn('获取发布记录数据失败或数据格式不正确:', res)
              methods.setRecordMap(new Map())
              return
            }

            const recordMap = new Map<string, PublishRecordItem[]>()
            // 将数据分拣到对应天中
            res.data.map((v) => {
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
          }
          catch (error) {
            console.error('获取发布记录数据时发生错误:', error)
            methods.setListLoading(false)
            methods.setRecordMap(new Map())
          }
        },

        // 获取列表模式队列数据（不依赖日历可视范围）
        async getQueueRecord(status?: number) {
          try {
            methods.setListLoading(true)
            const res = await getPublishQueue({
              accountType: useAccountStore.getState().accountActive?.type,
              status,
              publishingChannel: 'internal',
            })
            methods.setListLoading(false)

            if (!res || !res.data || !Array.isArray(res.data)) {
              console.warn('获取发布队列数据失败或数据格式不正确:', res)
              methods.setRecordMap(new Map())
              return
            }

            const recordMap = new Map<string, PublishRecordItem[]>()
            res.data.forEach((v) => {
              const days = getDays(v.publishTime)
              const timeStr = days.format('YYYY-MM-DD')
              let list = recordMap.get(timeStr)
              if (!list) {
                list = []
                recordMap.set(timeStr, list)
              }
              list.push(v)
            })
            methods.setRecordMap(recordMap)
          }
          catch (error) {
            console.error('获取发布队列时发生错误:', error)
            methods.setListLoading(false)
            methods.setRecordMap(new Map())
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
