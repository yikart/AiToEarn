/**
 * 格式化工具函数
 */

import dayjs from 'dayjs'

/**
 * 格式化数字，大数字显示为 k/w 形式
 * @example formatNumber(1234) -> "1.2k"
 * @example formatNumber(12345) -> "1.2w"
 */
export function formatNumber(value: number): string {
  if (!value)
    return `${value ?? 0}`

  if (value >= 10000) {
    return `${(value / 10000).toFixed(1).replace(/\.0$/, '')}w`
  }
  else if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return value.toString()
}

/**
 * 格式化 AI 推荐分，保留最多 1 位小数
 */
export function formatRecommendationScore(score?: number | null) {
  if (typeof score !== 'number' || !Number.isFinite(score))
    return null

  return Number.isInteger(score)
    ? score.toString()
    : score.toFixed(1).replace(/\.0$/, '')
}

/**
 * 格式化文件大小，自动使用 B / KB / MB / GB / TB 单位
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0)
    return '0 B'

  const unitBase = 1024
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(unitBase)),
    units.length - 1,
  )
  const value = bytes / unitBase ** unitIndex
  const formattedValue = Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/\.?0+$/, '')

  return `${formattedValue} ${units[unitIndex]}`
}

export interface DurationParts {
  hours: number
  minutes: number
  seconds: number
}

/** 将秒数拆分为小时、分钟、秒，小时不按天折算 */
export function getDurationPartsFromSeconds(seconds: number): DurationParts {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return {
    hours: Math.floor(safeSeconds / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
    seconds: safeSeconds % 60,
  }
}

/**
 * 格式化日期
 * @param date 日期
 * @param format 格式，默认 'YYYY-MM-DD HH:mm'
 */
export function formatDate(
  date: string | number | Date,
  format: string = 'YYYY-MM-DD HH:mm',
): string {
  return dayjs(date).format(format)
}

/**
 * 格式化相对时间。
 */
export function formatRelativeTime(date: Date | number): string {
  const now = new Date()
  const target = date instanceof Date ? date : new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60)
    return 'Just now'

  if (diffMin < 60)
    return `${diffMin}m ago`

  if (diffHour < 24)
    return `${diffHour}h ago`

  if (diffDay < 7)
    return `${diffDay}d ago`

  return dayjs(target).format('YYYY-MM-DD')
}

/**
 * 格式化时间。
 */
export function formatTime(time: string | number | Date, format: string = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs(time).format(format)
}

/**
 * 将秒数转换为 hh:mm:ss 格式的字符串。
 */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const padNumber = (value: number) => value.toString().padStart(2, '0')

  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(secs)}`
}

/**
 * 根据输入数值返回 k/w 简写描述。
 */
export function describeNumber(value: number): string {
  if (!value)
    return `${value ?? 0}`

  if (value >= 10000)
    return `${(value / 10000).toFixed(2).replace(/\.?0+$/, '')}w`

  if (value >= 1000)
    return `${(value / 1000).toFixed(2).replace(/\.?0+$/, '')}k`

  return value.toString()
}
