import type { PluginPlatformType } from './types/baseTypes'
import type { PlatAccountInfo } from './types/plat.type'
import type { SocialAccount } from '@/api/accounts/account.types'
import { AccountStatus } from '@/app/config/accountConfig'
import { PlatType } from '@/app/config/platConfig'
import { PLUGIN_SUPPORTED_PLATFORMS } from './types/baseTypes'

export type PluginAccountStatusMap = Partial<Record<PluginPlatformType, PlatAccountInfo | null>>

export function isPluginSupportedPlatform(platform: PlatType): platform is PluginPlatformType {
  return PLUGIN_SUPPORTED_PLATFORMS.includes(platform as PluginPlatformType)
}

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

export function mergePluginAccountStatus(
  accountList: SocialAccount[],
  platformAccounts: PluginAccountStatusMap,
) {
  const accountMap = new Map<string, SocialAccount>()

  const mergedAccountList = accountList.map((account) => {
    if (!isPluginSupportedPlatform(account.type)) {
      accountMap.set(account.id, account)
      return account
    }

    if (!Object.hasOwn(platformAccounts, account.type)) {
      accountMap.set(account.id, account)
      return account
    }

    const platformAccount = platformAccounts[account.type]
    const shouldBeOnline = !!platformAccount
      && isPluginPlatformAccountReady(platformAccount)
      && platformAccount.uid === account.uid
    const status = shouldBeOnline ? AccountStatus.USABLE : AccountStatus.DISABLE
    const mergedAccount = account.status === status ? account : { ...account, status }

    accountMap.set(mergedAccount.id, mergedAccount)
    return mergedAccount
  })

  return {
    accountList: mergedAccountList,
    accountMap,
  }
}
