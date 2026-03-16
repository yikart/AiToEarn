/**
 * MobileWeekView 组件
 *
 * 功能描述: 移动端日历周视图
 * - 显示星期标题行（Sun/Mon/Tue...）
 * - 显示当前周的 7 天
 * - 支持左右滑动切换周
 * - 选中日期高亮
 * - 有数据的日期显示小圆点
 */

'use client'

import type { IMobileWeekViewProps } from './mobileCalendar.types'
import dayjs from 'dayjs'
import { memo, useCallback, useMemo, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

const MobileWeekView = memo<IMobileWeekViewProps>(
  ({ currentDate, selectedDate, onDateSelect, onWeekChange, recordMap }) => {
    const { t } = useTransClient('common')
    const touchStartX = useRef<number>(0)
    const touchEndX = useRef<number>(0)

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

    // 检查日期是否有数据
    const hasData = useCallback(
      (dateStr: string) => {
        const records = recordMap.get(dateStr)
        return records && records.length > 0
      },
      [recordMap],
    )

    // 触摸事件处理 - 实现左右滑动切换周
    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX
      const diff = touchStartX.current - touchEndX.current
      const threshold = 50 // 滑动阈值

      if (diff > threshold) {
        // 左滑 - 下一周
        onWeekChange('next')
      }
      else if (diff < -threshold) {
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
            const hasRecords = hasData(dateStr)

            return (
              <button
                key={dateStr}
                type="button"
                className={cn(
                  'flex flex-col items-center justify-center py-2 rounded-lg cursor-pointer transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isToday
                      ? 'text-foreground font-bold'
                      : isPast
                        ? 'text-muted-foreground'
                        : 'text-foreground',
                  !isSelected && 'hover:bg-accent',
                )}
                onClick={() => onDateSelect(date.toDate())}
              >
                {/* 日期数字 */}
                <span className="text-base font-medium">{date.date()}</span>

                {/* 小圆点指示器 */}
                <div className="h-1.5 mt-0.5">
                  {hasRecords && (
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-primary-foreground' : 'bg-primary',
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

MobileWeekView.displayName = 'MobileWeekView'

export default MobileWeekView
