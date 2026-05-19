/**
 * CalendarHolidayBadge 组件
 *
 * 功能描述: 中国节假日、传统农历节日与二十四节气标签
 */

'use client'

import type { CalendarFestivalInfo, CalendarLunarInfo } from '../calendarFestival.utils'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import { getCalendarFestivalName, getCalendarFestivalTitle } from '../calendarFestival.utils'

export interface ICalendarHolidayBadgeProps {
  festival?: CalendarFestivalInfo | null
  festivals?: CalendarFestivalInfo[]
  lunar?: CalendarLunarInfo | null
  compact?: boolean
  prominent?: boolean
  selected?: boolean
  showLunar?: boolean
  maxVisible?: number
  singleLine?: boolean
  onFestivalClick?: (festival: CalendarFestivalInfo) => void
  className?: string
}

function getFestivalTone(festival: CalendarFestivalInfo, selected: boolean, prominent: boolean) {
  if (selected) {
    return 'border-primary-foreground/30 bg-primary-foreground/20 text-current shadow-none'
  }

  if (festival.isWorkday) {
    return 'border-border bg-background text-foreground shadow-muted/20'
  }

  if (festival.type === 'solarTerm') {
    return prominent
      ? 'border-brand-cyan/35 bg-brand-cyan/15 text-brand-cyan shadow-md shadow-brand-cyan/10'
      : 'border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan shadow-brand-cyan/10'
  }

  if (festival.type === 'traditional') {
    return prominent
      ? 'border-primary/30 bg-primary/15 text-primary shadow-md shadow-primary/10'
      : 'border-primary/20 bg-primary/10 text-primary shadow-primary/10'
  }

  return prominent
    ? 'border-primary/30 bg-gradient-to-r from-primary/15 to-brand-cyan/15 text-primary shadow-md shadow-primary/15'
    : 'border-primary/20 bg-primary/10 text-primary shadow-primary/10'
}

function getStatusTone(festival: CalendarFestivalInfo, selected: boolean) {
  if (selected) {
    return 'bg-primary-foreground text-primary'
  }

  if (festival.isWorkday) {
    return 'border border-border bg-background text-muted-foreground'
  }

  if (festival.type === 'solarTerm') {
    return 'bg-brand-cyan text-primary-foreground'
  }

  return 'bg-gradient-back text-gradient-foreground'
}

const CalendarHolidayBadge = memo<ICalendarHolidayBadgeProps>(
  ({
    festival,
    festivals,
    lunar,
    compact = false,
    prominent = false,
    selected = false,
    showLunar = false,
    maxVisible = 2,
    singleLine = false,
    onFestivalClick,
    className,
  }) => {
    const { t } = useTransClient('account')
    const festivalList = festivals ?? (festival ? [festival] : [])
    const visibleFestivals = festivalList.slice(0, maxVisible)
    const hiddenCount = festivalList.length - visibleFestivals.length

    if (visibleFestivals.length === 0 && (!showLunar || !lunar)) {
      return null
    }

    return (
      <div className={cn('flex min-w-0 items-center gap-1', singleLine ? 'flex-nowrap overflow-hidden' : 'flex-wrap', className)}>
        {visibleFestivals.map((item) => {
          const festivalName = getCalendarFestivalName(item, t, compact)
          const showStatus = item.type === 'holiday' || item.type === 'workday'
          const statusName = t(item.statusKey)
          const title = getCalendarFestivalTitle(item, t)
          const classNames = cn(
            'inline-flex min-w-0 items-center justify-center gap-1 rounded-full border leading-none shadow-sm transition-colors',
            singleLine && 'shrink min-w-0',
            prominent ? 'h-7 px-2 text-[13px]' : 'h-5 px-1.5 text-xs',
            onFestivalClick && 'cursor-pointer hover:-translate-y-px hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            getFestivalTone(item, selected, prominent),
          )
          const content = (
            <>
              <span className="min-w-0 truncate font-semibold tracking-tight">{festivalName}</span>
              {showStatus && (
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none',
                    prominent ? 'h-5 min-w-5 px-1.5 text-xs' : 'h-4 min-w-4 px-1 text-[10px]',
                    getStatusTone(item, selected),
                  )}
                >
                  {statusName}
                </span>
              )}
            </>
          )

          if (onFestivalClick) {
            return (
              <button
                key={item.id ?? `${item.type}-${item.nameKey ?? item.name}`}
                type="button"
                className={classNames}
                title={title}
                aria-label={title}
                onClick={() => onFestivalClick(item)}
              >
                {content}
              </button>
            )
          }

          return (
            <div
              key={item.id ?? `${item.type}-${item.nameKey ?? item.name}`}
              className={classNames}
              title={title}
              aria-label={title}
            >
              {content}
            </div>
          )
        })}

        {hiddenCount > 0 && onFestivalClick && (
          <button
            type="button"
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors',
              'cursor-pointer hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              prominent ? 'h-7 px-2 text-xs' : 'h-5 px-1.5 text-[10px]',
            )}
            title={festivalList.map(item => getCalendarFestivalName(item, t)).join(' · ')}
            onClick={() => onFestivalClick(festivalList[visibleFestivals.length])}
          >
            +
            {hiddenCount}
          </button>
        )}

        {hiddenCount > 0 && !onFestivalClick && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm',
              prominent ? 'h-7 px-2 text-xs' : 'h-5 px-1.5 text-[10px]',
            )}
            title={festivalList.map(item => getCalendarFestivalName(item, t)).join(' · ')}
          >
            +
            {hiddenCount}
          </span>
        )}

        {showLunar && lunar && (
          <span
            className={cn(
              'inline-flex min-w-0 items-center rounded-full border border-border bg-background/80 text-muted-foreground shadow-sm',
              singleLine && 'shrink min-w-0',
              prominent ? 'h-7 px-2 text-xs' : 'h-5 px-1.5 text-[10px]',
              selected && 'border-primary-foreground/30 bg-primary-foreground/15 text-current',
            )}
            title={t(lunar.titleKey)}
            aria-label={t(lunar.titleKey)}
          >
            <span className="truncate font-medium">
              {lunar.isLeap && t(lunar.leapPrefixKey)}
              {lunar.day === 1 ? t(lunar.monthKey) : t(lunar.dayKey)}
            </span>
          </span>
        )}
      </div>
    )
  },
)

CalendarHolidayBadge.displayName = 'CalendarHolidayBadge'

export default CalendarHolidayBadge
