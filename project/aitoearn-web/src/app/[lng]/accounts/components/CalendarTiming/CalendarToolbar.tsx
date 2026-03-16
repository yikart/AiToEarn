/**
 * CalendarToolbar 组件
 *
 * 功能描述: 日历工具栏 - 包含导航按钮、日期显示、视图切换
 * - 上月/下月（或上周/下周）按钮
 * - 当前月份/周范围显示
 * - 月/周视图切换按钮
 * - 今天按钮
 */

'use client'

import type { CalendarViewType } from '@/store/system'
import dayjs from 'dayjs'
import { CalendarDays, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { useGetClientLng } from '@/hooks/useSystem'
import { getDayjsLocale } from '@/lib/i18n/languageConfig'
import { cn } from '@/lib/utils'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import 'dayjs/locale/de'
import 'dayjs/locale/fr'
import 'dayjs/locale/ja'
import 'dayjs/locale/ko'

export interface ICalendarToolbarProps {
  currentDate: Date
  viewType: CalendarViewType
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewTypeChange: (type: CalendarViewType) => void
}

const CalendarToolbar = memo<ICalendarToolbarProps>(
  ({ currentDate, viewType, onPrev, onNext, onToday, onViewTypeChange }) => {
    const { t } = useTransClient('account')
    const lng = useGetClientLng()

    // 根据语言设置 dayjs locale 并格式化日期
    const formattedDate = useMemo(() => {
      const locale = getDayjsLocale(lng)
      dayjs.locale(locale)

      if (viewType === 'month') {
        return dayjs(currentDate).format('MMMM YYYY')
      }

      // 周视图：显示周范围
      const start = dayjs(currentDate).startOf('week')
      const end = start.add(6, 'day')

      // 根据语言选择格式
      switch (lng) {
        case 'zh-CN':
        case 'ja':
          // 中文/日语: "1月12日 - 18日, 2026"
          if (start.month() === end.month()) {
            return `${start.format('M月D日')} - ${end.format('D日')}, ${end.format('YYYY')}`
          }
          else if (start.year() === end.year()) {
            return `${start.format('M月D日')} - ${end.format('M月D日')}, ${end.format('YYYY')}`
          }
          else {
            return `${start.format('YYYY年M月D日')} - ${end.format('YYYY年M月D日')}`
          }

        case 'ko':
          // 韩语: "1월 12일 - 18일, 2026"
          if (start.month() === end.month()) {
            return `${start.format('M월 D일')} - ${end.format('D일')}, ${end.format('YYYY')}`
          }
          else if (start.year() === end.year()) {
            return `${start.format('M월 D일')} - ${end.format('M월 D일')}, ${end.format('YYYY')}`
          }
          else {
            return `${start.format('YYYY년 M월 D일')} - ${end.format('YYYY년 M월 D일')}`
          }

        case 'de':
          // 德语: "12. - 18. Jan 2026"
          if (start.month() === end.month()) {
            return `${start.format('D.')} - ${end.format('D. MMM YYYY')}`
          }
          else if (start.year() === end.year()) {
            return `${start.format('D. MMM')} - ${end.format('D. MMM YYYY')}`
          }
          else {
            return `${start.format('D. MMM YYYY')} - ${end.format('D. MMM YYYY')}`
          }

        case 'fr':
          // 法语: "12 - 18 janv. 2026"
          if (start.month() === end.month()) {
            return `${start.format('D')} - ${end.format('D MMM YYYY')}`
          }
          else if (start.year() === end.year()) {
            return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`
          }
          else {
            return `${start.format('D MMM YYYY')} - ${end.format('D MMM YYYY')}`
          }

        default:
          // 英语等: "Jan 12 - 18, 2026"
          if (start.month() === end.month()) {
            return `${start.format('MMM D')} - ${end.format('D, YYYY')}`
          }
          else if (start.year() === end.year()) {
            return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
          }
          else {
            return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`
          }
      }
    }, [currentDate, lng, viewType])

    return (
      <div className="h-12 md:h-14 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b bg-background shrink-0">
        {/* 导航控制 */}
        <div className="flex items-center gap-1 md:gap-3">
          <Button
            data-testid="calendar-prev-btn"
            variant="ghost"
            size="icon"
            onClick={onPrev}
            className="h-7 w-7 md:h-8 md:w-8 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            data-testid="calendar-next-btn"
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-7 w-7 md:h-8 md:w-8 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div data-testid="calendar-date-title" className="text-sm md:text-base font-semibold text-foreground min-w-[100px] md:min-w-[180px] text-center">
            {formattedDate}
          </div>
        </div>

        {/* 右侧：视图切换和今天按钮 */}
        <div className="flex items-center gap-2">
          {/* 视图切换按钮 */}
          <div className="flex items-center border rounded-md">
            <Button
              data-testid="calendar-view-week"
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 md:h-8 md:w-8 rounded-r-none cursor-pointer',
                viewType === 'week' && 'bg-accent',
              )}
              onClick={() => onViewTypeChange('week')}
              title={t('calendar.weekView')}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              data-testid="calendar-view-month"
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 md:h-8 md:w-8 rounded-l-none cursor-pointer',
                viewType === 'month' && 'bg-accent',
              )}
              onClick={() => onViewTypeChange('month')}
              title={t('calendar.monthView')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {/* 今天按钮 */}
          <Button
            data-testid="calendar-today-btn"
            variant="outline"
            onClick={onToday}
            size="sm"
            className="h-7 md:h-8 text-xs md:text-sm cursor-pointer"
          >
            {t('today')}
          </Button>
        </div>
      </div>
    )
  },
)

CalendarToolbar.displayName = 'CalendarToolbar'

export default CalendarToolbar
