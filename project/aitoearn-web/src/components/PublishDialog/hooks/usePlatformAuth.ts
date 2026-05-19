/**
 * 平台授权 Hook
 * 处理各平台的授权跳转逻辑
 */

import type { SocialAccount } from '@/api/types/account.type'

import { useCallback } from 'react'
import { useChannelManagerStore } from '@/components/ChannelManager/channelManagerStore'
import { debugPublishDialog } from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'

function getPublishDialogSnapshot() {
  const state = usePublishDialog.getState()

  return {
    expandedId: state.expandedPubItem?.account.id,
    pubList: state.pubList.map(pubItem => ({
      account: pubItem.account.account,
      id: pubItem.account.id,
      imagesCount: pubItem.params.images?.length ?? 0,
      status: pubItem.account.status,
      textLength: pubItem.params.des?.length ?? 0,
      type: pubItem.account.type,
      uid: pubItem.account.uid,
      video: !!pubItem.params.video,
    })),
    selected: state.pubListChoosed.map(pubItem => ({
      account: pubItem.account.account,
      id: pubItem.account.id,
      imagesCount: pubItem.params.images?.length ?? 0,
      status: pubItem.account.status,
      textLength: pubItem.params.des?.length ?? 0,
      type: pubItem.account.type,
      uid: pubItem.account.uid,
      video: !!pubItem.params.video,
    })),
    step: state.step,
  }
}

/**
 * 平台授权 Hook
 */
export function usePlatformAuth() {
  const setOnAuthSuccess = useChannelManagerStore(state => state.setOnAuthSuccess)
  const startAuth = useChannelManagerStore(state => state.startAuth)

  /**
   * 处理离线账户头像点击，复用频道管理授权流程
   */
  const handleOfflineAvatarClick = useCallback(
    (account: SocialAccount) => {
      debugPublishDialog('platformAuth:offlineAvatarClick', {
        account: {
          account: account.account,
          groupId: account.groupId,
          id: account.id,
          status: account.status,
          type: account.type,
          uid: account.uid,
        },
        publishDialog: getPublishDialogSnapshot(),
      })
      setOnAuthSuccess((authedAccount) => {
        debugPublishDialog('offlineAuth:success', {
          authedAccount: {
            account: authedAccount.account,
            id: authedAccount.id,
            status: authedAccount.status,
            type: authedAccount.type,
            uid: authedAccount.uid,
          },
          sourceAccount: {
            account: account.account,
            id: account.id,
            status: account.status,
            type: account.type,
            uid: account.uid,
          },
          beforeSync: getPublishDialogSnapshot(),
        })
        usePublishDialog.getState().syncAccounts([
          ...usePublishDialog.getState().pubList.map(pubItem => pubItem.account),
          authedAccount,
        ])
        debugPublishDialog('offlineAuth:afterSync', getPublishDialogSnapshot())
        useChannelManagerStore.getState().setOnAuthSuccess(null)
      })
      debugPublishDialog('platformAuth:beforeStartAuth', {
        channelManager: {
          authState: useChannelManagerStore.getState().authState,
          currentView: useChannelManagerStore.getState().currentView,
          open: useChannelManagerStore.getState().open,
        },
      })
      startAuth(account.type, account.groupId)
      debugPublishDialog('platformAuth:afterStartAuthCall', {
        channelManager: {
          authState: useChannelManagerStore.getState().authState,
          currentView: useChannelManagerStore.getState().currentView,
          open: useChannelManagerStore.getState().open,
        },
      })
    },
    [setOnAuthSuccess, startAuth],
  )

  return {
    handleOfflineAvatarClick,
  }
}
