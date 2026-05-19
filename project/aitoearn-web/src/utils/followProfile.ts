import type { SocialAccount } from '@/api/types/account.type'
import type { PlatType } from '@/app/config/platConfig'
import { PlatType as AccountPlatType } from '@/app/config/platConfig'

export interface FollowProfileSource {
  platform: PlatType
  targetUid?: string
  targetAccountId?: string
  targetProfileUrl?: string
}

function normalizeAccountPath(account?: string) {
  return account?.trim().replace(/^@/, '').replace(/^\/+/, '')
}

export function canAutoBuildFollowProfileUrl(platform: PlatType) {
  return platform === AccountPlatType.Xhs || platform === AccountPlatType.Tiktok
}

export function buildFollowProfileUrl(account: Pick<SocialAccount, 'type' | 'uid' | 'account'>) {
  switch (account.type) {
    case AccountPlatType.Xhs:
      return account.uid ? `https://www.xiaohongshu.com/user/profile/${account.uid}` : ''
    case AccountPlatType.Tiktok: {
      const path = normalizeAccountPath(account.account)
      return path ? `https://www.tiktok.com/${path}` : ''
    }
    default:
      return ''
  }
}

export function resolveFollowProfileUrl(data?: FollowProfileSource | null) {
  if (!data) {
    return ''
  }

  const manualUrl = data.targetProfileUrl?.trim()
  if (manualUrl) {
    return manualUrl
  }

  return buildFollowProfileUrl({
    type: data.platform,
    uid: data.targetUid ?? '',
    account: data.targetAccountId ?? '',
  })
}
