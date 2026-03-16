/**
 * 平台授权 Hook
 * 处理各平台的授权跳转逻辑
 */

import type { SocialAccount } from '@/api/types/account.type'
import type { AccountGroup } from '@/store/account'

import { useCallback } from 'react'
import { useChannelManagerStore } from '@/components/ChannelManager'
import { toast } from '@/lib/toast'

interface UsePlatformAuthParams {
  accountGroupList: AccountGroup[]
  getAccountList: () => Promise<void>
  onFacebookAuthSuccess: () => void
  t: (key: string, params?: Record<string, string>) => string
}

/**
 * 平台授权 Hook
 */
export function usePlatformAuth({
  accountGroupList,
  getAccountList,
  onFacebookAuthSuccess,
  t,
}: UsePlatformAuthParams) {
  /**
   * 处理离线账户头像点击，直接跳转到对应平台授权页面
   */
  const handleOfflineAvatarClick = useCallback(
    async (account: SocialAccount) => {
      const platform = account.type
      const targetSpaceId = account.groupId

      try {
        const startAuth = useChannelManagerStore(state => state.startAuth)
        startAuth(platform, targetSpaceId)
      }
      catch (error) {
        console.error(t('messages.authFailed'), error)
        toast.error(t('messages.authFailedRetry'))
      }
    },
    [accountGroupList, getAccountList, onFacebookAuthSuccess, t],
  )

  return {
    handleOfflineAvatarClick,
  }
}
