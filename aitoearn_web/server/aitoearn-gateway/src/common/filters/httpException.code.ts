/*
 * @Author: niuwenzheng
 * @Date: 2020-08-24 22:51:56
 * @LastEditors: nevin
 * @LastEditTime: 2024-12-10 19:02:32
 * @Description: http业务错误返回map
 */
export interface ErrorHttpBack {
  errCode: number
  message: string
}

export enum ErrHttpBack {
  fail = 1,
  // ---- 用户 ---
  err_user_had = 10001000,
  err_user_no_had = 10001001,
  err_no_power_login = 10001002,
  err_mail_send_fail = 10001003,
  err_user_code_nohad = 10001004,
  err_user_pop_code_null = 10001005,
  err_user_status = 10001006,
  err_user_password = 10001007,
}

export const ErrHttpBackMap: Map<ErrHttpBack, ErrorHttpBack> = new Map([
  [ErrHttpBack.fail, { errCode: ErrHttpBack.fail, message: '请求失败' }],
  // ---- 用户 ---
  [
    ErrHttpBack.err_user_had,
    { errCode: ErrHttpBack.err_user_had, message: '用户已存在' },
  ],
  [
    ErrHttpBack.err_user_no_had,
    { errCode: ErrHttpBack.err_user_no_had, message: '用户不存在' },
  ],
  [
    ErrHttpBack.err_no_power_login,
    { errCode: ErrHttpBack.err_no_power_login, message: '没有权利登陆' },
  ],
  [
    ErrHttpBack.err_user_password,
    { errCode: ErrHttpBack.err_user_password, message: '密码错误' },
  ],
  [
    ErrHttpBack.err_user_status,
    { errCode: ErrHttpBack.err_user_status, message: '用户状态无效' },
  ],
  [ErrHttpBack.err_mail_send_fail, { errCode: 1, message: '邮件发送失败' }],
  [
    ErrHttpBack.err_user_code_nohad,
    { errCode: 1, message: '用户验证码不存在' },
  ],
  [
    ErrHttpBack.err_user_pop_code_null,
    { errCode: 1, message: '用户推广码不存在' },
  ],
])
