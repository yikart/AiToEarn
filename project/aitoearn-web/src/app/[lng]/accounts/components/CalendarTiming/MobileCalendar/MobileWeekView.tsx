/**
 * MobileWeekView 组件
 *
 * 功能描述: 移动端日历周视图
 * - 显示星期标题行（Sun/Mon/Tue...）
 * - 显示当前周的 7 天
 * - 支持左右滑动切换周
 * - 选中日期高亮
 */

'use client'

import type { TouchEvent } from 'react'
import type { IMobileWeekViewProps } from './mobileCalendar.types'
import dayjs from 'dayjs'
import { memo, useMemo, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'
import { getChinaCalendarLunarInfo } from '../calendarFestival.utils'
import CalendarLunarText from '../CalendarLunarText'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

const MobileWeekView = memo<IMobileWeekViewProps>(
  ({ currentDate, selectedDate, recordMap, onDateSelect, onWeekChange }) => {
    const { t } = useTransClient('common')
    const lng = useGetClientLng()
    const touchStartRef = useRef<{ clientX: number, clientY: number } | null>(null)

    // 星期标题 - 使用 i18n 翻译
    const weekDays = t('calendar.weekDaysShort', { returnObjects: true }) as string[]

    // 获取当前周的日期（周日开始）
    const weekDates = useMemo(() => {
      const current = dayjs(currentDate)
      const startOfWeek = current.startOf('week') // 默认周日开始
      const dates: dayjs.Dayjs[] = []
      for (let i = 0; i < 7; i++) {
        dates.push(startOfWeek.add(i, 'day'))
      }
      return dates
    }, [currentDate])

    // 今天的日期字符串
    const todayStr = dayjs().format('YYYY-MM-DD')

    // 选中日期字符串
    const selectedStr = dayjs(selectedDate).format('YYYY-MM-DD')

    // 触摸事件处理 - 实现左右滑动切换周
    const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0]
      touchStartRef.current = {
        clientX: touch.clientX,
        clientY: touch.clientY,
      }
    }

    const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
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
      const threshold = 50

      if (absDeltaX < threshold || absDeltaX < absDeltaY) {
        return
      }

      if (deltaX < 0) {
        // 左滑 - 下一周
        onWeekChange('next')
      }
      else {
        // 右滑 - 上一周
        onWeekChange('prev')
      }
    }

    return (
      <div
        className="px-4 py-3 bg-background"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 星期标题行 */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                'text-center text-xs text-muted-foreground',
                index === 0 && 'text-red-400', // 周日
                index === 6 && 'text-red-400', // 周六
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日期行 */}
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date) => {
            const dateStr = date.format('YYYY-MM-DD')
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedStr
            const isPast = date.isBefore(dayjs(), 'day')
            const hasRecords = (recordMap.get(dateStr)?.length ?? 0) > 0
            const lunar = getChinaCalendarLunarInfo(date.toDate(), lng)

            return (
              <button
                key={dateStr}
                type="button"
                className={cn(
                  'relative flex min-h-16 flex-col items-center justify-center rounded-xl py-2 cursor-pointer transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-gradient-back text-gradient-foreground shadow-md shadow-primary/20'
                    : isToday
                      ? 'bg-primary/10 text-primary font-bold'
                      : isPast
                        ? 'text-muted-foreground'
                        : 'text-foreground',
                  !isSelected && 'hover:bg-accent',
                )}
                onClick={() => onDateSelect(date.toDate())}
              >
                {hasRecords && (
                  <span
                    className={cn(
                      'pointer-events-none absolute right-2 top-2 size-1.5 rounded-full shadow-sm',
                      isSelected ? 'bg-gradient-foreground/90' : 'bg-brand-cyan',
                    )}
                  />
                )}
                {/* 日期数字 */}
                <span className="text-base font-semibold tabular-nums">{date.date()}</span>
                <CalendarLunarText
                  lunar={lunar}
                  selected={isSelected}
                  compact
                  className={cn('mt-1 max-w-full px-1', isSelected && 'text-gradient-foreground/85')}
                />
              </button>
            )
          })}
        </div>
      </div>
    )
  },
)

MobileWeekView.displayName = 'MobileWeekView'

export default MobileWeekView
