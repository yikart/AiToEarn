import type { SocialAccount } from '@/api/types/account.type'
import { PlatType } from '@/app/config/platConfig'

const temporaryUnavailableFansPlatforms = new Set<PlatType>([
  PlatType.Douyin,
  PlatType.WxGzh,
])

export function calcSocialAccountsTotalFans(accounts: Array<Pick<SocialAccount, 'fansCount'>>) {
  return accounts.reduce((sum, account) => sum + (account.fansCount || 0), 0)
}

export function shouldShowFansSyncNotice(type: PlatType, fansCount: number | null | undefined) {
  return temporaryUnavailableFansPlatforms.has(type) && fansCount === 0
}
