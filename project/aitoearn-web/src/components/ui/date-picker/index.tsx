/**
 * DatePicker - 全局单日期选择器
 * Popover + 日历面板，点击日期即选中并关闭
 */

'use client'

import dayjs from 'dayjs'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface CalendarDay {
  date: dayjs.Dayjs
  isCurrentMonth: boolean
}

interface DatePickerProps {
  value: string | null
  onChange: (date: string | null) => void
  placeholder?: string
  /** 最小可选日期，格式 YYYY-MM-DD */
  minDate?: string
  className?: string
}

const DatePicker = memo(({
  value,
  onChange,
  placeholder,
  minDate,
  className,
}: DatePickerProps) => {
  const { t, i18n } = useTransClient('common')
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() =>
    value ? dayjs(value) : dayjs(),
  )

  const today = dayjs().format('YYYY-MM-DD')

  const weekDays = useMemo(() => {
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      days.push(dayjs().day(i).locale(i18n.language).format('dd'))
    }
    return days
  }, [i18n.language])

  const calendarDays = useMemo((): CalendarDay[] => {
    const days: CalendarDay[] = []
    const daysInMonth = currentMonth.daysInMonth()
    const firstDayOfMonth = currentMonth.startOf('month').day()
    const prevMonthDays = currentMonth.subtract(1, 'month').daysInMonth()

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: currentMonth.subtract(1, 'month').date(prevMonthDays - i),
        isCurrentMonth: false,
      })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: currentMonth.date(i),
        isCurrentMonth: true,
      })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: currentMonth.add(1, 'month').date(i),
        isCurrentMonth: false,
      })
    }
    return days
  }, [currentMonth])

  const handleDayClick = useCallback((dateStr: string) => {
    if (minDate && dateStr < minDate)
      return
    onChange(dateStr)
    setOpen(false)
  }, [onChange, minDate])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }, [onChange])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen && value) {
      setCurrentMonth(dayjs(value))
    }
    setOpen(nextOpen)
  }, [value])

  const displayText = value || placeholder || t('datePicker.selectDate')

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 h-9 w-full px-3 rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent cursor-pointer',
            !value && 'text-muted-foreground',
            value && 'text-foreground',
            className,
          )}
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1 text-left">{displayText}</span>
          {value && (
            <X
              className="size-3.5 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="select-none">
          {/* 月份导航 */}
          <div className="flex items-center justify-between px-1 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer"
              onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentMonth.locale(i18n.language).format('YYYY MMMM')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer"
              onClick={() => setCurrentMonth(m => m.add(1, 'month'))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((day, i) => (
              <div key={i} className="h-9 flex items-center justify-center text-xs text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((item, i) => {
              const dateStr = item.date.format('YYYY-MM-DD')
              const isSelected = dateStr === value
              const isToday = dateStr === today
              const isDisabled = minDate ? dateStr < minDate : false

              return (
                <div key={i} className="flex items-center justify-center h-9">
                  <button
                    type="button"
                    onClick={() => handleDayClick(dateStr)}
                    disabled={isDisabled}
                    className={cn(
                      'size-9 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer',
                      !item.isCurrentMonth && 'opacity-40',
                      item.isCurrentMonth && !isSelected && !isDisabled && 'hover:bg-accent',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      isToday && !isSelected && 'border border-primary',
                      isDisabled && 'opacity-25 cursor-not-allowed',
                    )}
                  >
                    {item.date.date()}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

DatePicker.displayName = 'DatePicker'

export default DatePicker
