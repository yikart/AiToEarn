/*
 * @Author: nevin
 * @Date: 2025-02-11 19:02:37
 * @LastEditTime: 2025-03-31 11:39:35
 * @LastEditors: nevin
 * @Description: 时间工具类
 */
// 获取时间戳,10位或13位
export function getNowTimeStamp(is13Bit: boolean = false): number {
  const time = new Date().getTime();
  return is13Bit ? time : Math.floor(time / 1000);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
