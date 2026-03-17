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

import type { IMobileDayRecordsProps } from './mobileCalendar.types'
import dayjs from 'dayjs'
import { CalendarPlus, Plus } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import RecordCore from '../../CalendarTimingItem/components/RecordCore'

const MobileDayRecords = memo<IMobileDayRecordsProps>(
  ({ selectedDate, records, loading, onClickPub }) => {
    const { t } = useTransClient('account')

    // 格式化选中日期
    const formattedDate = useMemo(() => {
      return dayjs(selectedDate).format('MM/DD')
    }, [selectedDate])

    // 判断是否是今天或未来日期
    const isFuture = useMemo(() => {
      return dayjs(selectedDate).startOf('day').isSameOrAfter(dayjs().startOf('day'))
    }, [selectedDate])

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
      </div>
    )
  },
)

MobileDayRecords.displayName = 'MobileDayRecords'

export default MobileDayRecords
