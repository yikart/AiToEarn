import type { PluginPlatformType } from '@/store/plugin/types/baseTypes'

export interface PlatAccountInfo {
  type: PluginPlatformType
  loginCookie: string
  uid: string
  account: string
  avatar: string
  nickname: string
  fansCount?: number
}
