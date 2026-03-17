/**
 * MobileMonthView 组件
 *
 * 功能描述: 移动端日历月视图
 * - 紧凑型月历网格
 * - 有数据的日期显示小圆点
 * - 选中日期高亮
 * - 点击日期切换选中
 */

'use client'

import type { IMobileMonthViewProps } from './mobileCalendar.types'
import dayjs from 'dayjs'
import { memo, useCallback, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

const MobileMonthView = memo<IMobileMonthViewProps>(
  ({ currentDate, selectedDate, onDateSelect, recordMap }) => {
    const { t } = useTransClient('common')

    // 星期标题 - 使用 i18n 翻译
    const weekDays = t('calendar.weekDaysShort', { returnObjects: true }) as string[]

    // 获取当月的日历网格（包含前后月份的填充日期）
    const calendarDates = useMemo(() => {
      const current = dayjs(currentDate)
      const startOfMonth = current.startOf('month')
      const endOfMonth = current.endOf('month')

      // 月初是星期几（0-6，0是周日）
      const startDayOfWeek = startOfMonth.day()

      // 上个月需要显示的天数
      const prevMonthDays = startDayOfWeek

      // 当月天数
      const daysInMonth = current.daysInMonth()

      // 下个月需要显示的天数（补齐到6行）
      const totalCells = 42 // 6行 * 7天
      const nextMonthDays = totalCells - prevMonthDays - daysInMonth

      const dates: { date: dayjs.Dayjs, isCurrentMonth: boolean }[] = []

      // 上个月的日期
      for (let i = prevMonthDays - 1; i >= 0; i--) {
        dates.push({
          date: startOfMonth.subtract(i + 1, 'day'),
          isCurrentMonth: false,
        })
      }

      // 当月的日期
      for (let i = 0; i < daysInMonth; i++) {
        dates.push({
          date: startOfMonth.add(i, 'day'),
          isCurrentMonth: true,
        })
      }

      // 下个月的日期
      for (let i = 0; i < nextMonthDays; i++) {
        dates.push({
          date: endOfMonth.add(i + 1, 'day'),
          isCurrentMonth: false,
        })
      }

      return dates
    }, [currentDate])

    // 今天的日期字符串
    const todayStr = dayjs().format('YYYY-MM-DD')

    // 选中日期字符串
    const selectedStr = dayjs(selectedDate).format('YYYY-MM-DD')

    // 检查日期是否有数据
    const hasData = useCallback(
      (dateStr: string) => {
        const records = recordMap.get(dateStr)
        return records && records.length > 0
      },
      [recordMap],
    )

    return (
      <div className="px-4 py-3 bg-background">
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

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDates.map(({ date, isCurrentMonth }) => {
            const dateStr = date.format('YYYY-MM-DD')
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedStr
            const isPast = date.isBefore(dayjs(), 'day')
            const hasRecords = hasData(dateStr)

            return (
              <button
                key={dateStr}
                type="button"
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 rounded-lg cursor-pointer transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  // 非当月日期
                  !isCurrentMonth && 'text-muted-foreground/40',
                  // 当月日期样式
                  isCurrentMonth
                  && (isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isToday
                      ? 'text-foreground font-bold'
                      : isPast
                        ? 'text-muted-foreground'
                        : 'text-foreground'),
                  !isSelected && 'hover:bg-accent',
                )}
                onClick={() => onDateSelect(date.toDate())}
              >
                {/* 日期数字 */}
                <span className="text-sm font-medium">{date.date()}</span>

                {/* 小圆点指示器 - 所有有数据的日期都显示 */}
                <div className="h-1 mt-0.5">
                  {hasRecords && (
                    <div
                      className={cn(
                        'w-1 h-1 rounded-full',
                        isSelected
                          ? 'bg-primary-foreground'
                          : isCurrentMonth
                            ? 'bg-primary'
                            : 'bg-primary/40',
                      )}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  },
)

MobileMonthView.displayName = 'MobileMonthView'

export default MobileMonthView
