/**
 * CalendarLunarText 组件
 *
 * 功能描述: 日历中的农历日期文本，和公历日期保持同一视觉层级
 */

'use client'

import type { CalendarLunarInfo } from '../calendarFestival.utils'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'

export interface ICalendarLunarTextProps {
  lunar: CalendarLunarInfo | null
  selected?: boolean
  compact?: boolean
  className?: string
}

const CalendarLunarText = memo<ICalendarLunarTextProps>(
  ({ lunar, selected = false, compact = false, className }) => {
    const { t } = useTransClient('account')

    if (!lunar) {
      return null
    }

    const lunarText = lunar.day === 1 ? t(lunar.monthKey) : t(lunar.dayKey)

    return (
      <span
        className={cn(
          'inline-flex min-w-0 items-center leading-none tracking-tight',
          compact ? 'text-[10px] font-medium' : 'text-xs font-medium',
          selected ? 'text-primary-foreground/85' : 'text-muted-foreground',
          className,
        )}
        title={t(lunar.titleKey)}
        aria-label={t(lunar.titleKey)}
      >
        <span className="truncate">
          {lunar.isLeap && t(lunar.leapPrefixKey)}
          {lunarText}
        </span>
      </span>
    )
  },
)

CalendarLunarText.displayName = 'CalendarLunarText'

export default CalendarLunarText
