/*
 * @Author: niuwenzheng
 * @Date: 2020-08-24 22:51:56
 * @LastEditors: nevin
 * @LastEditTime: 2024-12-10 19:02:32
 * @Description: http业务错误返回map
 */
export interface ErrorHttpBack {
  errCode: string;
  message: string;
}

export enum ErrHttpBack {
  fail = 'fail',
  err_err_token = 'err_err_token',
  err_no_other_server = 'err_no_other_server',
  // ======== 权限相关 ========
  err_no_permission = 'err_no_permission',
  err_group = 'err_group',
  err_no_assigne_menber = 'err_no_assigne_menber',
  err_group_hasd = 'err_group_hasd',

  // ======= 用户相关 ========
  err_user_had = 'err_user_had',
  err_user_no_had = 'err_user_no_had',
  err_mail_code = 'err_mail_code',
  err_no_power_login = 'err_no_power_login',
  err_user_phone_repetition = 'err_user_phone_repetition',
  err_user_code_had = 'err_user_code_had',
  err_user_code_nohad = 'err_user_code_nohad',
  err_user_code_send_fail = 'err_user_code_send_fail',
  err_user_phone_null = 'err_user_phone_null',
  err_user_pop_code_null = 'err_user_pop_code_null',
  err_mail_send_fail = 'err_mail_send_fail',

  // ======= 认证相关 ========
  err_approve_need_only_one = 'err_approve_need_only_one',
  err_approve_idcard_invalid = 'err_approve_idcard_invalid',

  // ======= 作品相关 ========
  err_works_no_had = 'err_works_no_had',
  err_product_can_buy_one = 'err_product_can_buy_one',
  err_stamp_insufficient = 'err_stamp_insufficient',

  // ======= 任务相关 ========
  user_task_no_had = 'user_task_no_had',
  user_task_err_status = 'user_task_err_status',
  // ======= 财务相关 ========
  wallet_account_no_had = 'wallet_account_no_had',
  wallet_balance_no_enough = 'wallet_balance_no_enough',
  task_no_material = 'task_no_material',
}

export const ErrHttpBackMap: Map<string, ErrorHttpBack> = new Map([
  [ErrHttpBack.fail, { errCode: '1', message: '请求失败' }],
  // -------- 认证相关 ----------
  [
    ErrHttpBack.err_err_token,
    {
      errCode: '10010',
      message: 'token验证失败',
    },
  ],
  [
    ErrHttpBack.err_no_other_server,
    {
      errCode: '10011',
      message: '错误的服务请求',
    },
  ],
  // -------- 权限相关 ----------
  [
    ErrHttpBack.err_no_permission,
    {
      errCode: '20010',
      message: '无操作权限',
    },
  ],
  [
    ErrHttpBack.err_group,
    {
      errCode: '20011',
      message: '权限组有误',
    },
  ],
  [
    ErrHttpBack.err_no_assigne_menber,
    {
      errCode: '20012',
      message: '不能没有指定人',
    },
  ],
  [
    ErrHttpBack.err_group_hasd,
    {
      errCode: '20013',
      message: '该权限组已存在',
    },
  ],
  // -------- 用户相关 ----------
  [
    ErrHttpBack.err_no_power_login,
    {
      errCode: '40010',
      message: '您无权登录',
    },
  ],
  [
    ErrHttpBack.err_user_had,
    {
      errCode: '40011',
      message: '用户已存在',
    },
  ],
  [
    ErrHttpBack.err_user_no_had,
    {
      errCode: '40012',
      message: '用户不存在',
    },
  ],
  [
    ErrHttpBack.err_user_phone_repetition,
    {
      errCode: '40013',
      message: '用户手机号重复',
    },
  ],
  [
    ErrHttpBack.err_user_code_had,
    {
      errCode: '40019',
      message: '验证码未过期',
    },
  ],
  [
    ErrHttpBack.err_user_code_send_fail,
    {
      errCode: '40020',
      message: '验证码发送失败',
    },
  ],
  [
    ErrHttpBack.err_stamp_insufficient,
    {
      errCode: '40021',
      message: '用户余额不足',
    },
  ],
  [
    ErrHttpBack.err_user_code_nohad,
    {
      errCode: '40022',
      message: '验证码验证失败',
    },
  ],
  [
    ErrHttpBack.err_user_phone_null,
    {
      errCode: '40023',
      message: '用户手机号状态有误',
    },
  ],

  [
    ErrHttpBack.err_user_pop_code_null,
    {
      errCode: '40024',
      message: '填写的邀请码有误',
    },
  ],

  [
    ErrHttpBack.err_mail_send_fail,
    {
      errCode: '40025',
      message: '邮件发送失败',
    },
  ],

  // -------- 商品相关 ----------
  [
    ErrHttpBack.err_works_no_had,
    {
      errCode: '50010',
      message: '作品不存在',
    },
  ],
  [
    ErrHttpBack.err_product_can_buy_one,
    {
      errCode: '50011',
      message: '商品只能购买一个',
    },
  ],
  [
    ErrHttpBack.user_task_no_had,
    {
      errCode: '60010',
      message: '用户任务不存在',
    },
  ],
  [
    ErrHttpBack.user_task_err_status,
    {
      errCode: '60011',
      message: '用户任务状态错误',
    },
  ],
  // -------- 成员相关 ----------
  [
    ErrHttpBack.err_approve_need_only_one,
    {
      errCode: '70010',
      message: '认证类型只能有一个',
    },
  ],
  [
    ErrHttpBack.err_approve_idcard_invalid,
    {
      errCode: '70011',
      message: '身份证验证失败',
    },
  ],
  // -------- 财务相关 ----------
  [
    ErrHttpBack.wallet_account_no_had,
    {
      errCode: '80001',
      message: '用户钱包账户不存在',
    },
  ],
  [
    ErrHttpBack.wallet_balance_no_enough,
    {
      errCode: '80002',
      message: '用户余额不足',
    },
  ],
  // -------- 素材 ----------
  [
    ErrHttpBack.task_no_material,
    {
      errCode: '90000',
      message: '该任务没有添加素材',
    },
  ],
]);
