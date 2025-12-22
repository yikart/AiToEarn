/**
 * CalendarToolbar 组件
 *
 * 功能描述: 日历工具栏 (Row 2 - Calendar Controls Bar)
 * - 左侧: 上月/下月按钮 + 当前月份显示 + 今天按钮 (仅日历模式显示)
 * - 右侧: 日历/列表模式切换标签
 */

'use client'

import {
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { useGetClientLng } from '@/hooks/useSystem'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface ICalendarToolbarProps {
  activeMode: 'calendar' | 'list'
  onModeChange: (mode: 'calendar' | 'list') => void
  currentDate: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

const CalendarToolbar = memo<ICalendarToolbarProps>(
  ({ activeMode, onModeChange, currentDate, onPrev, onNext, onToday }) => {
    const { t } = useTransClient('account')
    const lng = useGetClientLng()

    // 根据语言设置 dayjs locale 并格式化日期
    const formattedDate = useMemo(() => {
      const locale = lng === 'zh-CN' ? 'zh-cn' : 'en'
      dayjs.locale(locale)
      return dayjs(currentDate).format('MMMM YYYY')
    }, [currentDate, lng])

    return (
      <div className="h-14 flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        {/* 左侧: 日历导航控制 (仅在日历模式显示) */}
        <div className="flex items-center gap-3">
          {activeMode === 'calendar' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrev}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-base font-semibold text-foreground min-w-[120px] text-center">
                {formattedDate}
              </div>
              <Button
                variant="outline"
                onClick={onToday}
                className="h-8"
              >
                {t('today')}
              </Button>
            </>
          )}
        </div>

        {/* 右侧: 模式切换标签 */}
        <div className="flex items-center gap-3">
          <Tabs value={activeMode} onValueChange={value => onModeChange(value as 'calendar' | 'list')}>
            <TabsList>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarOutlined />
                {t('calendarModeTab')}
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5">
                <UnorderedListOutlined />
                {t('listModeTab')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    )
  },
)

CalendarToolbar.displayName = 'CalendarToolbar'

export default CalendarToolbar
