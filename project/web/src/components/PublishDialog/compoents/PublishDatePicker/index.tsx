/**
 * PublishDatePicker Component
 * 发布日期选择器组件 - 支持立即发布和定时发布两种模式
 */

import type { Dayjs } from 'dayjs'
import type { ForwardedRef } from 'react'
import dayjs from 'dayjs'
import { ArrowLeft, Check, ChevronDown, Clock, Send, Star } from 'lucide-react'
import { forwardRef, memo, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { PublishDatePickerType } from '@/components/PublishDialog/compoents/PublishDatePicker/publishDatePicker.enums'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useUserStore } from '@/store/user'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { DateTimePicker } from './DateTimePicker'

export interface IPublishDatePickerRef {}

export interface IPublishDatePickerProps {
  loading: boolean
  onClick: () => void
}

const PublishDatePicker = memo(
  forwardRef(({ loading, onClick }: IPublishDatePickerProps, ref: ForwardedRef<IPublishDatePickerRef>) => {
    const { t } = useTransClient('publish')
    const [menuOpen, setMenuOpen] = useState(false)
    const [tempDate, setTempDate] = useState<Dayjs | null>(null)
    const [showMenu, setShowMenu] = useState(true)
    const { pubTime, setPubTime } = usePublishDialog(
      useShallow(state => ({
        pubTime: state.pubTime,
        setPubTime: state.setPubTime,
      })),
    )
    const { currentDatePickerType, defaultCurrentDatePickerType, setDefaultCurrentDatePickerType, setCurrentDatePickerType } =
      useUserStore(
        useShallow(state => ({
          currentDatePickerType: state.currentDatePickerType,
          defaultCurrentDatePickerType: state.defaultCurrentDatePickerType,
          setCurrentDatePickerType: state.setCurrentDatePickerType,
          setDefaultCurrentDatePickerType: state.setDefaultCurrentDatePickerType,
        })),
      )

    const handleCalendarChange = (date: Dayjs) => {
      setTempDate(date)
    }

    const handleConfirm = (e: React.MouseEvent) => {
      e.stopPropagation()

      // 更新时间
      if (currentDatePickerType === PublishDatePickerType.DATE) {
        setPubTime(tempDate ? tempDate.format() : undefined)
      } else {
        setPubTime(undefined)
      }

      // 直接关闭弹窗，不要在关闭前切换视图
      setMenuOpen(false)

      // 等待弹窗完全关闭后（约 300ms）再重置菜单状态
      setTimeout(() => {
        setShowMenu(true)
      }, 300)
    }

    const handleSelectPublishType = (type: PublishDatePickerType) => {
      setCurrentDatePickerType(type)
      if (type === PublishDatePickerType.Now) {
        setPubTime(undefined)
        setMenuOpen(false)
        setShowMenu(true)
      } else {
        setShowMenu(false)
      }
    }

    const handleBackToMenu = (e: React.MouseEvent) => {
      e.stopPropagation()
      setShowMenu(true)
    }

    const handleToggleFavorite = (type: PublishDatePickerType) => {
      if (defaultCurrentDatePickerType === type) {
        setDefaultCurrentDatePickerType(PublishDatePickerType.DATE)
      } else {
        setDefaultCurrentDatePickerType(type)
      }
    }

    // 禁用今天之前的日期
    const disabledDate = (current: dayjs.Dayjs) => {
      return current && current < dayjs().startOf('day')
    }

    // 禁用当前时间之前和当前时间20分钟内的时间（只精确到分钟，不考虑秒）
    const disabledDateTime = (current: dayjs.Dayjs | null) => {
      if (!current) return {}

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
            if (i < minHour) hours.push(i)
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
          } else if (selectedHour < minHour) {
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
        setTempDate(pubTimeValue)
        // 如果当前是定时发布，直接显示日期选择器；否则显示菜单
        setShowMenu(currentDatePickerType === PublishDatePickerType.Now)
      }
      // 只在弹窗状态变化时更新 menuOpen，不要在这里切换视图
      setMenuOpen(open)
    }

    // 菜单选项内容
    const menuContent = (
      <div className="min-w-[280px] p-3 flex flex-col gap-1">
        {/* 立即发布选项 */}
        <div
          className={cn(
            'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/50',
            currentDatePickerType === PublishDatePickerType.Now && 'bg-primary/10',
          )}
          onClick={() => handleSelectPublishType(PublishDatePickerType.Now)}
        >
          <div className="flex items-center gap-3 flex-1">
            <Send
              className={cn(
                'w-[18px] h-[18px] text-muted-foreground',
                currentDatePickerType === PublishDatePickerType.Now && 'text-primary',
              )}
            />
            <div className="flex flex-col gap-0.5">
              <div
                className={cn(
                  'text-sm font-medium leading-tight',
                  currentDatePickerType === PublishDatePickerType.Now && 'text-primary',
                )}
              >
                {t('buttons.publishNow')}
              </div>
              <div className="text-xs text-muted-foreground leading-tight">{t('buttons.publishNowDesc')}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={t('buttons.defaultPublishAction')}
            onClick={e => {
              e.stopPropagation()
              handleToggleFavorite(PublishDatePickerType.Now)
            }}
          >
            <Star
              className={cn(
                'w-4 h-4',
                defaultCurrentDatePickerType === PublishDatePickerType.Now
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground',
              )}
            />
          </Button>
        </div>

        {/* 定时发布选项 */}
        <div
          className={cn(
            'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/50',
            currentDatePickerType === PublishDatePickerType.DATE && 'bg-primary/10',
          )}
          onClick={() => handleSelectPublishType(PublishDatePickerType.DATE)}
        >
          <div className="flex items-center gap-3 flex-1">
            <Clock
              className={cn(
                'w-[18px] h-[18px] text-muted-foreground',
                currentDatePickerType === PublishDatePickerType.DATE && 'text-primary',
              )}
            />
            <div className="flex flex-col gap-0.5">
              <div
                className={cn(
                  'text-sm font-medium leading-tight',
                  currentDatePickerType === PublishDatePickerType.DATE && 'text-primary',
                )}
              >
                {t('buttons.setDateTime')}
              </div>
              <div className="text-xs text-muted-foreground leading-tight">{t('buttons.schedulePublishDesc')}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={t('buttons.defaultPublishAction')}
            onClick={e => {
              e.stopPropagation()
              handleToggleFavorite(PublishDatePickerType.DATE)
            }}
          >
            <Star
              className={cn(
                'w-4 h-4',
                defaultCurrentDatePickerType === PublishDatePickerType.DATE
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground',
              )}
            />
          </Button>
        </div>
      </div>
    )

    // 日期选择器内容
    const datePickerContent = (
      <div className="w-[400px]">
        <DateTimePicker
          value={tempDate}
          onChange={handleCalendarChange}
          disabledDate={disabledDate}
          disabledTime={disabledDateTime}
        />

        <div className="flex items-center justify-between py-2.5 px-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('buttons.morePostingActions')}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleConfirm} className="gap-2">
            <Check className="w-4 h-4" />
            {t('buttons.confirm')}
          </Button>
        </div>
      </div>
    )

    return (
      <div className="flex gap-0">
        <Popover open={menuOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2.5 rounded-r-none border-r-0 h-10 px-4"
              onClick={() => {
                setMenuOpen(true)
              }}
            >
              {currentDatePickerType === PublishDatePickerType.Now ? (
                <Send className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span className="flex-1 text-left">
                {currentDatePickerType === PublishDatePickerType.Now
                  ? t('buttons.publishNow')
                  : pubTimeValue
                    ? pubTimeValue.format('YYYY-MM-DD HH:mm')
                    : t('buttons.schedulePublish')}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {showMenu ? menuContent : datePickerContent}
          </PopoverContent>
        </Popover>
        <Button className="rounded-l-none h-10 px-6" disabled={loading} onClick={() => onClick()}>
          {loading && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {t('buttons.schedulePublish')}
        </Button>
      </div>
    )
  }),
)

PublishDatePicker.displayName = 'PublishDatePicker'

export default PublishDatePicker
