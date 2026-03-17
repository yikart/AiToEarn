/**
 * PublishDatePicker Component
 * 发布日期选择器组件 - 支持立即发布和定时发布两种模式
 * - 点击左侧按钮打开日期选择器
 * - 底部 Now 按钮：选择立即发布
 * - 底部 Confirm 按钮：确认定时发布
 */

import type { Dayjs } from 'dayjs'
import type { ForwardedRef } from 'react'
import dayjs from 'dayjs'
import { Check, ChevronDown, Clock, Send } from 'lucide-react'
import { forwardRef, memo, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { DateTimePicker } from './DateTimePicker'

export interface IPublishDatePickerRef {}

export interface IPublishDatePickerProps {
  loading: boolean
  onClick: () => void
  // 是否为移动端
  isMobile?: boolean
}

const PublishDatePicker = memo(
  forwardRef(
    (
      { loading, onClick, isMobile }: IPublishDatePickerProps,
      ref: ForwardedRef<IPublishDatePickerRef>,
    ) => {
      const { t } = useTransClient('publish')
      const [menuOpen, setMenuOpen] = useState(false)
      const [tempDate, setTempDate] = useState<Dayjs | null>(null)
      const { pubTime, setPubTime } = usePublishDialog(
        useShallow(state => ({
          pubTime: state.pubTime,
          setPubTime: state.setPubTime,
        })),
      )

      const handleCalendarChange = (date: Dayjs) => {
        setTempDate(date)
      }

      // 点击 Now 按钮 - 选择立即发布模式
      const handleNowClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPubTime(undefined)
        setMenuOpen(false)
      }

      // 点击 Confirm 按钮 - 确认定时发布时间
      const handleScheduleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPubTime(tempDate ? tempDate.format() : undefined)
        setMenuOpen(false)
      }

      // 禁用今天之前的日期
      const disabledDate = (current: dayjs.Dayjs) => {
        return current && current < dayjs().startOf('day')
      }

      // 禁用当前时间之前和当前时间20分钟内的时间（只精确到分钟，不考虑秒）
      const disabledDateTime = (current: dayjs.Dayjs | null) => {
        if (!current)
          return {}

        const now = dayjs()
        const minTime = now.add(20, 'minute')

        // 只对今天限制
        if (current.isSame(now, 'day')) {
          const minHour = minTime.hour()
          const minMinute = minTime.minute()

          // 禁用小时
          const disabledHours = () => {
            const hours: number[] = []
            for (let i = 0; i < 24; i++) {
              if (i < minHour)
                hours.push(i)
            }
            return hours
          }

          // 禁用分钟
          const disabledMinutes = (selectedHour: number) => {
            const minutes: number[] = []
            if (selectedHour === minHour) {
              for (let i = 0; i < minMinute; i++) {
                minutes.push(i)
              }
            }
            else if (selectedHour < minHour) {
              // 小时都禁用了，分钟全部禁用
              for (let i = 0; i < 60; i++) {
                minutes.push(i)
              }
            }
            return minutes
          }

          return {
            disabledHours,
            disabledMinutes,
          }
        }
        // 非今天不限制
        return {}
      }

      const pubTimeValue = useMemo(() => {
        if (pubTime) {
          return dayjs(pubTime)
        }
        return null
      }, [pubTime])

      // 当打开弹窗时，初始化临时日期
      const handleOpenChange = (open: boolean) => {
        if (open) {
          // 如果已有定时时间，使用它；否则使用当前时间+30分钟作为默认
          setTempDate(pubTimeValue || dayjs().add(30, 'minute'))
        }
        setMenuOpen(open)
      }

      // 日期选择器内容
      const datePickerContent = (
        <div className={cn(isMobile ? 'w-full' : 'w-[400px]')}>
          <DateTimePicker
            value={tempDate}
            onChange={handleCalendarChange}
            disabledDate={disabledDate}
            disabledTime={disabledDateTime}
            isMobile={isMobile}
          />

          <div className="flex items-center justify-between py-2.5 px-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNowClick}
              className="gap-2 cursor-pointer"
              data-testid="publish-now-button"
            >
              <Send className="w-4 h-4" />
              {t('buttons.publishNow')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleScheduleConfirm}
              className="gap-2 cursor-pointer"
              data-testid="publish-schedule-confirm-button"
            >
              <Check className="w-4 h-4" />
              {t('buttons.confirm')}
            </Button>
          </div>
        </div>
      )

      return (
        <div className={cn('flex gap-0', isMobile && 'w-full')} data-testid="publish-date-picker">
          <Popover open={menuOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex items-center gap-2.5 rounded-r-none border-r-0 h-10 px-4 cursor-pointer',
                  isMobile && 'flex-1',
                )}
                onClick={() => {
                  setMenuOpen(true)
                }}
                data-testid="publish-schedule-trigger"
              >
                {pubTimeValue ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                <span className="flex-1 text-left">
                  {pubTimeValue ? pubTimeValue.format('YYYY-MM-DD HH:mm') : t('buttons.publishNow')}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={cn('w-auto p-0', isMobile && 'w-[calc(100vw-32px)]')}
              align="start"
              allowInnerScroll
            >
              {datePickerContent}
            </PopoverContent>
          </Popover>
          <Button
            className={cn('rounded-l-none h-10 px-6 cursor-pointer', isMobile && 'shrink-0')}
            disabled={loading}
            onClick={() => onClick()}
            data-testid="publish-submit-btn"
          >
            {loading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                >
                </circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                >
                </path>
              </svg>
            )}
            {t('publish')}
          </Button>
        </div>
      )
    },
  ),
)

PublishDatePicker.displayName = 'PublishDatePicker'

export default PublishDatePicker
