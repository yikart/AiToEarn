/**
 * CalendarRecord 组件
 *
 * 功能描述: 可拖拽的发布记录组件（桌面端支持拖拽，移动端禁用）
 */

import type { ForwardedRef } from 'react'
import type { DragSourceMonitor } from 'react-dnd'
import type { IRecordCoreRef } from './RecordCore'
import type { PublishRecordItem } from '@/api/platforms/publish.types'
import dayjs from 'dayjs'
import { forwardRef, memo, useEffect, useRef } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useShallow } from 'zustand/react/shallow'
import { updateChannelPublishAtApi } from '@/api/channels/channel.api'
import {
  canReschedulePublishRecord,
  getDays,
  getPublishRecordTaskId,
  getUtcDays,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { useTransClient } from '@/app/i18n/client'
import { useIsMobile } from '@/hooks/useIsMobile'
import { toast } from '@/utils/ui/toast'
import RecordCore from './RecordCore'

export interface ICalendarRecordRef {}

export interface ICalendarRecordProps {
  publishRecord: PublishRecordItem
}

interface CalendarDropResult {
  time: {
    date: Date | string
    keepOriginalTime?: boolean
  }
}

interface CalendarDragItem {
  publishRecord: PublishRecordItem
  dragPreviewWidth?: number
}

function isCalendarDropResult(value: unknown): value is CalendarDropResult {
  if (!value || typeof value !== 'object')
    return false

  const { time } = value as { time?: unknown }
  if (!time || typeof time !== 'object')
    return false

  const { date } = time as { date?: unknown }
  return date instanceof Date || typeof date === 'string'
}

const CalendarRecord = memo(
  forwardRef(({ publishRecord }: ICalendarRecordProps, ref: ForwardedRef<ICalendarRecordRef>) => {
    const isMobile = useIsMobile()
    const { t } = useTransClient('publish')
    const recordRef = useRef<HTMLDivElement | null>(null)
    const recordCoreRef = useRef<IRecordCoreRef>(null)
    const { setRecordMap, recordMap } = useCalendarTiming(
      useShallow(state => ({
        setRecordMap: state.setRecordMap,
        recordMap: state.recordMap,
      })),
    )
    const canDragRecord = !isMobile && canReschedulePublishRecord(
      publishRecord.status,
      publishRecord.publishTime,
    )
    const [{ opacity }, drag, preview] = useDrag(
      () => ({
        // 移动端禁用拖拽
        type: isMobile ? 'none' : 'box',
        canDrag: () => !isMobile && canReschedulePublishRecord(
          publishRecord.status,
          publishRecord.publishTime,
        ),
        item: (): CalendarDragItem => {
          recordCoreRef.current?.closeDetail()

          return {
            publishRecord,
            dragPreviewWidth: recordRef.current?.getBoundingClientRect().width,
          }
        },
        async end(item, monitor) {
          const dropResult = monitor.getDropResult()
          if (!isCalendarDropResult(dropResult))
            return null

          const { publishRecord } = item
          if (!canReschedulePublishRecord(publishRecord.status, publishRecord.publishTime))
            return null

          const newRecordMap = new Map(recordMap)
          const days = getDays(publishRecord.publishTime)
          const timeStr = days.format('YYYY-MM-DD')
          const newTimeStr = getDays(dropResult.time.date).format('YYYY-MM-DD')

          // 原始时间
          const oldDate = dayjs(item.publishRecord.publishTime)
          // 新日期：月视图只改日期，周视图使用目标时间槽
          const newDate = dayjs(dropResult.time.date)
          const nextPublishTime = dropResult.time.keepOriginalTime
            ? newDate
                .hour(oldDate.hour())
                .minute(oldDate.minute())
                .second(oldDate.second())
                .millisecond(oldDate.millisecond())
            : newDate
          const nextPublishRecord = {
            ...publishRecord,
            publishTime: nextPublishTime.toDate(),
          }

          // 移除旧数据
          newRecordMap.set(
            timeStr,
            (newRecordMap.get(timeStr) ?? []).filter(v => v.id !== publishRecord.id),
          )
          // 添加新数据
          let list = [...(newRecordMap.get(newTimeStr) ?? [])]
          list.push(nextPublishRecord)
          // 排序
          list = list.sort(
            (a, b) => new Date(a.publishTime).getTime() - new Date(b.publishTime).getTime(),
          )
          newRecordMap.set(newTimeStr, list)

          setRecordMap(newRecordMap)
          // 更新API
          try {
            const res = await updateChannelPublishAtApi(
              getPublishRecordTaskId(publishRecord),
              getUtcDays(nextPublishRecord.publishTime).format(),
            )
            if (!res || res.code !== 0) {
              setRecordMap(recordMap)
              return
            }

            toast.success(t('record.rescheduleSuccess'))
          }
          catch {
            setRecordMap(recordMap)
          }
        },
        collect: (monitor: DragSourceMonitor) => ({
          opacity: monitor.isDragging() ? 0 : 1,
        }),
      }),
      [canDragRecord, publishRecord, recordMap, isMobile, t],
    )

    useEffect(() => {
      // 移动端不需要设置空图片预览
      if (!isMobile) {
        preview(getEmptyImage(), { captureDraggingState: true })
      }
    }, [isMobile, preview])

    return (
      <div
        style={{ opacity }}
        ref={(node) => {
          recordRef.current = node
          // 只在桌面端且可改期状态启用拖拽
          if (canDragRecord) {
            drag(node)
          }
        }}
        role={isMobile ? 'button' : 'DraggableBox'}
      >
        <RecordCore ref={recordCoreRef} publishRecord={publishRecord} />
      </div>
    )
  }),
)

export default CalendarRecord
