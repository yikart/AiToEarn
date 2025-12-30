/**
 * CalendarToolbar 组件
 *
 * 功能描述: 日历工具栏 - 包含导航按钮和月份显示
 * - 上月/下月按钮
 * - 当前月份显示
 * - 今天按钮
 */

'use client'

import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { useGetClientLng } from '@/hooks/useSystem'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

export interface ICalendarToolbarProps {
  currentDate: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

const CalendarToolbar = memo<ICalendarToolbarProps>(
  ({ currentDate, onPrev, onNext, onToday }) => {
    const { t } = useTransClient('account')
    const lng = useGetClientLng()

    // 根据语言设置 dayjs locale 并格式化日期
    const formattedDate = useMemo(() => {
      const locale = lng === 'zh-CN' ? 'zh-cn' : 'en'
      dayjs.locale(locale)
      return dayjs(currentDate).format('MMMM YYYY')
    }, [currentDate, lng])

    return (
      <div className="h-12 md:h-14 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b bg-background shrink-0">
        {/* 导航控制 */}
        <div className="flex items-center gap-1 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            className="h-7 w-7 md:h-8 md:w-8 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-7 w-7 md:h-8 md:w-8 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-sm md:text-base font-semibold text-foreground min-w-[100px] md:min-w-[120px] text-center">
            {formattedDate}
          </div>
        </div>

        {/* 今天按钮 */}
        <Button
          variant="outline"
          onClick={onToday}
          size="sm"
          className="h-7 md:h-8 text-xs md:text-sm cursor-pointer"
        >
          {t('today')}
        </Button>
      </div>
    )
  },
)

CalendarToolbar.displayName = 'CalendarToolbar'

export default CalendarToolbar
