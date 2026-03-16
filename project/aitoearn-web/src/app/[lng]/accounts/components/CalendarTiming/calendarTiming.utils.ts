import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { getDayjsLocale } from '@/lib/i18n/languageConfig'

dayjs.extend(utc)
dayjs.extend(timezone)

// 日历国际化
export function getFullCalendarLang(lang: string) {
  return getDayjsLocale(lang)
}

// 封装classNames切换方法
export function getTransitionClassNames(direction: 'left' | 'right' | 'fade') {
  if (direction === 'left') {
    return {
      enter: 'slideLeftEnter',
      enterActive: 'slideLeftEnterActive',
      exit: 'slideLeftExit',
      exitActive: 'slideLeftExitActive',
    }
  }
  else if (direction === 'right') {
    return {
      enter: 'slideRightEnter',
      enterActive: 'slideRightEnterActive',
      exit: 'slideRightExit',
      exitActive: 'slideRightExitActive',
    }
  }
  else {
    // fade 动画
    return {
      enter: 'fadeEnter',
      enterActive: 'fadeEnterActive',
      exit: 'fadeExit',
      exitActive: 'fadeExitActive',
    }
  }
}

// 获取UTC days
export function getUtcDays(date: dayjs.ConfigType) {
  return dayjs(date).utc()
}

// 获取当前时区的days
export function getDays(date?: dayjs.ConfigType) {
  return dayjs(date)
}

/**
 * 获取指定日期所在周的开始和结束日期
 * @param date 基准日期
 * @returns [周开始日期, 周结束日期]
 */
export function getWeekDateRange(date: Date): [Date, Date] {
  const start = dayjs(date).startOf('week').toDate()
  const end = dayjs(date).endOf('week').toDate()
  return [start, end]
}

/**
 * 获取指定日期所在月的可见日期范围（包含前后补齐的周）
 * 与 FullCalendar dayGridMonth 视图的日期范围一致
 * @param date 基准日期
 * @returns [月视图开始日期, 月视图结束日期]
 */
export function getMonthDateRange(date: Date): [Date, Date] {
  // 获取当月第一天
  const monthStart = dayjs(date).startOf('month')
  // 获取当月最后一天
  const monthEnd = dayjs(date).endOf('month')

  // FullCalendar 月视图会显示完整的周，需要包含前后补齐的日期
  // 月视图开始：当月第一天所在周的周日
  const viewStart = monthStart.startOf('week').toDate()
  // 月视图结束：当月最后一天所在周的周六
  const viewEnd = monthEnd.endOf('week').toDate()

  return [viewStart, viewEnd]
}
