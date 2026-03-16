/**
 * MobileCalendarHeader 组件
 *
 * 功能描述: 移动端日历顶部工具栏
 * - 左侧：年月显示（点击弹出月份选择器）
 * - 右侧：周视图/月视图切换按钮、今天按钮
 */

'use client'

import type { IMobileCalendarHeaderProps } from './mobileCalendar.types'
import dayjs from 'dayjs'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGetClientLng } from '@/hooks/useSystem'
import { getDayjsLocale } from '@/lib/i18n/languageConfig'
import { cn } from '@/lib/utils'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

/** 月份列表 */
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const MobileCalendarHeader = memo<IMobileCalendarHeaderProps>(
  ({ currentDate, viewType, onDateChange, onViewTypeChange, onToday }) => {
    const { t } = useTransClient('account')
    const { t: tCommon } = useTransClient('common')
    const lng = useGetClientLng()
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [pickerYear, setPickerYear] = useState(() => dayjs(currentDate).year())

    // 格式化年月显示
    const formattedDate = useMemo(() => {
      const locale = getDayjsLocale(lng)
      dayjs.locale(locale)
      return dayjs(currentDate).format('YYYY/MM')
    }, [currentDate, lng])

    // 当前年月
    const currentYear = dayjs(currentDate).year()
    const currentMonth = dayjs(currentDate).month() + 1

    // 处理月份选择
    const handleMonthSelect = (month: number) => {
      const newDate = dayjs(currentDate)
        .year(pickerYear)
        .month(month - 1)
        .toDate()
      onDateChange(newDate)
      setPopoverOpen(false)
    }

    // 处理年份切换
    const handlePrevYear = () => {
      setPickerYear(prev => prev - 1)
    }

    const handleNextYear = () => {
      setPickerYear(prev => prev + 1)
    }

    // 打开 Popover 时重置 pickerYear 为当前年份
    const handleOpenChange = (open: boolean) => {
      if (open) {
        setPickerYear(currentYear)
      }
      setPopoverOpen(open)
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        {/* 左侧：年月选择器 */}
        <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              data-testid="mobile-calendar-month-picker"
              variant="ghost"
              className="h-8 px-2 text-base font-semibold cursor-pointer gap-1"
            >
              {formattedDate}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-3" align="start">
            {/* 年份切换 */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={handlePrevYear}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-base">{pickerYear}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={handleNextYear}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 月份网格 */}
            <div className="grid grid-cols-4 gap-2">
              {MONTHS.map(month => (
                <Button
                  key={month}
                  variant="ghost"
                  className={cn(
                    'h-9 cursor-pointer',
                    pickerYear === currentYear
                    && month === currentMonth
                    && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  )}
                  onClick={() => handleMonthSelect(month)}
                >
                  {month}
                  {tCommon('calendar.monthSuffix')}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* 右侧：视图切换和今天按钮 */}
        <div className="flex items-center gap-2">
          {/* 视图切换按钮 */}
          <div data-testid="mobile-calendar-view-toggle" className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-r-none cursor-pointer',
                viewType === 'week' && 'bg-accent',
              )}
              onClick={() => onViewTypeChange('week')}
              title={t('mobileCalendar.weekView')}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-l-none cursor-pointer',
                viewType === 'month' && 'bg-accent',
              )}
              onClick={() => onViewTypeChange('month')}
              title={t('mobileCalendar.monthView')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {/* 今天按钮 */}
          <Button
            data-testid="mobile-calendar-today-btn"
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
            onClick={onToday}
          >
            {t('today')}
          </Button>
        </div>
      </div>
    )
  },
)

MobileCalendarHeader.displayName = 'MobileCalendarHeader'

export default MobileCalendarHeader
