/*
 * @Author: nevin
 * @Date: 2022-03-17 16:05:38
 * @LastEditors: nevin
 * @LastEditTime: 2025-03-03 18:59:47
 * @Description: 表格状数据
 */
export interface CorrectResponse<T> {
  list: T[]
  pageSize: number
  pageNo: number
  count: number
}
