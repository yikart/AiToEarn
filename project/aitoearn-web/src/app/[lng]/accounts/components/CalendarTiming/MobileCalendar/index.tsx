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

import type { IMobileCalendarProps, ViewType } from './mobileCalendar.types'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getMonthDateRange, getWeekDateRange } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import MobileCalendarHeader from './MobileCalendarHeader'
import MobileDayRecords from './MobileDayRecords'
import MobileMonthView from './MobileMonthView'
import MobileWeekView from './MobileWeekView'

// 扩展 dayjs 插件
dayjs.extend(isSameOrAfter)

const MobileCalendar = memo<IMobileCalendarProps>(({ onClickPub }) => {
  // 当前显示的日期（用于控制月份/周显示）
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  // 选中的日期
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  // 视图类型：周视图或月视图
  const [viewType, setViewType] = useState<ViewType>('week')

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

  // 初始化时获取数据
  useEffect(() => {
    getPubRecord({
      dateRange: viewType === 'week'
        ? getWeekDateRange(currentDate)
        : getMonthDateRange(currentDate),
    })
  }, [])

  // 当月份改变时重新获取数据
  useEffect(() => {
    getPubRecord({
      dateRange: viewType === 'week'
        ? getWeekDateRange(currentDate)
        : getMonthDateRange(currentDate),
    })
  }, [currentDate])

  // 处理日期选择
  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date)
      // 如果选择的日期不在当前显示的月份，则更新 currentDate
      const newDate = dayjs(date)
      const current = dayjs(currentDate)
      if (!newDate.isSame(current, 'month')) {
        setCurrentDate(date)
      }
    },
    [currentDate],
  )

  // 处理周切换
  const handleWeekChange = useCallback(
    (direction: 'prev' | 'next') => {
      const current = dayjs(currentDate)
      const newDate = direction === 'next' ? current.add(1, 'week') : current.subtract(1, 'week')
      setCurrentDate(newDate.toDate())

      // 同时更新选中日期到新周的同一天（周几）
      const selectedDayOfWeek = dayjs(selectedDate).day()
      const newSelected = newDate.startOf('week').add(selectedDayOfWeek, 'day')
      setSelectedDate(newSelected.toDate())
    },
    [currentDate, selectedDate],
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
    setViewType(type)
  }, [])

  return (
    <div data-testid="mobile-calendar-container" className="flex flex-col flex-1 overflow-hidden bg-background">
      {/* 顶部工具栏 */}
      <MobileCalendarHeader
        currentDate={currentDate}
        viewType={viewType}
        onDateChange={handleDateChange}
        onViewTypeChange={handleViewTypeChange}
        onToday={handleToday}
      />

      {/* 日历视图 */}
      {viewType === 'week' ? (
        <MobileWeekView
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onWeekChange={handleWeekChange}
          recordMap={recordMap}
        />
      ) : (
        <MobileMonthView
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          recordMap={recordMap}
        />
      )}

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
