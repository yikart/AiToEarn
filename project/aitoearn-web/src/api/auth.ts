/**
 * auth.ts - 认证相关 API 方法
 */

import type {
  PasswordAuthParams,
  PasswordAuthResponse,
} from '@/api/types/auth'
import http from '@/utils/request'

/** 账号密码注册 */
export function passwordRegisterApi(data: PasswordAuthParams) {
  return http.post<PasswordAuthResponse>('login/password/register', data)
}

/** 账号密码登录 */
export function passwordLoginApi(data: PasswordAuthParams) {
  return http.post<PasswordAuthResponse>('login/password', data)
}
