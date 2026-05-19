/**
 * MobileCalendar 组件
 *
 * 功能描述: 移动端日历主组件
 * - 管理 selectedDate（当前选中日期）
 * - 管理 viewType（'week' | 'month'）
 * - 组合各子组件
 * - 接收 onClickPub 回调，传递给子组件
 */

'use client'

import type { TouchEvent } from 'react'
import type { IMobileCalendarProps, ViewType } from './mobileCalendar.types'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getMonthDateRange } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import MobileCalendarHeader from './MobileCalendarHeader'
import MobileDayRecords from './MobileDayRecords'
import MobileMonthView from './MobileMonthView'
import MobileWeekView from './MobileWeekView'

// 扩展 dayjs 插件
dayjs.extend(isSameOrAfter)

const WEEK_TRANSITION_DURATION = 300
const MONTH_TRANSITION_DURATION = 300
const VIEW_TRANSITION_DURATION = 340

const MobileCalendar = memo<IMobileCalendarProps>(({ onClickPub }) => {
  // 当前显示的日期（用于控制月份/周显示）
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  // 选中的日期
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  // 视图类型：周视图或月视图
  const [viewType, setViewType] = useState<ViewType>('week')
  const [weekTransition, setWeekTransition] = useState<{
    direction: 'prev' | 'next'
    fromDate: Date
    fromSelectedDate: Date
    toDate: Date
    toSelectedDate: Date
  } | null>(null)
  const [weekTransitionActive, setWeekTransitionActive] = useState(false)
  const [monthTransition, setMonthTransition] = useState<{
    direction: 'prev' | 'next'
    fromDate: Date
    fromSelectedDate: Date
    toDate: Date
    toSelectedDate: Date
  } | null>(null)
  const [monthTransitionActive, setMonthTransitionActive] = useState(false)
  const [viewTransition, setViewTransition] = useState<{
    direction: 'down' | 'up'
    fromViewType: ViewType
    toViewType: ViewType
    fromDate: Date
    fromSelectedDate: Date
    toDate: Date
    toSelectedDate: Date
  } | null>(null)
  const [viewTransitionActive, setViewTransitionActive] = useState(false)
  const [calendarViewHeight, setCalendarViewHeight] = useState<number | null>(null)
  const touchStartRef = useRef<{ clientX: number, clientY: number } | null>(null)
  const calendarContentRef = useRef<HTMLDivElement>(null)
  const viewTransitionFromRef = useRef<HTMLDivElement>(null)
  const viewTransitionToRef = useRef<HTMLDivElement>(null)
  const viewTransitionFrameRef = useRef<number | null>(null)
  const weekTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const monthTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const viewTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedRecordRangeRef = useRef<{
    accountKey: string
    start: number
    end: number
  } | null>(null)

  const { activeAccountId, activeAccountType } = useAccountStore(
    useShallow(state => ({
      activeAccountId: state.accountActive?.id,
      activeAccountType: state.accountActive?.type,
    })),
  )

  const activeAccountCacheKey = useMemo(
    () => `${activeAccountType ?? 'all'}:${activeAccountId ?? 'all'}`,
    [activeAccountId, activeAccountType],
  )

  // 从 store 获取数据
  const { recordMap, listLoading, getPubRecord, setCalendarRef } = useCalendarTiming(
    useShallow(state => ({
      recordMap: state.recordMap,
      listLoading: state.listLoading,
      getPubRecord: state.getPubRecord,
      setCalendarRef: state.setCalendarRef,
    })),
  )

  // 选中日期的任务列表
  const selectedRecords = useMemo(() => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
    return recordMap.get(dateStr) || []
  }, [selectedDate, recordMap])

  // 移动端统一按月视图可见范围取数，避免周/月视图切换重复请求
  useEffect(() => {
    const [rangeStartDate, rangeEndDate] = getMonthDateRange(currentDate)
    const nextRange = {
      accountKey: activeAccountCacheKey,
      start: dayjs(rangeStartDate).startOf('day').valueOf(),
      end: dayjs(rangeEndDate).endOf('day').valueOf(),
    }
    const loadedRange = loadedRecordRangeRef.current

    if (
      loadedRange
      && loadedRange.accountKey === nextRange.accountKey
      && loadedRange.start <= nextRange.start
      && loadedRange.end >= nextRange.end
    ) {
      return
    }

    loadedRecordRangeRef.current = nextRange
    getPubRecord({ dateRange: [rangeStartDate, rangeEndDate] })
  }, [activeAccountCacheKey, currentDate, getPubRecord])

  useEffect(() => {
    return () => {
      if (weekTransitionTimerRef.current) {
        clearTimeout(weekTransitionTimerRef.current)
      }

      if (monthTransitionTimerRef.current) {
        clearTimeout(monthTransitionTimerRef.current)
      }

      if (viewTransitionTimerRef.current) {
        clearTimeout(viewTransitionTimerRef.current)
      }

      if (viewTransitionFrameRef.current) {
        cancelAnimationFrame(viewTransitionFrameRef.current)
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (!viewTransition) {
      setCalendarViewHeight(null)
      return undefined
    }

    const fromHeight = viewTransitionFromRef.current?.getBoundingClientRect().height
      ?? calendarContentRef.current?.getBoundingClientRect().height
      ?? 0
    const toHeight = viewTransitionToRef.current?.getBoundingClientRect().height ?? fromHeight

    setCalendarViewHeight(fromHeight)

    if (viewTransitionFrameRef.current) {
      cancelAnimationFrame(viewTransitionFrameRef.current)
    }

    viewTransitionFrameRef.current = requestAnimationFrame(() => {
      setViewTransitionActive(true)
      setCalendarViewHeight(toHeight)
      viewTransitionFrameRef.current = null
    })

    return () => {
      if (viewTransitionFrameRef.current) {
        cancelAnimationFrame(viewTransitionFrameRef.current)
        viewTransitionFrameRef.current = null
      }
    }
  }, [viewTransition])

  // 处理日期选择
  const handleDateSelect = useCallback(
    (date: Date) => {
      if (weekTransition || monthTransition || viewTransition) {
        return
      }

      setSelectedDate(date)
      // 如果选择的日期不在当前显示的月份，则更新 currentDate
      const newDate = dayjs(date)
      const current = dayjs(currentDate)
      if (!newDate.isSame(current, 'month')) {
        setCurrentDate(date)
      }
    },
    [currentDate, monthTransition, viewTransition, weekTransition],
  )

  const startViewTransition = useCallback(
    (nextViewType: ViewType) => {
      if (nextViewType === viewType || weekTransition || monthTransition || viewTransition) {
        return
      }

      const direction = nextViewType === 'month' ? 'down' : 'up'
      setCalendarViewHeight(calendarContentRef.current?.getBoundingClientRect().height ?? null)
      setViewTransition({
        direction,
        fromViewType: viewType,
        toViewType: nextViewType,
        fromDate: currentDate,
        fromSelectedDate: selectedDate,
        toDate: currentDate,
        toSelectedDate: selectedDate,
      })
      setViewTransitionActive(false)

      if (viewTransitionTimerRef.current) {
        clearTimeout(viewTransitionTimerRef.current)
      }

      viewTransitionTimerRef.current = setTimeout(() => {
        setViewType(nextViewType)
        setViewTransition(null)
        setViewTransitionActive(false)
        setCalendarViewHeight(null)
        viewTransitionTimerRef.current = null
      }, VIEW_TRANSITION_DURATION)
    },
    [currentDate, monthTransition, selectedDate, viewTransition, viewType, weekTransition],
  )

  // 处理周切换
  const handleWeekChange = useCallback(
    (direction: 'prev' | 'next') => {
      if (viewType !== 'week' || weekTransition || monthTransition || viewTransition) {
        return
      }

      const current = dayjs(currentDate)
      const newDate = direction === 'next' ? current.add(1, 'week') : current.subtract(1, 'week')

      // 同时更新选中日期到新周的同一天（周几）
      const selectedDayOfWeek = dayjs(selectedDate).day()
      const newSelected = newDate.startOf('week').add(selectedDayOfWeek, 'day')

      setWeekTransition({
        direction,
        fromDate: currentDate,
        fromSelectedDate: selectedDate,
        toDate: newDate.toDate(),
        toSelectedDate: newSelected.toDate(),
      })
      setWeekTransitionActive(false)

      requestAnimationFrame(() => {
        setWeekTransitionActive(true)
      })

      if (weekTransitionTimerRef.current) {
        clearTimeout(weekTransitionTimerRef.current)
      }

      weekTransitionTimerRef.current = setTimeout(() => {
        setCurrentDate(newDate.toDate())
        setSelectedDate(newSelected.toDate())
        setWeekTransition(null)
        setWeekTransitionActive(false)
        weekTransitionTimerRef.current = null
      }, WEEK_TRANSITION_DURATION)
    },
    [currentDate, monthTransition, selectedDate, viewTransition, viewType, weekTransition],
  )

  // 处理月切换
  const handleMonthChange = useCallback(
    (direction: 'prev' | 'next') => {
      if (viewType !== 'month' || weekTransition || monthTransition || viewTransition) {
        return
      }

      const current = dayjs(currentDate)
      const targetMonthStart = direction === 'next'
        ? current.add(1, 'month').startOf('month')
        : current.subtract(1, 'month').startOf('month')
      const selectedDay = dayjs(selectedDate).date()
      const targetDay = Math.min(selectedDay, targetMonthStart.daysInMonth())
      const newSelected = targetMonthStart.date(targetDay)

      setMonthTransition({
        direction,
        fromDate: currentDate,
        fromSelectedDate: selectedDate,
        toDate: newSelected.toDate(),
        toSelectedDate: newSelected.toDate(),
      })
      setMonthTransitionActive(false)

      requestAnimationFrame(() => {
        setMonthTransitionActive(true)
      })

      if (monthTransitionTimerRef.current) {
        clearTimeout(monthTransitionTimerRef.current)
      }

      monthTransitionTimerRef.current = setTimeout(() => {
        setCurrentDate(newSelected.toDate())
        setSelectedDate(newSelected.toDate())
        setMonthTransition(null)
        setMonthTransitionActive(false)
        monthTransitionTimerRef.current = null
      }, MONTH_TRANSITION_DURATION)
    },
    [currentDate, monthTransition, selectedDate, viewTransition, viewType, weekTransition],
  )

  // 处理年月切换（从选择器）
  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date)
    // 如果新月份中包含今天，则选中今天；否则选中月初
    const newDate = dayjs(date)
    const today = dayjs()
    if (newDate.isSame(today, 'month')) {
      setSelectedDate(today.toDate())
    }
    else {
      setSelectedDate(newDate.startOf('month').toDate())
    }
  }, [])

  // 处理点击今天
  const handleToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }, [])

  // 处理视图类型切换
  const handleViewTypeChange = useCallback((type: ViewType) => {
    startViewTransition(type)
  }, [startViewTransition])

  const handleCalendarTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStartRef.current = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    }
  }, [])

  const handleCalendarTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current
    touchStartRef.current = null

    if (!start) {
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.clientX
    const deltaY = touch.clientY - start.clientY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const threshold = 48

    if (absDeltaX >= threshold && absDeltaX > absDeltaY) {
      if (viewType === 'month') {
        handleMonthChange(deltaX < 0 ? 'next' : 'prev')
      }
      return
    }

    if (absDeltaY < threshold || absDeltaY < absDeltaX) {
      return
    }

    if (deltaY > 0 && viewType === 'week') {
      startViewTransition('month')
      return
    }

    if (deltaY < 0 && viewType === 'month') {
      startViewTransition('week')
    }
  }, [handleMonthChange, startViewTransition, viewType])

  const renderWeekView = useCallback(
    (date: Date, selected: Date, interactive: boolean) => (
      <MobileWeekView
        currentDate={date}
        selectedDate={selected}
        recordMap={recordMap}
        onDateSelect={interactive ? handleDateSelect : () => undefined}
        onWeekChange={interactive ? handleWeekChange : () => undefined}
      />
    ),
    [handleDateSelect, handleWeekChange, recordMap],
  )

  const renderViewByType = useCallback(
    (type: ViewType, date: Date, selected: Date, interactive: boolean) => {
      if (type === 'week') {
        return renderWeekView(date, selected, interactive)
      }

      return (
        <MobileMonthView
          currentDate={date}
          selectedDate={selected}
          recordMap={recordMap}
          onDateSelect={interactive ? handleDateSelect : () => undefined}
        />
      )
    },
    [handleDateSelect, recordMap, renderWeekView],
  )

  const renderCalendarView = () => {
    if (viewTransition) {
      const fromView = renderViewByType(
        viewTransition.fromViewType,
        viewTransition.fromDate,
        viewTransition.fromSelectedDate,
        false,
      )
      const toView = renderViewByType(
        viewTransition.toViewType,
        viewTransition.toDate,
        viewTransition.toSelectedDate,
        false,
      )
      const isDown = viewTransition.direction === 'down'

      return (
        <div
          className="relative overflow-hidden motion-reduce:transition-none transition-[height] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={calendarViewHeight !== null ? { height: calendarViewHeight } : undefined}
        >
          <div ref={viewTransitionFromRef} className="invisible pointer-events-none">{fromView}</div>
          <div ref={viewTransitionToRef} className="invisible pointer-events-none absolute inset-x-0 top-0">{toView}</div>
          <div
            className={cn(
              'absolute inset-x-0 top-0 will-change-transform motion-reduce:transition-none',
              'transition-all duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              viewTransitionActive
                ? isDown ? 'translate-y-6 opacity-0 scale-[0.985]' : '-translate-y-6 opacity-0 scale-[0.985]'
                : 'translate-y-0 opacity-100 scale-100',
            )}
          >
            {fromView}
          </div>
          <div
            className={cn(
              'absolute inset-x-0 top-0 will-change-transform motion-reduce:transition-none',
              'transition-all duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              viewTransitionActive
                ? 'translate-y-0 opacity-100 scale-100'
                : isDown ? '-translate-y-6 opacity-0 scale-[0.985]' : 'translate-y-6 opacity-0 scale-[0.985]',
            )}
          >
            {toView}
          </div>
        </div>
      )
    }

    if (viewType === 'week') {
      if (!weekTransition) {
        return renderWeekView(currentDate, selectedDate, true)
      }

      const isNext = weekTransition.direction === 'next'
      const firstWeek = isNext
        ? { date: weekTransition.fromDate, selected: weekTransition.fromSelectedDate }
        : { date: weekTransition.toDate, selected: weekTransition.toSelectedDate }
      const secondWeek = isNext
        ? { date: weekTransition.toDate, selected: weekTransition.toSelectedDate }
        : { date: weekTransition.fromDate, selected: weekTransition.fromSelectedDate }

      return (
        <div className="overflow-hidden">
          <div
            className={cn(
              'flex w-[200%] will-change-transform motion-reduce:transition-none',
              'transition-transform duration-300 ease-out',
              weekTransitionActive
                ? isNext ? '-translate-x-1/2' : 'translate-x-0'
                : isNext ? 'translate-x-0' : '-translate-x-1/2',
            )}
          >
            <div className="w-1/2 shrink-0 pointer-events-none">
              {renderWeekView(firstWeek.date, firstWeek.selected, false)}
            </div>
            <div className="w-1/2 shrink-0 pointer-events-none">
              {renderWeekView(secondWeek.date, secondWeek.selected, false)}
            </div>
          </div>
        </div>
      )
    }

    if (monthTransition) {
      const isNext = monthTransition.direction === 'next'
      const firstMonth = isNext
        ? { date: monthTransition.fromDate, selected: monthTransition.fromSelectedDate }
        : { date: monthTransition.toDate, selected: monthTransition.toSelectedDate }
      const secondMonth = isNext
        ? { date: monthTransition.toDate, selected: monthTransition.toSelectedDate }
        : { date: monthTransition.fromDate, selected: monthTransition.fromSelectedDate }

      return (
        <div className="overflow-hidden">
          <div
            className={cn(
              'flex w-[200%] will-change-transform motion-reduce:transition-none',
              'transition-transform duration-300 ease-out',
              monthTransitionActive
                ? isNext ? '-translate-x-1/2' : 'translate-x-0'
                : isNext ? 'translate-x-0' : '-translate-x-1/2',
            )}
          >
            <div className="w-1/2 shrink-0 pointer-events-none">
              {renderViewByType('month', firstMonth.date, firstMonth.selected, false)}
            </div>
            <div className="w-1/2 shrink-0 pointer-events-none">
              {renderViewByType('month', secondMonth.date, secondMonth.selected, false)}
            </div>
          </div>
        </div>
      )
    }

    return renderViewByType('month', currentDate, selectedDate, true)
  }

  return (
    <div data-testid="mobile-calendar-container" className="flex flex-col flex-1 overflow-hidden bg-background">
      {/* 顶部工具栏 */}
      <MobileCalendarHeader
        currentDate={currentDate}
        viewType={viewTransition?.toViewType ?? viewType}
        onDateChange={handleDateChange}
        onViewTypeChange={handleViewTypeChange}
        onToday={handleToday}
      />

      {/* 日历视图 */}
      <div
        ref={calendarContentRef}
        className="overflow-hidden"
        onTouchStart={handleCalendarTouchStart}
        onTouchEnd={handleCalendarTouchEnd}
      >
        <div>
          {renderCalendarView()}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-b" />

      {/* 任务列表 */}
      <MobileDayRecords
        selectedDate={selectedDate}
        records={selectedRecords}
        loading={listLoading}
        onClickPub={onClickPub}
      />
    </div>
  )
})

MobileCalendar.displayName = 'MobileCalendar'

export default MobileCalendar
