import type { AuthRequestOptions, CodeLoginResponse, EmailCodeLoginParams, GoogleLoginParams, LoginResponse, PhoneCodeLoginParams, SendEmailCodeParams, SendPhoneCodeParams, UpdateUserInfoParams } from './auth.types'
import type { UserInfo } from '@/store/user'
import type { RequestOptions } from '@/utils/request'
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

/**
 * Get Current User Information
 * Retrieve the profile of the authenticated user.
 */
export function getUserInfoApi(options?: RequestOptions & AuthRequestOptions) {
  const { silent, ...requestOptions } = options ?? {}
  return http.get<UserInfo>('user/mine', undefined, silent, requestOptions)
}

/**
 * Update User Information
 * Update the profile of the authenticated user.
 */
export function updateUserInfoApi(data: UpdateUserInfoParams) {
  return http.put<UserInfo>('user/info/update', data)
}

/**
 * Google 登录
 * 使用 Google 凭证登录用户。
 */
export function googleLoginApi(data: GoogleLoginParams) {
  return http.post<LoginResponse>('login/google', data)
}
