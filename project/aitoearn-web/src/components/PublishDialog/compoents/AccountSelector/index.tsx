/**
 * 账户选择器组件
 * 显示所有可选账户，支持选中/取消选中
 */

import type { SocialAccount } from '@/api/types/account.type'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'

import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'
import { useAccountClickHandler } from '@/components/PublishDialog/hooks/useAccountClickHandler'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface AccountSelectorProps {
  // 外部回调
  onOfflineClick: (account: SocialAccount) => void
  onPcNotSupportedClick: (platformName: string) => void
  // 可选的账户列表（用于频道筛选）
  pubList?: PubItem[]
}

/**
 * 账户选择器组件
 */
export const AccountSelector = memo(
  ({ onOfflineClick, onPcNotSupportedClick, pubList: externalPubList }: AccountSelectorProps) => {
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

    // ============ Render ============

    return (
      <div className="flex flex-wrap gap-2.5" data-testid="publish-account-selector">
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
                        onPcNotSupportedClick(platConfig?.name || '')
                        return
                      }
                      handleAccountClick(pubItem)
                    }}
                  >
                    {/* 账号头像：离线、PC不支持显示遮罩并禁用 */}
                    <div className="relative">
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
                            // 小红书平台即使是掉线状态也显示下载App弹窗
                            if (pubItem.account.type === PlatType.Xhs) {
                              onPcNotSupportedClick(t('rednote'))
                              return
                            }
                            // 其他平台的离线账户触发授权跳转
                            onOfflineClick(pubItem.account)
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
      </div>
    )
  },
)

AccountSelector.displayName = 'AccountSelector'

export default AccountSelector
