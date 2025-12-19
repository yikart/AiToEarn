import type { ForwardedRef } from 'react'
import type { DragSourceMonitor } from 'react-dnd'
import type {
  PublishRecordItem,
} from '@/api/plat/types/publish.types'
import dayjs from 'dayjs'
import { forwardRef, memo, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useShallow } from 'zustand/react/shallow'
import { updatePublishRecordTimeApi } from '@/api/plat/publish'
import {
  PublishStatus,
} from '@/api/plat/types/publish.types'
import {
  getDays,
  getUtcDays,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import styles from './calendarRecord.module.scss'
import RecordCore from './RecordCore'

export interface ICalendarRecordRef {}

export interface ICalendarRecordProps {
  publishRecord: PublishRecordItem
}

const CalendarRecord = memo(
  forwardRef(
    (
      { publishRecord }: ICalendarRecordProps,
      ref: ForwardedRef<ICalendarRecordRef>,
    ) => {
      const { setRecordMap, recordMap } = useCalendarTiming(
        useShallow(state => ({
          setRecordMap: state.setRecordMap,
          recordMap: state.recordMap,
        })),
      )
      const [{ opacity }, drag, preview] = useDrag(
        () => ({
          type: 'box',
          item: { publishRecord },
          end(item, monitor) {
            const dropResult: any = monitor.getDropResult()
            if (!dropResult)
              return null

            const { publishRecord } = item
            const newRecordMap = new Map(recordMap)
            const days = getDays(publishRecord.publishTime)
            const timeStr = days.format('YYYY-MM-DD')
            const newTimeStr = getDays(dropResult!.time.date).format(
              'YYYY-MM-DD',
            )

            // 原始时间
            const oldDate = dayjs(item.publishRecord.publishTime)
            // 新日期（只取年月日）
            const newDate = dayjs(dropResult!.time.date)

            // 合并年月日和时分秒
            const mergedDate = newDate
              .hour(oldDate.hour())
              .minute(oldDate.minute())
              .second(oldDate.second())
              .millisecond(oldDate.millisecond())

            item.publishRecord.publishTime = mergedDate.toDate()

            // 移除旧数据
            newRecordMap.set(
              timeStr,
              newRecordMap
                .get(timeStr)!
                .filter(v => v.id !== publishRecord.id),
            )
            // 添加新数据
            let list = newRecordMap.get(newTimeStr)
            if (!list) {
              list = []
              newRecordMap.set(newTimeStr, list)
            }
            list.push(publishRecord)
            // 排序
            list = list.sort(
              (a, b) =>
                new Date(a.publishTime).getTime()
                  - new Date(b.publishTime).getTime(),
            )
            newRecordMap.set(newTimeStr, list)

            setRecordMap(newRecordMap)
            // 更新API
            updatePublishRecordTimeApi({
              id: publishRecord.id,
              publishTime: getUtcDays(publishRecord.publishTime).format(),
            })
          },
          collect: (monitor: DragSourceMonitor) => ({
            opacity: monitor.isDragging() ? 0 : 1,
          }),
        }),
        [recordMap],
      )

      useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true })
      }, [])

      return (
        <div
          style={{ opacity }}
          ref={(node) => {
            if (publishRecord.status === PublishStatus.UNPUBLISH) {
              drag(node)
            }
          }}
          className={styles.calendarRecord}
          role="DraggableBox"
        >
          <RecordCore publishRecord={publishRecord} />
        </div>
      )
    },
  ),
)

export default CalendarRecord
