/**
 * 账户选择器组件
 * 显示所有可选账户，支持选中/取消选中
 */

import type { SocialAccount } from '@/api/types/account.type'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'

import { Plus } from 'lucide-react'
import { memo, useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import { useChannelManagerStore } from '@/components/ChannelManager/channelManagerStore'
import { useAccountClickHandler } from '@/components/PublishDialog/hooks/useAccountClickHandler'
import { debugPublishDialog } from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAccountStore } from '@/store/account'

function getPubItemDebugInfo(pubItem: PubItem) {
  return {
    account: pubItem.account.account,
    id: pubItem.account.id,
    imagesCount: pubItem.params.images?.length ?? 0,
    status: pubItem.account.status,
    textLength: pubItem.params.des?.length ?? 0,
    type: pubItem.account.type,
    uid: pubItem.account.uid,
    video: !!pubItem.params.video,
  }
}

interface AccountSelectorProps {
  // 外部回调
  onOfflineClick: (account: SocialAccount) => void
  // 可选的账户列表（用于频道筛选）
  pubList?: PubItem[]
}

/**
 * 账户选择器组件
 */
export const AccountSelector = memo(
  ({ onOfflineClick, pubList: externalPubList }: AccountSelectorProps) => {
    const { t } = useTransClient('publish')

    // ============ 从 Store 获取状态 ============

    const {
      pubList: storePubList,
      pubListChoosed,
      step,
      setStep,
      setExpandedPubItem,
      setPubListChoosed,
    } = usePublishDialog(
      useShallow(state => ({
        pubList: state.pubList,
        pubListChoosed: state.pubListChoosed,
        step: state.step,
        setStep: state.setStep,
        setExpandedPubItem: state.setExpandedPubItem,
        setPubListChoosed: state.setPubListChoosed,
      })),
    )

    // 使用外部传入的 pubList 或 store 中的 pubList
    // 注意：如果 externalPubList 是空数组，也应该使用它（表示筛选后没有账户）
    // 只有当 externalPubList 是 undefined 时才使用 storePubList
    const pubList = externalPubList !== undefined ? externalPubList : storePubList

    // ============ Custom Hooks ============

    const { handleAccountClick } = useAccountClickHandler({
      pubListChoosed,
      step,
      setStep,
      setExpandedPubItem,
      setPubListChoosed,
    })

    const { openConnectList, setOnAuthSuccess } = useChannelManagerStore(
      useShallow(state => ({
        openConnectList: state.openConnectList,
        setOnAuthSuccess: state.setOnAuthSuccess,
      })),
    )

    const handleChannelAuthSuccess = useCallback((account: SocialAccount) => {
      const {
        pubList: currentPubList,
        syncAccounts,
      } = usePublishDialog.getState()

      debugPublishDialog('channelAuth:success', {
        authedAccount: {
          account: account.account,
          id: account.id,
          status: account.status,
          type: account.type,
          uid: account.uid,
        },
      })
      syncAccounts([...currentPubList.map(pubItem => pubItem.account), account])
      useChannelManagerStore.getState().setOnAuthSuccess(null)
    }, [])

    useEffect(() => {
      return () => {
        const channelManagerState = useChannelManagerStore.getState()
        if (channelManagerState.onAuthSuccess === handleChannelAuthSuccess) {
          channelManagerState.setOnAuthSuccess(null)
        }
      }
    }, [handleChannelAuthSuccess])

    const handleAddChannelClick = useCallback(() => {
      setOnAuthSuccess(handleChannelAuthSuccess)
      openConnectList(useAccountStore.getState().activeSpaceId)
    }, [handleChannelAuthSuccess, openConnectList, setOnAuthSuccess])

    // ============ Render ============

    return (
      <div className="flex flex-wrap items-center gap-2.5" data-testid="publish-account-selector">
        {pubList.map((pubItem) => {
          const platConfig = AccountPlatInfoMap.get(pubItem.account.type)!
          const isChoosed = pubListChoosed.find(v => v.account.id === pubItem.account.id)
          const isOffline = pubItem.account.status === 0
          const isPcNotSupported = platConfig && platConfig.pcNoThis === true

          return (
            <TooltipProvider key={pubItem.account.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`border-2 rounded-full transition-all duration-300 ${
                      isChoosed ? '' : 'border-transparent'
                    } ${isChoosed ? 'active:border-primary' : ''}`}
                    style={{
                      borderColor: isChoosed ? platConfig.themeColor : 'transparent',
                    }}
                    data-testid={`publish-account-item-${pubItem.account.id}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      // 离线账户的点击由头像容器处理，这里不处理
                      if (isOffline) {
                        return
                      }
                      if (isPcNotSupported) {
                        return
                      }
                      handleAccountClick(pubItem)
                    }}
                  >
                    {/* 账号头像：离线、PC不支持或区域限制显示遮罩并禁用 */}
                    <div className="relative flex">
                      <AvatarPlat
                        className={`cursor-pointer transition-all duration-300 p-[1px] ${
                          isChoosed && !isOffline && !isPcNotSupported
                            ? '[&>img]:grayscale-0'
                            : '[&>img]:grayscale hover:[&>img]:grayscale-0'
                        }`}
                        account={pubItem.account}
                        size="large"
                        disabled={isOffline || !isChoosed || isPcNotSupported}
                      />
                      {isOffline && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            const publishDialogState = usePublishDialog.getState()
                            debugPublishDialog('accountSelector:offlineClick', {
                              clicked: getPubItemDebugInfo(pubItem),
                              expandedId: publishDialogState.expandedPubItem?.account.id,
                              pubList: publishDialogState.pubList.map(getPubItemDebugInfo),
                              selected: publishDialogState.pubListChoosed.map(getPubItemDebugInfo),
                              step: publishDialogState.step,
                            })
                            // 离线账户统一复用频道管理授权流程
                            onOfflineClick(pubItem.account)
                            debugPublishDialog('accountSelector:offlineClickAfterOnOfflineClick', {
                              authState: useChannelManagerStore.getState().authState,
                              channelManagerOpen: useChannelManagerStore.getState().open,
                              currentView: useChannelManagerStore.getState().currentView,
                              onAuthSuccessRegistered: !!useChannelManagerStore.getState().onAuthSuccess,
                            })
                          }}
                          className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center text-white text-xs font-semibold pointer-events-auto cursor-pointer"
                        >
                          {t('badges.offline')}
                        </div>
                      )}
                      {isPcNotSupported && !isOffline && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-semibold pointer-events-none text-center leading-tight">
                          APP
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                {(isPcNotSupported || isOffline) && (
                  <TooltipContent>
                    {isPcNotSupported ? t('tips.pcNotSupported') : t('tips.accountOffline')}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}

        {pubList.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t('tips.addChannel')}
                  className="h-11 w-11 shrink-0 cursor-pointer rounded-full border-2 border-dashed border-border bg-card p-0 text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
                  data-testid="publish-add-channel-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddChannelClick()
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('tips.addChannel')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  },
)

AccountSelector.displayName = 'AccountSelector'

export default AccountSelector
