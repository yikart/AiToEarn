import type { PluginAccountPlatformType } from '@/store/plugin/types/baseTypes'

export interface PlatAccountInfo {
  type: PluginAccountPlatformType
  loginCookie: string
  uid: string
  account: string
  avatar: string
  nickname: string
  fansCount?: number
}
