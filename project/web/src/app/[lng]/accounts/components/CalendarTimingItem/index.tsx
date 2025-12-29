/**
 * CalendarTimingItem 组件
 *
 * 功能描述: 日历单元格组件 - 显示日期和发布记录
 */

import type { DayCellContentArg } from '@fullcalendar/core'
import type { ForwardedRef } from 'react'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import dayjs from 'dayjs'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from 'react'
import { useDrop } from 'react-dnd'
import { useShallow } from 'zustand/react/shallow'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import CalendarRecord from './components/CalendarRecord'
import { CustomDragLayer } from './components/CustomDragLayer'

export interface ICalendarTimingItemRef {}

export interface ICalendarTimingItemProps {
  arg: DayCellContentArg
  onClickPub: (date: string) => void
  loading: boolean
  // 发布记录数据
  records?: PublishRecordItem[]
}

const CalendarTimingItem = memo(
  forwardRef(
    (
      { arg, onClickPub, loading, records }: ICalendarTimingItemProps,
      ref: ForwardedRef<ICalendarTimingItemRef>,
    ) => {
      const { t } = useTransClient('account')
      const isMobile = useIsMobile()

      // arg.date 是当前格子的日期，Date 类型
      const today = new Date()

      // 去掉时分秒，只比较年月日
      const argDate = new Date(
        arg.date.getFullYear(),
        arg.date.getMonth(),
        arg.date.getDate(),
      )
      const nowDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      )

      // [[小时，分钟]] [[4, 12]]
      const [reservationsTimes, setReservationsTimes] = useState([])
      const [{ canDrop, isOver }, drop] = useDrop(
        () => ({
          // 移动端禁用拖拽
          accept: isMobile ? 'none' : 'box',
          drop: () => ({
            time: arg,
          }),
          collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
          }),
        }),
        [isMobile],
      )
      const [isMore, setIsMore] = useState(false)
      const cellRef = useRef<HTMLDivElement | null>(null)
      const { recordMap } = useCalendarTiming(
        useShallow(state => ({
          recordMap: state.recordMap,
        })),
      )

      const reservationsTimesLast = useMemo(() => {
        return argDate >= nowDate ? reservationsTimes : []
      }, [reservationsTimes])

      // 移动端默认显示更少的记录
      const maxRecords = isMobile ? 2 : 3

      const recordsLast = useMemo(() => {
        if (!records)
          return []
        if (isMore) {
          return records
        }
        else {
          return records?.slice(0, maxRecords - reservationsTimesLast.length)
        }
      }, [isMore, records, reservationsTimesLast, recordMap, maxRecords])

      // 进入视图时将"今天"尽量居中显示（仅在日历容器内滚动）
      useEffect(() => {
        if (argDate.getTime() === nowDate.getTime()) {
          // 推迟到布局完成后再滚动
          setTimeout(() => {
            const calendarContainer = document.getElementById('calendarTiming-calendar')
            if (calendarContainer && cellRef.current) {
              // 计算目标位置，使"今天"居中显示
              const containerRect = calendarContainer.getBoundingClientRect()
              const cellRect = cellRef.current.getBoundingClientRect()
              const scrollTop = calendarContainer.scrollTop + (cellRect.top - containerRect.top) - (containerRect.height / 2) + (cellRect.height / 2)
              calendarContainer.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
            }
          }, 100)
        }
      }, [])

      return (
        <div
          ref={(node) => {
            // 移动端不启用 drop
            if (!isMobile && argDate >= nowDate) {
              drop(node)
            }
            cellRef.current = node
          }}
          className={cn(
            'calendarTimingItem--js',
            'box-border p-1.5 md:p-2.5 flex flex-col font-semibold',
            'min-h-[120px] md:min-h-[200px] h-full group',
            'transition-colors',
            argDate < nowDate && 'bg-muted/30',
            // 只在桌面端显示拖拽高亮
            !isMobile && isOver && 'bg-accent/50',
          )}
        >
          {/* 顶部：日期和添加按钮 */}
          <div className="flex justify-between items-center mb-1 md:mb-1.5 group/top">
            <div
              className={cn(
                'w-5 h-5 md:w-6 md:h-6 leading-5 md:leading-6 text-center rounded-full text-xs md:text-sm font-semibold',
                argDate.getTime() === nowDate.getTime() && 'bg-(--primary-color) text-white',
              )}
            >
              {arg.date.getDate()}
            </div>

            {/* 添加按钮：移动端始终可见，桌面端 hover 显示 */}
            {argDate >= nowDate && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  'h-5 w-5 md:h-6 md:w-6 p-0 cursor-pointer',
                  'md:opacity-0 md:group-hover:opacity-100 transition-opacity',
                )}
                onClick={() => {
                  const days = dayjs(arg.date)
                  const today = dayjs()

                  if (today.date() === days.date()) {
                    onClickPub(today.add(10, 'minute').format())
                  }
                  else {
                    onClickPub(days.format())
                  }
                }}
              >
                <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </Button>
            )}
          </div>

          {/* 内容区域 */}
          {loading
            ? (
                <div className="flex flex-col gap-1.5 md:gap-2">
                  <Skeleton className="h-[28px] md:h-[34px] w-full rounded-md" />
                </div>
              )
            : (
                <div className="flex flex-col gap-1.5 md:gap-2">
                  {/* 预约时间按钮 */}
                  {argDate >= nowDate
                    && reservationsTimesLast.map((v, i) => {
                      return (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline"
                          className="w-full h-[28px] md:h-[34px] text-xs group/btn relative overflow-hidden cursor-pointer"
                          onClick={() => {
                            const days = dayjs(arg.date)
                              .set('hour', v[0])
                              .set('minute', v[1])
                            onClickPub(days.format())
                          }}
                        >
                          <span className="group-hover/btn:opacity-0 transition-opacity">
                            {v[0]}
                            :
                            {v[1]}
                            {' '}
                            PM
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                            {t('addPost')}
                          </span>
                        </Button>
                      )
                    })}

                  {/* 发布记录 */}
                  {records
                    && recordsLast.map((v) => {
                      return (
                        <div key={v.id + v.title + v.uid + v.updatedAt}>
                          {/* 移动端不显示拖拽层 */}
                          {!isMobile && <CustomDragLayer publishRecord={v} snapToGrid={false} />}
                          <CalendarRecord publishRecord={v} />
                        </div>
                      )
                    })}

                  {/* 显示更多/收起按钮 */}
                  {records && records.length > maxRecords - reservationsTimesLast.length && (
                    <Button
                      variant="ghost"
                      className="w-full h-auto py-1.5 md:py-2 px-2 md:px-3 text-xs md:text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors justify-start cursor-pointer"
                      onClick={() => {
                        setIsMore(!isMore)
                      }}
                    >
                      {isMore
                        ? (
                            <>
                              <ChevronUp className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                              {t('calendar.hideMore')}
                            </>
                          )
                        : (
                            <>
                              <ChevronDown className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                              {records.length - recordsLast?.length}
                              {' '}
                              {t('calendar.showMore')}
                            </>
                          )}
                    </Button>
                  )}
                </div>
              )}
        </div>
      )
    },
  ),
)

export default CalendarTimingItem
