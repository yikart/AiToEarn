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
