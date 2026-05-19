import type { PlatAccountInfo } from './types/plat.type'
import { PlatType } from '@/app/config/platConfig'

export function getXhsLoginStatus(account?: PlatAccountInfo | null) {
  if (!account || account.type !== PlatType.Xhs) {
    return null
  }

  return account.xhsLoginStatus ?? null
}

export function getWxSphLoginStatus(account?: PlatAccountInfo | null) {
  if (!account || account.type !== PlatType.WxSph) {
    return null
  }

  return account.wxSphLoginStatus ?? null
}
export function isPluginPlatformAccountReady(account?: PlatAccountInfo | null): account is PlatAccountInfo {
  if (!account) {
    return false
  }

  const xhsLoginStatus = getXhsLoginStatus(account)
  if (xhsLoginStatus) {
    return xhsLoginStatus.home && xhsLoginStatus.creator
  }

  const wxSphLoginStatus = getWxSphLoginStatus(account)
  if (wxSphLoginStatus) {
    return wxSphLoginStatus.channels
  }

  return true
}
