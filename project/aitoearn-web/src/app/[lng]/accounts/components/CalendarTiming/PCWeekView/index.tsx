/**
 * PCWeekView 组件
 *
 * 功能描述: PC 端日历周视图
 * - 显示当前周的 7 天（周日 - 周六）
 * - Y 轴显示时间刻度（每 2 小时）
 * - 网格布局：时间行 × 日期列
 * - 支持拖拽任务到不同日期/时间
 */

'use client'

import type { Dayjs } from 'dayjs'
import type { CalendarFestivalInfo } from '../calendarFestival.utils'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import dayjs from 'dayjs'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetClientLng } from '@/hooks/useSystem'
import { getDayjsLocale } from '@/lib/i18n/languageConfig'
import { cn } from '@/lib/utils'
import { useSystemStore } from '@/store/system'
import CalendarRecord from '../../CalendarTimingItem/components/CalendarRecord'
import { CustomDragLayer } from '../../CalendarTimingItem/components/CustomDragLayer'
import {
  filterCalendarFestivalEvents,
  getChinaCalendarEvents,
  getChinaCalendarLunarInfo,
} from '../calendarFestival.utils'
import CalendarFestivalSummary from '../CalendarFestivalSummary'
import CalendarLunarText from '../CalendarLunarText'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import 'dayjs/locale/de'
import 'dayjs/locale/fr'
import 'dayjs/locale/ja'
import 'dayjs/locale/ko'

// 时间槽：每 2 小时（12 AM, 2 AM, 4 AM, ..., 10 PM）
const TIME_SLOTS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]
const HOURS_PER_TIME_SLOT = 2
const VISIBLE_HOURS_PER_SCREEN = 12
const VISIBLE_TIME_SLOT_COUNT = VISIBLE_HOURS_PER_SCREEN / HOURS_PER_TIME_SLOT
const DEFAULT_TIME_CELL_HEIGHT = 120

/**
 * 格式化小时为 24 小时制
 */
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

/**
 * 获取发布时间对应的时间槽（每 2 小时一个槽）
 */
function getTimeSlot(publishTime: string | Date): number {
  const hour = dayjs(publishTime).hour()
  return Math.floor(hour / 2) * 2
}

function getFestivalStatusTone(festival: CalendarFestivalInfo) {
  if (festival.isWorkday) {
    return 'border border-border bg-background text-muted-foreground'
  }

  return 'bg-gradient-back text-gradient-foreground shadow-primary/15'
}

export interface IPCWeekViewProps {
  /** 当前周的基准日期 */
  currentDate: Date
  /** 发布记录数据 */
  recordMap: Map<string, PublishRecordItem[]>
  /** 加载状态 */
  loading: boolean
  /** 点击添加任务时的回调 */
  onClickPub: (date: string) => void
}

// 时间单元格组件
interface ITimeCellProps {
  date: Dayjs
  hour: number
  records: PublishRecordItem[]
  loading: boolean
  isPast: boolean
  isToday: boolean
  onClickPub: (date: string) => void
}

const MAX_RECORDS = 3

const TimeCell = memo<ITimeCellProps>(
  ({ date, hour, records, loading, isPast, isToday, onClickPub }) => {
    const { t } = useTransClient('account')
    const [isMore, setIsMore] = useState(false)

    const displayRecords = useMemo(() => {
      if (isMore)
        return records
      return records.slice(0, MAX_RECORDS)
    }, [isMore, records])

    // 拖放支持
    const [{ isOver }, drop] = useDrop(
      () => ({
        accept: isPast ? 'none' : 'box',
        drop: () => ({
          time: {
            date: date.hour(hour).minute(0).second(0).toDate(),
          },
        }),
        collect: monitor => ({
          isOver: monitor.isOver(),
        }),
      }),
      [isPast, date, hour],
    )

    // 处理添加按钮点击
    const handleAddClick = () => {
      const now = dayjs()
      if (date.isSame(now, 'day') && hour === getTimeSlot(now.toDate())) {
        // 当前时间槽：使用当前时间 + 10 分钟
        onClickPub(now.add(10, 'minute').format())
      }
      else {
        // 其他时间槽：使用时间槽的开始时间
        onClickPub(date.hour(hour).minute(0).second(0).format())
      }
    }

    return (
      <div
        ref={(node) => {
          if (!isPast) {
            drop(node)
          }
        }}
        className={cn(
          'group relative flex-1 min-w-0 overflow-visible border-r border-b last:border-r-0 p-2',
          'transition-colors',
          isPast && 'bg-muted/30',
          isOver && !isPast && 'bg-accent/50',
          isToday && !isPast && 'bg-primary/5',
          !isPast && 'hover:bg-muted/10',
        )}
      >
        {loading ? (
          <Skeleton className="h-8 w-full rounded-md" />
        ) : (
          <>
            {/* 添加按钮 - 右上角，悬停显示 */}
            {!isPast && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute top-1 right-1',
                  'h-6 w-6',
                  'opacity-0 group-hover:opacity-100',
                  'cursor-pointer transition-opacity',
                )}
                onClick={handleAddClick}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            {/* 任务列表 */}
            <div className="space-y-1.5">
              {displayRecords.map(record => (
                <div key={record.id + record.title + record.uid + record.updatedAt}>
                  <CustomDragLayer publishRecord={record} snapToGrid={false} />
                  <CalendarRecord publishRecord={record} />
                </div>
              ))}

              {/* 显示更多/收起按钮 */}
              {records.length > MAX_RECORDS && (
                <Button
                  data-testid="calendar-week-cell-show-more"
                  variant="ghost"
                  className="w-full h-auto py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors justify-start cursor-pointer"
                  onClick={() => setIsMore(!isMore)}
                >
                  {isMore ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      {t('calendar.hideMore')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      {records.length - displayRecords.length}
                      {' '}
                      {t('calendar.showMore')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    )
  },
)

TimeCell.displayName = 'TimeCell'

const PCWeekView = memo<IPCWeekViewProps>(({ currentDate, recordMap, loading, onClickPub }) => {
  const { t } = useTransClient('account')
  const lng = useGetClientLng()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const weekHeaderRef = useRef<HTMLDivElement>(null)
  const [timeCellHeight, setTimeCellHeight] = useState(DEFAULT_TIME_CELL_HEIGHT)
  const { showSolarFestivals, showSolarTerms } = useSystemStore(
    useShallow(state => ({
      showSolarFestivals: state.calendarShowSolarFestivals,
      showSolarTerms: state.calendarShowSolarTerms,
    })),
  )

  // 获取当前周的日期（周日开始）
  const weekDates = useMemo(() => {
    const start = dayjs(currentDate).startOf('week')
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
  }, [currentDate])

  // 今天的日期
  const today = dayjs()
  const todayStr = today.format('YYYY-MM-DD')
  const currentHour = today.hour()

  // 计算当前时间的时间槽索引（用于自动滚动）
  const currentTimeSlotIndex = useMemo(() => {
    return Math.floor(currentHour / 2)
  }, [currentHour])

  useEffect(() => {
    const updateTimeCellHeight = () => {
      const containerHeight = scrollContainerRef.current?.clientHeight ?? 0
      const headerHeight = weekHeaderRef.current?.offsetHeight ?? 0
      const availableHeight = containerHeight - headerHeight

      if (availableHeight <= 0) {
        return
      }

      const nextHeight = Math.min(
        DEFAULT_TIME_CELL_HEIGHT,
        Math.max(1, Math.floor(availableHeight / VISIBLE_TIME_SLOT_COUNT)),
      )

      setTimeCellHeight(prev => (prev === nextHeight ? prev : nextHeight))
    }

    updateTimeCellHeight()

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateTimeCellHeight)

    if (scrollContainerRef.current) {
      resizeObserver?.observe(scrollContainerRef.current)
    }

    if (weekHeaderRef.current) {
      resizeObserver?.observe(weekHeaderRef.current)
    }

    window.addEventListener('resize', updateTimeCellHeight)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateTimeCellHeight)
    }
  }, [])

  // 组件挂载时滚动到当前时间
  useEffect(() => {
    if (scrollContainerRef.current) {
      const headerHeight = weekHeaderRef.current?.offsetHeight ?? 80
      const scrollOffset = currentTimeSlotIndex * timeCellHeight

      // 滚动使当前时间槽在视口中间偏上位置
      scrollContainerRef.current.scrollTop = Math.max(0, scrollOffset - headerHeight)
    }
  }, [currentTimeSlotIndex, timeCellHeight])

  // 按日期+时间槽分组任务
  const groupedRecords = useMemo(() => {
    const map = new Map<string, PublishRecordItem[]>()
    recordMap.forEach((records, dateStr) => {
      records.forEach((record) => {
        const slot = getTimeSlot(record.publishTime)
        const key = `${dateStr}-${slot}`
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key)!.push(record)
      })
    })
    return map
  }, [recordMap])

  // 格式化星期名称
  const formatWeekday = useMemo(() => {
    const locale = getDayjsLocale(lng)
    return (date: Dayjs) => {
      return date.locale(locale).format('dddd')
    }
  }, [lng])

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-testid="calendar-week-view" className="flex flex-col h-full overflow-hidden">
        {/* 单一滚动容器：表头和内容共享，解决滚动条导致的边框错位 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          {/* 表头行：sticky 固定在滚动容器顶部 */}
          <div ref={weekHeaderRef} className="flex sticky top-0 z-20 bg-background">
            {/* 时间轴占位 */}
            <div className="w-16 shrink-0 border-r border-b" />
            {/* 7 天表头 */}
            {weekDates.map((date) => {
              const dateStr = date.format('YYYY-MM-DD')
              const isToday = dateStr === todayStr
              const festivals = filterCalendarFestivalEvents(getChinaCalendarEvents(date.toDate(), lng), {
                showSolarFestivals,
                showSolarTerms,
              })
              const lunar = getChinaCalendarLunarInfo(date.toDate(), lng)
              const legalFestival = festivals.find(item => item.type === 'holiday' || item.type === 'workday')

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'flex-1 min-w-0 border-r border-b last:border-r-0 px-2 py-3 transition-colors',
                    isToday && 'bg-gradient-to-b from-primary/10 to-transparent',
                  )}
                >
                  <div className="mx-auto flex w-full flex-col items-center gap-1.5">
                    <CalendarFestivalSummary
                      festivals={festivals}
                      date={date.toDate()}
                      lunar={lunar}
                      headerClassName="mx-auto flex w-fit max-w-full flex-col items-center gap-1 rounded-lg px-1.5 py-1"
                      headerContent={(
                        <>
                          <span
                            className={cn(
                              'text-sm font-medium text-muted-foreground',
                              isToday && 'text-primary',
                            )}
                          >
                            {formatWeekday(date)}
                          </span>
                          <span className="flex items-center justify-center gap-2">
                            <span
                              className={cn(
                                'flex size-8 items-center justify-center rounded-full text-xl font-bold tabular-nums text-foreground',
                                isToday
                                && 'bg-gradient-back text-gradient-foreground shadow-sm shadow-primary/25 ring-1 ring-primary/20',
                              )}
                            >
                              {date.date()}
                            </span>
                            <CalendarLunarText lunar={lunar} selected={isToday} className={cn(isToday && 'text-primary')} />
                            {legalFestival && (
                              <span
                                className={cn(
                                  'inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none shadow-sm',
                                  getFestivalStatusTone(legalFestival),
                                )}
                                title={t(legalFestival.statusTitleKey)}
                                aria-label={t(legalFestival.statusTitleKey)}
                              >
                                {t(legalFestival.statusKey)}
                              </span>
                            )}
                          </span>
                        </>
                      )}
                      summaryCompact={false}
                      summaryClassName="max-h-none overflow-visible px-0 text-center text-[11px] leading-4 whitespace-normal break-words"
                      popoverSide="bottom"
                      popoverAlign="center"
                      className="w-full overflow-visible"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 时间行 */}
          {TIME_SLOTS.map((hour) => {
            return (
              <div key={hour} className="flex" style={{ minHeight: timeCellHeight }}>
                {/* 时间标签 */}
                <div className="w-16 shrink-0 border-r border-b px-2 py-2 text-xs text-muted-foreground text-right pr-3">
                  {formatHour(hour)}
                </div>
                {/* 7 天的单元格 */}
                {weekDates.map((date) => {
                  const dateStr = date.format('YYYY-MM-DD')
                  const isToday = dateStr === todayStr
                  const isPastDay = date.isBefore(today, 'day')
                  // 今天的过去小时也算过去
                  const isPastHour = isToday && hour + 2 <= currentHour
                  const isPast = isPastDay || isPastHour
                  const key = `${dateStr}-${hour}`
                  const records = groupedRecords.get(key) || []

                  return (
                    <TimeCell
                      key={key}
                      date={date}
                      hour={hour}
                      records={records}
                      loading={loading}
                      isPast={isPast}
                      isToday={isToday}
                      onClickPub={onClickPub}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </DndProvider>
  )
})

PCWeekView.displayName = 'PCWeekView'

export default PCWeekView
