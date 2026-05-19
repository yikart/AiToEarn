/**
 * CalendarFestivalDetailDialog 组件
 *
 * 功能描述: 展示中国地区日历节日、节气的图片与说明
 */

'use client'

import type { CalendarFestivalInfo, CalendarLunarInfo } from '../calendarFestival.utils'
import dayjs from 'dayjs'
import Image from 'next/image'
import { memo, useEffect, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { getCalendarFestivalName, getCalendarFestivalTabValue } from '../calendarFestival.utils'

export interface ICalendarFestivalDetailDialogProps {
  festival: CalendarFestivalInfo | null
  festivals?: CalendarFestivalInfo[]
  date?: Date
  lunar?: CalendarLunarInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getTypeTone(festival: CalendarFestivalInfo) {
  if (festival.type === 'solarTerm') {
    return 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan'
  }

  if (festival.type === 'traditional') {
    return 'border-primary/25 bg-primary/10 text-primary'
  }

  if (festival.isWorkday) {
    return 'border-border bg-muted text-muted-foreground'
  }

  return 'border-primary/25 bg-gradient-to-r from-primary/10 to-brand-cyan/10 text-primary'
}

function getLunarFullText(lunar: CalendarLunarInfo | null | undefined, t: (key: string) => string) {
  if (!lunar) {
    return ''
  }

  return `${lunar.isLeap ? t(lunar.leapPrefixKey) : ''}${t(lunar.monthKey)}${t(lunar.dayKey)}`
}

function getFestivalDedupeKey(festival: CalendarFestivalInfo) {
  return festival.id ?? `${festival.type}-${festival.nameKey ?? festival.name ?? festival.shortName}`
}

const CalendarFestivalDetailDialog = memo<ICalendarFestivalDetailDialogProps>(
  ({ festival, festivals, date, lunar, open, onOpenChange }) => {
    const { t } = useTransClient('account')
    const [activeFestivalValue, setActiveFestivalValue] = useState('')

    const displayFestivals = useMemo(() => {
      const result: CalendarFestivalInfo[] = []
      const festivalKeys = new Set<string>()

      for (const item of festivals ?? []) {
        const key = getFestivalDedupeKey(item)
        if (festivalKeys.has(key)) {
          continue
        }

        festivalKeys.add(key)
        result.push(item)
      }

      if (festival) {
        const key = getFestivalDedupeKey(festival)
        if (!festivalKeys.has(key)) {
          result.unshift(festival)
        }
      }

      return result
    }, [festival, festivals])

    const defaultFestival = festival
      ? displayFestivals.find(item => getFestivalDedupeKey(item) === getFestivalDedupeKey(festival)) ?? festival
      : displayFestivals[0]
    const defaultFestivalValue = defaultFestival
      ? getCalendarFestivalTabValue(defaultFestival, displayFestivals.indexOf(defaultFestival))
      : ''

    useEffect(() => {
      if (open && defaultFestivalValue) {
        setActiveFestivalValue(defaultFestivalValue)
      }
    }, [defaultFestivalValue, open])

    if (!defaultFestival) {
      return null
    }

    const selectedFestivalValue = displayFestivals.some((item, index) => getCalendarFestivalTabValue(item, index) === activeFestivalValue)
      ? activeFestivalValue
      : defaultFestivalValue
    const activeFestival = displayFestivals.find((item, index) => getCalendarFestivalTabValue(item, index) === selectedFestivalValue) ?? defaultFestival
    const name = getCalendarFestivalName(activeFestival, t)
    const description = activeFestival.description || t('calendar.festivalDetail.noDescription')
    const displayDate = date ?? (activeFestival.date ? dayjs(activeFestival.date).toDate() : undefined)
    const lunarText = getLunarFullText(lunar, t) || activeFestival.lunarDateText
    const lunarTitle = lunar ? t(lunar.titleKey) : t('calendar.festivalDetail.lunarDate')
    const showTabs = displayFestivals.length > 1

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="grid max-h-[88vh] w-[calc(100vw-24px)] max-w-[680px] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-3xl border-border p-0 sm:w-[min(680px,92vw)]"
          aria-describedby={undefined}
        >
          <DialogHeader className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-brand-cyan/5 px-4 pb-4 pt-5 text-left sm:px-5">
            <div className="flex min-w-0 gap-3 pr-8 sm:gap-4">
              {displayDate && (
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-background/85 shadow-sm sm:h-20 sm:w-20">
                  <div className="text-3xl font-bold leading-none tracking-tight text-primary sm:text-4xl">
                    {dayjs(displayDate).format('DD')}
                  </div>
                  <div className="mt-1 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                    {dayjs(displayDate).format('YYYY.MM')}
                  </div>
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                <div className="min-w-0">
                  <DialogTitle className="truncate text-lg font-bold leading-6 text-foreground sm:text-xl">
                    {name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">{description}</DialogDescription>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
                    {displayDate && <span>{dayjs(displayDate).format('YYYY-MM-DD')}</span>}
                    {lunarText && (
                      <span>
                        {lunarTitle}
                        {' '}
                        {lunarText}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none shadow-sm',
                      getTypeTone(activeFestival),
                    )}
                  >
                    {t(activeFestival.statusTitleKey)}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="mx-0 min-h-0 px-0 pb-0 pt-0 sm:mx-0 sm:px-0">
            <Tabs
              value={selectedFestivalValue}
              onValueChange={setActiveFestivalValue}
              className={cn(
                'min-h-0 bg-popover',
                showTabs
                  ? 'grid h-full grid-rows-[auto_minmax(0,1fr)]'
                  : 'h-full overflow-y-auto overscroll-contain',
              )}
            >
              {showTabs && (
                <TabsList className="flex h-auto max-w-full justify-start gap-1.5 overflow-x-auto rounded-none border-b border-border bg-background p-2.5">
                  {displayFestivals.map((item, index) => {
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
              )}

              <div className={cn('min-h-0', showTabs && 'overflow-y-auto overscroll-contain')}>
                {displayFestivals.map((item, index) => {
                  const tabValue = getCalendarFestivalTabValue(item, index)
                  const itemName = getCalendarFestivalName(item, t)
                  const itemDescription = item.description || t('calendar.festivalDetail.noDescription')

                  return (
                    <TabsContent key={tabValue} value={tabValue} className="m-0">
                      <div
                        className={cn(
                          'min-h-0 bg-popover',
                          item.imageUrl && 'md:grid md:min-h-[20rem] md:grid-cols-[20rem_minmax(0,1fr)]',
                        )}
                      >
                        {item.imageUrl && (
                          <div className="aspect-[4/3] min-w-0 overflow-hidden border-b border-border bg-muted/30 md:aspect-auto md:h-full md:w-full md:border-b-0 md:border-r">
                            <Image
                              src={item.imageUrl}
                              alt={itemName}
                              width={720}
                              height={360}
                              unoptimized
                              className="block h-full w-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex min-w-0 flex-col p-4 sm:p-5 md:min-h-0">
                          <div className="mb-2 text-sm font-semibold text-foreground">
                            {t('calendar.festivalDetail.description')}
                          </div>
                          <p className="min-h-0 flex-1 whitespace-pre-line rounded-2xl bg-muted/35 p-3 text-sm leading-6 text-muted-foreground md:leading-7">
                            {itemDescription}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  )
                })}
              </div>
            </Tabs>
          </DialogBody>
        </DialogContent>
      </Dialog>
    )
  },
)

CalendarFestivalDetailDialog.displayName = 'CalendarFestivalDetailDialog'

export default CalendarFestivalDetailDialog
