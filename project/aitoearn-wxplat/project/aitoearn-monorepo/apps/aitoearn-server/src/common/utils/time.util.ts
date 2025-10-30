/*
 * @Author: nevin
 * @Date: 2024-07-22 17:57:25
 * @LastEditTime: 2024-07-22 17:59:08
 * @LastEditors: nevin
 * @Description:
 */
// 获取今天的0点（午夜）时间
export function getTodayMidnight(): Date {
  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)

  return todayMidnight
}

// 获取今天的24点（实际上是明天的0点）
export function getTodayEnd(): Date {
  const todayEnd = new Date()
  todayEnd.setDate(todayEnd.getDate() + 1)
  todayEnd.setHours(0, 0, 0, 0)
  return todayEnd
}

// 获取当前的秒级时间戳
export function getCurrentTimestamp(): number {
  return Math.floor(new Date().getTime() / 1000)
}
