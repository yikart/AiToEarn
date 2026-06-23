import type { UserInfo } from '@/store/user'

// Source: types/auth.ts

/**
 * SendEmailCodeParams 请求参数。
 */
export interface SendEmailCodeParams {
  mail: string
}

/**
 * EmailCodeLoginParams 请求参数。
 */
export interface EmailCodeLoginParams {
  mail: string
  code: string
  inviteCode?: string
}

/**
 * SendPhoneCodeParams 请求参数。
 */
export interface SendPhoneCodeParams {
  phone: string
}

/**
 * PhoneCodeLoginParams 请求参数。
 */
export interface PhoneCodeLoginParams {
  phone: string
  code: string
}

/**
 * CodeLoginResponse 响应数据。
 */
export interface CodeLoginResponse {
  token?: string
  userInfo?: UserInfo
}

// Source: auth/auth.api.ts inline types
// Source: apiReq.ts

/**
 * LoginResponse 响应数据。
 */
export interface LoginResponse {
  token?: string
  userInfo?: UserInfo
}

/**
 * GoogleLoginParams 请求参数。
 */
export interface GoogleLoginParams {
  clientId: string
  credential: string
  placeId?: string
}

/**
 * 鉴权请求选项。
 */
export interface AuthRequestOptions {
  silent?: boolean
}

/**
 * 更新用户信息请求参数。
 */
export interface UpdateUserInfoParams {
  name: string
  avatar?: string
}
