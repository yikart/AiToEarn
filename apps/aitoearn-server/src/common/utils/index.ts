/*
 * @Author: nevin
 * @Date: 2024-07-04 15:15:28
 * @LastEditTime: 2024-11-26 18:39:44
 * @LastEditors: nevin
 * @Description: 工具
 */

/**
 * 封装一个非阻塞的sleep函数，返回一个Promise对象。
 * @param {number} milliseconds - 指定延迟的毫秒数。
 * @returns {Promise<void>} - 一个Promise，将在指定延迟后resolve。
 */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

// 封装一个获取随机的任意个数字或字母的字符串的函数
export function getRandomString(length: number, onlyNum = false): string {
  const chars = onlyNum
    ? '1234567890'
    : 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 获取某一天 UTC 的起止时间
 * @param date 格式为 "2025-07-25"
 * @returns { start: Date, end: Date }
 */
export function getDayRangeUTC(date: string): { start: Date, end: Date } {
  const start = new Date(`${date} T00:00:00.000Z`)
  const end = new Date(`${date} T23:59:59.999Z`)
  return { start, end }
}
