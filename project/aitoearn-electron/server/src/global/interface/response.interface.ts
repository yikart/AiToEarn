/*
 * @Author: nevin
 * @Date: 2022-01-20 16:41:36
 * @LastEditors: nevin
 * @LastEditTime: 2024-06-17 19:37:02
 * @Description: 请求返回接口
 */

export interface HttpResult<T> {
  data: T; // 数据
  msg: string; // 信息
  code: 0 | string; // 自定义code
  url: string; // 错误的url地址
}
