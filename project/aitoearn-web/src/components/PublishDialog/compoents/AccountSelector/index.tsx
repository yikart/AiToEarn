/**
 * 账户选择器组件
 * 显示所有可选账户，支持选中/取消选中
 */

import type { CSSProperties } from 'react'
import type { SocialAccount } from '@/api/accounts/account.types'
import type { PlatType } from '@/app/config/platConfig'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'

import { Plus } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { useChannelManagerStore } from '@/components/ChannelManager/channelManagerStore'
import AvatarPlat from '@/components/common/AvatarPlat'
import { useAccountClickHandler } from '@/components/PublishDialog/hooks/useAccountClickHandler'
import { getPlatformAccountBorderColor } from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePlatformInfoMap } from '@/hooks/usePlatformMetadata'
import { useAccountStore } from '@/store/account'
import { isPlatformEnabledSync } from '@/store/platformMetadata'

interface AccountSelectorProps {
  // 外部回调
  onOfflineClick: (account: SocialAccount) => void
  // 可选的账户列表（用于频道筛选）
  pubList?: PubItem[]
}

type AccountBorderStyle = CSSProperties & {
  '--publish-account-platform-border': string
}

function getPlatformAccountBorderStyle(platType: PlatType): AccountBorderStyle {
  return {
    '--publish-account-platform-border': getPlatformAccountBorderColor(platType),
  }
}

/**
 * 账户选择器组件
 */
export const AccountSelector = memo(
  ({ onOfflineClick, pubList: externalPubList }: AccountSelectorProps) => {
    const { t } = useTransClient('publish')
    const platformInfoMap = usePlatformInfoMap()

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
    const visiblePubList = useMemo(
      () => pubList.filter(pubItem => platformInfoMap.has(pubItem.account.type) && isPlatformEnabledSync(pubItem.account.type)),
      [platformInfoMap, pubList],
    )

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
        {visiblePubList.map((pubItem) => {
          const platConfig = platformInfoMap.get(pubItem.account.type)
          if (!platConfig)
            return null
          const isChoosed = pubListChoosed.find(v => v.account.id === pubItem.account.id)
          const isOffline = pubItem.account.status === 0
          const platformBorderStyle = getPlatformAccountBorderStyle(pubItem.account.type)

          return (
            <TooltipProvider key={pubItem.account.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`border-2 rounded-full ${
                      isChoosed
                        ? 'border-(--publish-account-platform-border) active:border-(--publish-account-platform-border)'
                        : 'border-transparent'
                    }`}
                    style={platformBorderStyle}
                    data-testid={`publish-account-item-${pubItem.account.id}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      // 离线账户的点击由头像容器处理，这里不处理
                      if (isOffline) {
                        return
                      }
                      handleAccountClick(pubItem)
                    }}
                  >
                    {/* 账号头像：离线显示遮罩并禁用 */}
                    <div className="relative flex">
                      <AvatarPlat
                        className={`cursor-pointer p-[1px] ${
                          isChoosed && !isOffline
                            ? '[&>img]:grayscale-0'
                            : '[&>img]:grayscale hover:[&>img]:grayscale-0'
                        }`}
                        account={pubItem.account}
                        size="large"
                        disabled={isOffline || !isChoosed}
                      />
                      {isOffline && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            // 离线账户统一复用频道管理授权流程
                            onOfflineClick(pubItem.account)
                          }}
                          className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center text-white text-xs font-semibold pointer-events-auto cursor-pointer"
                        >
                          {t('badges.offline')}
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                {isOffline && (
                  <TooltipContent>
                    {t('tips.accountOffline')}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}

        {visiblePubList.length > 0 && (
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
