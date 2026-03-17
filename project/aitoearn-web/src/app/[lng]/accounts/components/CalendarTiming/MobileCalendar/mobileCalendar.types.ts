/**
 * MobileCalendar 类型定义
 *
 * 功能描述: 移动端日历组件的类型定义
 */

import type { PublishRecordItem } from '@/api/plat/types/publish.types'

/** 视图类型 */
export type ViewType = 'week' | 'month'

/** MobileCalendar 主组件 Props */
export interface IMobileCalendarProps {
  /** 点击添加任务时的回调 */
  onClickPub: (date: string) => void
}

/** MobileCalendarHeader Props */
export interface IMobileCalendarHeaderProps {
  /** 当前显示的日期 */
  currentDate: Date
  /** 当前视图类型 */
  viewType: ViewType
  /** 日期改变回调 */
  onDateChange: (date: Date) => void
  /** 视图切换回调 */
  onViewTypeChange: (type: ViewType) => void
  /** 点击今天按钮回调 */
  onToday: () => void
}

/** MobileWeekView Props */
export interface IMobileWeekViewProps {
  /** 当前周的基准日期 */
  currentDate: Date
  /** 选中的日期 */
  selectedDate: Date
  /** 选择日期回调 */
  onDateSelect: (date: Date) => void
  /** 周切换回调 */
  onWeekChange: (direction: 'prev' | 'next') => void
  /** 发布记录数据 */
  recordMap: Map<string, PublishRecordItem[]>
}

/** MobileMonthView Props */
export interface IMobileMonthViewProps {
  /** 当前月的基准日期 */
  currentDate: Date
  /** 选中的日期 */
  selectedDate: Date
  /** 选择日期回调 */
  onDateSelect: (date: Date) => void
  /** 发布记录数据 */
  recordMap: Map<string, PublishRecordItem[]>
}

/** MobileDayRecords Props */
export interface IMobileDayRecordsProps {
  /** 选中的日期 */
  selectedDate: Date
  /** 当天的发布记录 */
  records: PublishRecordItem[]
  /** 加载状态 */
  loading: boolean
  /** 添加任务回调 */
  onClickPub: (date: string) => void
}
