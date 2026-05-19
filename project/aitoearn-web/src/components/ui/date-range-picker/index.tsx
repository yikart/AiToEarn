/**
 * DateRangePicker - 全局日期范围选择器
 * 桌面端使用 Popover 模式，同时导出 DateRangeCalendar 供移动端内嵌使用
 */

'use client'

import dayjs from 'dayjs'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface CalendarDay {
  date: dayjs.Dayjs
  isCurrentMonth: boolean
}

interface DateRangeCalendarProps {
  startDate: string | null
  endDate: string | null
  onStartChange: (date: string | null) => void
  onEndChange: (date: string | null) => void
  onClear?: () => void
  /** 隐藏日历底部的清除按钮 */
  hideFooter?: boolean
  className?: string
}

interface DateRangePickerProps extends DateRangeCalendarProps {
  className?: string
}

/** 纯日历面板，供 Popover 和移动端内嵌使用 */
export const DateRangeCalendar = memo(({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
  hideFooter,
  className,
}: DateRangeCalendarProps) => {
  const { t, i18n } = useTransClient('common')
  const [currentMonth, setCurrentMonth] = useState(() =>
    startDate ? dayjs(startDate) : dayjs(),
  )
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [selectPhase, setSelectPhase] = useState<'start' | 'end'>(
    startDate && !endDate ? 'end' : 'start',
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
    if (selectPhase === 'start') {
      onStartChange(dateStr)
      onEndChange(null)
      setSelectPhase('end')
    }
    else {
      if (startDate && dateStr < startDate) {
        onEndChange(startDate)
        onStartChange(dateStr)
      }
      else {
        onEndChange(dateStr)
      }
      setSelectPhase('start')
    }
  }, [selectPhase, startDate, onStartChange, onEndChange])

  const handleClear = useCallback(() => {
    onStartChange(null)
    onEndChange(null)
    setSelectPhase('start')
    setHoverDate(null)
    onClear?.()
  }, [onStartChange, onEndChange, onClear])

  const getDayState = useCallback((dateStr: string) => {
    const isStart = dateStr === startDate
    const isEnd = dateStr === endDate
    const isToday = dateStr === today

    let inRange = false
    let inPreview = false

    if (startDate && endDate) {
      inRange = dateStr > startDate && dateStr < endDate
    }
    else if (startDate && !endDate && hoverDate && selectPhase === 'end') {
      const rangeStart = hoverDate < startDate ? hoverDate : startDate
      const rangeEnd = hoverDate < startDate ? startDate : hoverDate
      inPreview = dateStr > rangeStart && dateStr < rangeEnd
    }

    return { isStart, isEnd, isToday, inRange, inPreview }
  }, [startDate, endDate, hoverDate, selectPhase, today])

  return (
    <div className={cn('select-none', className)}>
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
          const { isStart, isEnd, isToday, inRange, inPreview } = getDayState(dateStr)
          const isSelected = isStart || isEnd

          return (
            <div
              key={i}
              className={cn(
                'relative flex items-center justify-center h-9',
                (inRange || inPreview) && 'bg-primary/10',
                isStart && endDate && 'rounded-l-full bg-primary/10',
                isEnd && startDate && 'rounded-r-full bg-primary/10',
                isStart && !endDate && !inPreview && 'bg-transparent',
                isEnd && !startDate && 'bg-transparent',
              )}
              onMouseEnter={() => setHoverDate(dateStr)}
              onMouseLeave={() => setHoverDate(null)}
            >
              <button
                type="button"
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  'relative size-9 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer',
                  !item.isCurrentMonth && 'opacity-40',
                  item.isCurrentMonth && !isSelected && 'hover:bg-accent',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  isToday && !isSelected && 'border border-primary',
                )}
              >
                {item.date.date()}
              </button>
            </div>
          )
        })}
      </div>

      {/* 清除按钮 */}
      {!hideFooter && (startDate || endDate) && (
        <div className="flex justify-end mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-7"
          >
            {t('datePicker.clear')}
          </Button>
        </div>
      )}
    </div>
  )
})

DateRangeCalendar.displayName = 'DateRangeCalendar'

/** 桌面端 Popover 包装 */
const DateRangePicker = memo(({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  className,
}: DateRangePickerProps) => {
  const { t } = useTransClient('common')
  const [open, setOpen] = useState(false)
  const [localStart, setLocalStart] = useState<string | null>(startDate)
  const [localEnd, setLocalEnd] = useState<string | null>(endDate)

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      setLocalStart(startDate)
      setLocalEnd(endDate)
    }
    setOpen(nextOpen)
  }, [startDate, endDate])

  const handleConfirm = useCallback(() => {
    onStartChange(localStart)
    onEndChange(localEnd)
    setOpen(false)
  }, [localStart, localEnd, onStartChange, onEndChange])

  const handleClear = useCallback(() => {
    onStartChange(null)
    onEndChange(null)
    setOpen(false)
  }, [onStartChange, onEndChange])

  const displayText = useMemo(() => {
    if (startDate && endDate)
      return `${startDate} — ${endDate}`
    if (startDate)
      return `${startDate} —`
    if (endDate)
      return `— ${endDate}`
    return t('datePicker.selectDateRange')
  }, [startDate, endDate, t])

  const hasValue = startDate || endDate

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent cursor-pointer',
            !hasValue && 'text-muted-foreground',
            hasValue && 'text-foreground',
            className,
          )}
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{displayText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <DateRangeCalendar
          startDate={localStart}
          endDate={localEnd}
          onStartChange={setLocalStart}
          onEndChange={setLocalEnd}
          hideFooter
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          {(localStart || localEnd)
            ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-7"
                >
                  {t('datePicker.clear')}
                </Button>
              )
            : <span />}
          <Button
            size="sm"
            onClick={handleConfirm}
            className="text-xs cursor-pointer h-7"
          >
            {t('datePicker.confirm')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
})

DateRangePicker.displayName = 'DateRangePicker'

export default DateRangePicker
