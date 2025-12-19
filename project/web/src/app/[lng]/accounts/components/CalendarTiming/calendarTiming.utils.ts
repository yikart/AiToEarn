import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

// 日历国际化
export function getFullCalendarLang(lang: string) {
  switch (lang) {
    case 'zh-CN':
      return 'zh-cn'
    case 'en':
      return 'en-gb'
  }
  return 'en-gb'
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
