/**
 * CalendarFestivalSummary 组件
 *
 * 功能描述: PC 月视图中的中国日历事件单行摘要与多节日气泡详情
 */

'use client'

import type { ReactNode } from 'react'
import type { CalendarFestivalInfo, CalendarLunarInfo } from '../calendarFestival.utils'
import dayjs from 'dayjs'
import Image from 'next/image'
import { memo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { getCalendarFestivalName, getCalendarFestivalTabValue, getCalendarFestivalTitle } from '../calendarFestival.utils'

export interface ICalendarFestivalSummaryProps {
  festivals: CalendarFestivalInfo[]
  date: Date
  lunar: CalendarLunarInfo | null
  headerContent?: ReactNode
  headerClassName?: string
  summaryCompact?: boolean
  summaryClassName?: string
  popoverSide?: 'top' | 'right' | 'bottom' | 'left'
  popoverAlign?: 'start' | 'center' | 'end'
  className?: string
}

function getFestivalTextTone(festival: CalendarFestivalInfo) {
  if (festival.isWorkday) {
    return 'text-muted-foreground'
  }

  if (festival.type === 'solarTerm') {
    return 'text-brand-cyan'
  }

  if (festival.type === 'traditional') {
    return 'text-primary'
  }

  return 'text-primary'
}

function getFestivalMarkerTone(festival: CalendarFestivalInfo) {
  if (festival.isWorkday) {
    return 'bg-muted-foreground/70'
  }

  if (festival.type === 'solarTerm') {
    return 'bg-brand-cyan'
  }

  if (festival.type === 'traditional') {
    return 'bg-primary'
  }

  return 'bg-primary/70'
}

function getLunarFullText(lunar: CalendarLunarInfo | null, t: (key: string) => string) {
  if (!lunar) {
    return ''
  }

  return `${lunar.isLeap ? t(lunar.leapPrefixKey) : ''}${t(lunar.monthKey)}${t(lunar.dayKey)}`
}

const CalendarFestivalSummary = memo<ICalendarFestivalSummaryProps>(
  ({
    festivals,
    date,
    lunar,
    headerContent,
    headerClassName,
    summaryCompact = true,
    summaryClassName,
    popoverSide = 'top',
    popoverAlign = 'start',
    className,
  }) => {
    const { t } = useTransClient('account')
    const [activeFestivalValue, setActiveFestivalValue] = useState('')
    const displayFestivals = festivals
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type !== 'workday')
    const defaultFestival = displayFestivals[0]

    if (!defaultFestival) {
      return headerContent ? (
        <div className={cn('flex min-w-0 items-baseline gap-1.5', headerClassName)}>
          {headerContent}
        </div>
      ) : null
    }

    const title = displayFestivals.map(({ item }) => getCalendarFestivalTitle(item, t)).join(' / ')
    const defaultFestivalValue = getCalendarFestivalTabValue(defaultFestival.item, defaultFestival.index)
    const selectedFestivalValue = displayFestivals.some(({ item, index }) => getCalendarFestivalTabValue(item, index) === activeFestivalValue)
      ? activeFestivalValue
      : defaultFestivalValue
    const lunarText = getLunarFullText(lunar, t)
    const lunarTitle = lunar ? t(lunar.titleKey) : ''

    return (
      <div className={cn('min-w-0 max-w-full overflow-hidden', className)} title={title} aria-label={title}>
        <Popover>
          {headerContent && (
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex min-w-0 max-w-full items-baseline gap-1.5 rounded-md text-left cursor-pointer',
                  'transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  headerClassName,
                )}
                aria-label={title}
                onClick={() => setActiveFestivalValue(defaultFestivalValue)}
              >
                {headerContent}
              </button>
            </PopoverTrigger>
          )}
          <div
            className={cn(
              'max-h-8 min-w-0 max-w-full overflow-hidden px-1 text-left text-[10px] font-medium leading-4 tracking-tight text-primary/80',
              summaryClassName,
            )}
          >
            {displayFestivals.map(({ item, index }, visibleIndex) => {
              const tabValue = getCalendarFestivalTabValue(item, index)
              const compactName = getCalendarFestivalName(item, t, summaryCompact)
              const festivalTitle = getCalendarFestivalTitle(item, t)

              return (
                <span key={tabValue} className="inline">
                  {visibleIndex > 0 && <span className="text-primary/45"> · </span>}
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'inline cursor-pointer rounded-sm px-0.5 text-left align-baseline transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        getFestivalTextTone(item),
                      )}
                      aria-label={festivalTitle}
                      onClick={() => setActiveFestivalValue(tabValue)}
                    >
                      {compactName}
                    </button>
                  </PopoverTrigger>
                </span>
              )
            })}
          </div>
          <PopoverContent
            align={popoverAlign}
            side={popoverSide}
            sideOffset={8}
            className="w-[calc(100vw-2rem)] max-w-[48rem] p-0 md:w-[46rem] lg:w-[48rem]"
            allowInnerScroll
          >
            <Tabs
              value={selectedFestivalValue}
              onValueChange={setActiveFestivalValue}
              className="overflow-hidden rounded-md bg-popover"
            >
              <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-brand-cyan/5 p-4">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-background/80 shadow-sm">
                    <div className="text-3xl font-bold leading-none tracking-tight text-primary">
                      {dayjs(date).format('DD')}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {dayjs(date).format('YYYY.MM')}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold leading-6 text-foreground">
                          {dayjs(date).format('YYYY-MM-DD')}
                        </div>
                        {lunarText && (
                          <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                            {lunarTitle}
                            {' '}
                            {lunarText}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <TabsList className="flex h-auto max-w-full justify-start gap-1.5 overflow-x-auto rounded-none border-b border-border bg-background p-2.5">
                {displayFestivals.map(({ item, index }) => {
                  const tabValue = getCalendarFestivalTabValue(item, index)
                  const compactName = getCalendarFestivalName(item, t, true)

                  return (
                    <TabsTrigger
                      key={tabValue}
                      value={tabValue}
                      className={cn(
                        'h-8 shrink-0 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground shadow-sm transition-colors',
                        'data-[state=active]:border-transparent data-[state=active]:bg-gradient-back data-[state=active]:text-gradient-foreground data-[state=active]:shadow-primary/20',
                      )}
                    >
                      {compactName}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              {displayFestivals.map(({ item, index }) => {
                const tabValue = getCalendarFestivalTabValue(item, index)
                const description = item.description || t('calendar.festivalDetail.noDescription')

                return (
                  <TabsContent key={tabValue} value={tabValue} className="m-0">
                    <div
                      className={cn(
                        'overflow-hidden bg-popover',
                        item.imageUrl && 'md:grid md:h-[19rem] md:grid-cols-[19rem_minmax(0,1fr)]',
                      )}
                    >
                      {item.imageUrl && (
                        <div className="aspect-[2/1] min-w-0 overflow-hidden border-b border-border bg-muted/30 md:aspect-auto md:h-full md:w-full md:border-b-0 md:border-r">
                          <Image
                            src={item.imageUrl}
                            alt={getCalendarFestivalName(item, t)}
                            width={512}
                            height={256}
                            unoptimized
                            className="block h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col p-4 md:min-h-0 md:p-4">
                        <p className="max-h-56 min-h-0 flex-1 overflow-y-auto whitespace-pre-line rounded-lg bg-muted/35 p-3 text-sm leading-6 text-muted-foreground md:max-h-none">
                          {description}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)

CalendarFestivalSummary.displayName = 'CalendarFestivalSummary'

export default CalendarFestivalSummary
