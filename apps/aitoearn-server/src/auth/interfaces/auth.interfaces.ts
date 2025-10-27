/*
 * @Author: nevin
 * @Date: 2022-01-21 14:28:19
 * @LastEditors: nevin
 * @LastEditTime: 2024-11-22 09:50:08
 * @Description: 认证相关接口
 */
export interface TokenInfo {
  readonly id: string
  readonly mail?: string
  readonly name?: string
  readonly exp?: number
}
