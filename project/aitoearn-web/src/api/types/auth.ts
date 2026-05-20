/**
 * auth.ts - 认证相关类型定义
 */

import type { UserInfo } from '@/store/user'

export interface PasswordAuthParams {
  account: string
  password: string
  inviteCode?: string
}

export interface PasswordAuthResponse {
  token?: string
  userInfo?: UserInfo
}
