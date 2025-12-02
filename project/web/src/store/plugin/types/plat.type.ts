import type { PlatformType } from '@/store/plugin/types/types'

export interface PlatAccountInfo {
  type: PlatformType
  loginCookie: string
  uid: string
  account: string
  avatar: string
  nickname: string
  fansCount?: number
}
