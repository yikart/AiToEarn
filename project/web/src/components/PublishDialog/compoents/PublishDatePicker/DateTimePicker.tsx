/**
 * DateTimePicker Component
 * 自定义日期时间选择器组件 - 支持深色/浅色主题切换
 */

import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTransClient } from '@/app/i18n/client'

interface DateTimePickerProps {
  value: Dayjs | null
  onChange: (date: Dayjs) => void
  disabledDate?: (current: Dayjs) => boolean
  disabledTime?: (current: Dayjs | null) => {
    disabledHours?: () => number[]
    disabledMinutes?: (hour: number) => number[]
  }
}

export function DateTimePicker({ value, onChange, disabledDate, disabledTime }: DateTimePickerProps) {
  const { t } = useTransClient('publish')
  const [currentMonth, setCurrentMonth] = useState(value || dayjs())
  const [selectedDate, setSelectedDate] = useState(value)
  const [selectedHour, setSelectedHour] = useState(value?.hour() || 0)
  const [selectedMinute, setSelectedMinute] = useState(value?.minute() || 0)

  const hourScrollRef = useRef<HTMLDivElement>(null)
  const minuteScrollRef = useRef<HTMLDivElement>(null)

  const daysInMonth = currentMonth.daysInMonth()
  const firstDayOfMonth = currentMonth.startOf('month').day()
  const today = dayjs()

  // 自动滚动到选中的时间
  useEffect(() => {
    if (hourScrollRef.current) {
      const selectedElement = hourScrollRef.current.querySelector('[data-selected="true"]')
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }, [selectedHour])

  useEffect(() => {
    if (minuteScrollRef.current) {
      const selectedElement = minuteScrollRef.current.querySelector('[data-selected="true"]')
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }, [selectedMinute])

  // 生成日历网格
  const calendarDays = []
  const prevMonthDays = currentMonth.subtract(1, 'month').daysInMonth()

  // 上个月的日期
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      date: currentMonth.subtract(1, 'month').date(prevMonthDays - i),
      isCurrentMonth: false,
    })
  }

  // 当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: currentMonth.date(i),
      isCurrentMonth: true,
    })
  }

  // 下个月的日期（补齐到42天，6周）
  const remainingDays = 42 - calendarDays.length
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      date: currentMonth.add(1, 'month').date(i),
      isCurrentMonth: false,
    })
  }

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'))
  }

  const handleSelectDate = (date: Dayjs) => {
    if (disabledDate && disabledDate(date)) return

    setSelectedDate(date)
    const newDateTime = date.hour(selectedHour).minute(selectedMinute)
    onChange(newDateTime)
  }

  const handleTimeChange = (hour: number, minute: number) => {
    setSelectedHour(hour)
    setSelectedMinute(minute)
    if (selectedDate) {
      const newDateTime = selectedDate.hour(hour).minute(minute)
      onChange(newDateTime)
    }
  }

  // 获取禁用的小时和分钟
  const disabledTimeConfig = disabledTime ? disabledTime(selectedDate) : {}
  const disabledHours = disabledTimeConfig.disabledHours?.() || []
  const disabledMinutes = disabledTimeConfig.disabledMinutes?.(selectedHour) || []

  const weekDays = [
    t('dateTimePicker.sunday'),
    t('dateTimePicker.monday'),
    t('dateTimePicker.tuesday'),
    t('dateTimePicker.wednesday'),
    t('dateTimePicker.thursday'),
    t('dateTimePicker.friday'),
    t('dateTimePicker.saturday'),
  ]

  // 格式化年月显示
  const formatYearMonth = (date: Dayjs) => {
    const year = date.year()
    const month = date.month() + 1 // dayjs 的月份是 0-11
    return t('dateTimePicker.yearMonth', { year, month })
  }

  return (
    <div className="flex">
      {/* 左侧日历部分 */}
      <div className="flex-1 p-4 border-r border-border">
        {/* 月份导航 */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium">{formatYearMonth(currentMonth)}</div>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((item, index) => {
            const isToday = item.date.isSame(today, 'day')
            const isSelected = selectedDate?.isSame(item.date, 'day')
            const isDisabled = !item.isCurrentMonth || (disabledDate && disabledDate(item.date))

            return (
              <button
                key={index}
                onClick={() => handleSelectDate(item.date)}
                disabled={isDisabled}
                className={cn(
                  'h-9 w-full text-sm rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  !item.isCurrentMonth && 'text-muted-foreground opacity-50',
                  isToday && 'border border-primary',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                )}
              >
                {item.date.date()}
              </button>
            )
          })}
        </div>
      </div>

      {/* 右侧时间选择部分 */}
      <div className="w-[120px] flex flex-col h-[350px]">
        {/* 时间显示 */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="text-center">
            <div className="text-lg font-semibold tabular-nums">
              {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* 时间选择滚动列表 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 小时列 */}
          <div className="flex-1 border-r border-border overflow-hidden">
            <div
              ref={hourScrollRef}
              className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40"
              onWheel={(e) => {
                e.stopPropagation()
                if (hourScrollRef.current) {
                  hourScrollRef.current.scrollTop += e.deltaY
                }
              }}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                const isDisabled = disabledHours.includes(hour)
                const isSelected = hour === selectedHour
                return (
                  <button
                    key={hour}
                    data-selected={isSelected}
                    onClick={() => !isDisabled && handleTimeChange(hour, selectedMinute)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full text-center py-2 text-sm transition-colors tabular-nums',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-primary/10 text-primary font-semibold',
                      isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                    )}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 分钟列 */}
          <div className="flex-1 overflow-hidden">
            <div
              ref={minuteScrollRef}
              className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40"
              onWheel={(e) => {
                e.stopPropagation()
                if (minuteScrollRef.current) {
                  minuteScrollRef.current.scrollTop += e.deltaY
                }
              }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(minute => {
                const isDisabled = disabledMinutes.includes(minute)
                const isSelected = minute === selectedMinute
                return (
                  <button
                    key={minute}
                    data-selected={isSelected}
                    onClick={() => !isDisabled && handleTimeChange(selectedHour, minute)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full text-center py-2 text-sm transition-colors tabular-nums',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-primary/10 text-primary font-semibold',
                      isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                    )}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
