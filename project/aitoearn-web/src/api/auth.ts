/**
 * auth.ts - 认证相关 API 方法
 */

import type {
  CodeLoginResponse,
  EmailCodeLoginParams,
  PhoneCodeLoginParams,
  SendEmailCodeParams,
  SendPhoneCodeParams,
} from '@/api/types/auth'
import http from '@/utils/request'

/** 发送邮箱验证码 */
export function sendEmailCodeApi(data: SendEmailCodeParams) {
  return http.post<null>('login/mail', data)
}

/** 邮箱验证码登录 */
export function emailCodeLoginApi(data: EmailCodeLoginParams) {
  return http.post<CodeLoginResponse>('login/mail/verify', data)
}

/** 发送手机验证码 */
export function sendPhoneCodeApi(data: SendPhoneCodeParams) {
  return http.post<null>('login/phone', data)
}

/** 手机验证码登录 */
export function phoneCodeLoginApi(data: PhoneCodeLoginParams) {
  return http.post<CodeLoginResponse>('login/phone/verify', data)
}
