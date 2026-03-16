/**
 * auth.ts - 认证相关类型定义
 */

import type { UserInfo } from '@/store/user'

/** 发送邮箱验证码参数 */
export interface SendEmailCodeParams {
  mail: string
}

/** 邮箱验证码登录参数 */
export interface EmailCodeLoginParams {
  mail: string
  code: string
  inviteCode?: string
}

/** 发送手机验证码参数 */
export interface SendPhoneCodeParams {
  phone: string
}

/** 手机验证码登录参数 */
export interface PhoneCodeLoginParams {
  phone: string
  code: string
}

/** 验证码登录响应 */
export interface CodeLoginResponse {
  token?: string
  userInfo?: UserInfo
}
