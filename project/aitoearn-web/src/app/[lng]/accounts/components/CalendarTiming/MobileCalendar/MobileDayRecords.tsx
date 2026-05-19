/**
 * MobileDayRecords 组件
 *
 * 功能描述: 移动端日历任务列表
 * - 显示选中日期的所有任务
 * - 使用 RecordCore 组件展示每条记录
 * - 支持 loading 骨架屏
 * - 空状态显示
 * - 添加任务按钮
 */

'use client'

import type { CalendarFestivalInfo } from '../calendarFestival.utils'
import type { IMobileDayRecordsProps } from './mobileCalendar.types'
import dayjs from 'dayjs'
import { CalendarPlus, Plus } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'
import RecordCore from '../../CalendarTimingItem/components/RecordCore'
import { getChinaCalendarEvents, getChinaCalendarLunarInfo } from '../calendarFestival.utils'
import CalendarFestivalDetailDialog from '../CalendarFestivalDetailDialog'
import CalendarHolidayBadge from '../CalendarHolidayBadge'
import CalendarLunarText from '../CalendarLunarText'

const MobileDayRecords = memo<IMobileDayRecordsProps>(
  ({ selectedDate, records, loading, onClickPub }) => {
    const { t } = useTransClient('account')
    const lng = useGetClientLng()
    const [selectedFestival, setSelectedFestival] = useState<CalendarFestivalInfo | null>(null)

    // 格式化选中日期
    const formattedDate = useMemo(() => {
      return dayjs(selectedDate).format('MM/DD')
    }, [selectedDate])

    // 判断是否是今天或未来日期
    const isFuture = useMemo(() => {
      return dayjs(selectedDate).startOf('day').isSameOrAfter(dayjs().startOf('day'))
    }, [selectedDate])

    const festivals = useMemo(() => getChinaCalendarEvents(selectedDate, lng), [selectedDate, lng])
    const lunar = useMemo(() => getChinaCalendarLunarInfo(selectedDate, lng), [selectedDate, lng])
    const displayFestivals = useMemo(() => festivals.filter(item => item.type !== 'workday'), [festivals])
    const workdayFestival = useMemo(() => festivals.find(item => item.type === 'workday'), [festivals])

    // 处理添加任务
    const handleAddTask = () => {
      const selected = dayjs(selectedDate)
      const today = dayjs()

      // 如果是今天，则使用当前时间+10分钟
      if (selected.isSame(today, 'day')) {
        onClickPub(today.add(10, 'minute').format())
      }
      else {
        onClickPub(selected.format())
      }
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-3 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-background to-brand-cyan/8 p-3 shadow-sm shadow-primary/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-lg font-bold leading-none text-foreground tabular-nums">{formattedDate}</span>
                  <CalendarLunarText lunar={lunar} className="max-w-28" />
                  {workdayFestival && (
                    <span
                      className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background px-1.5 text-[10px] font-bold leading-none text-muted-foreground shadow-sm"
                      title={t(workdayFestival.statusTitleKey)}
                      aria-label={t(workdayFestival.statusTitleKey)}
                    >
                      {t(workdayFestival.statusKey)}
                    </span>
                  )}
                </div>
                <CalendarHolidayBadge
                  festivals={displayFestivals}
                  compact
                  maxVisible={4}
                  onFestivalClick={setSelectedFestival}
                  className="justify-start gap-1.5"
                />
              </div>
              {isFuture && (
                <Button
                  data-testid="mobile-day-header-add-btn"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 cursor-pointer rounded-full bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:text-primary"
                  onClick={handleAddTask}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            // 加载骨架屏
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
              ))}
            </div>
          ) : records.length > 0 ? (
            // 任务列表
            <div data-testid="mobile-day-records" className="flex flex-col gap-2.5">
              {records.map(record => (
                <RecordCore
                  key={record.id + record.title + record.uid + record.updatedAt}
                  publishRecord={record}
                />
              ))}
            </div>
          ) : (
            // 空状态
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <CalendarPlus className="h-14 w-14 mb-4 opacity-50" />
              <p className="text-base mb-4">{t('mobileCalendar.noTasks')}</p>

              {/* 空状态添加按钮 */}
              {isFuture && (
                <Button
                  data-testid="mobile-day-add-btn"
                  variant="outline"
                  size="default"
                  className={cn('cursor-pointer gap-1.5')}
                  onClick={handleAddTask}
                >
                  <Plus className="h-4 w-4" />
                  {t('mobileCalendar.addFirstTask')}
                </Button>
              )}
            </div>
          )}
        </div>
        <CalendarFestivalDetailDialog
          festival={selectedFestival}
          festivals={displayFestivals}
          date={selectedDate}
          lunar={lunar}
          open={Boolean(selectedFestival)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedFestival(null)
            }
          }}
        />
      </div>
    )
  },
)

MobileDayRecords.displayName = 'MobileDayRecords'

export default MobileDayRecords
