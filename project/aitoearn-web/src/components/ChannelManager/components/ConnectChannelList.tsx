/**
 * ConnectChannelList - 连接频道列表页
 * 显示所有可连接的平台，点击进入授权流程
 */

'use client'

import { ArrowLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { isPlatformAvailable, PlatType, RegionSortedPlatInfoArr } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import { navigateToLogin } from '@/utils/auth'
import { useChannelManagerStore } from '../channelManagerStore'

export function ConnectChannelList() {
  const { t } = useTransClient('account')
  const isMobile = useIsMobile()

  const { isNewUser, setCurrentView, startAuth, targetSpaceId, setTargetSpaceId, closeModal }
    = useChannelManagerStore(
      useShallow(state => ({
        isNewUser: state.isNewUser,
        setCurrentView: state.setCurrentView,
        startAuth: state.startAuth,
        targetSpaceId: state.targetSpaceId,
        setTargetSpaceId: state.setTargetSpaceId,
        closeModal: state.closeModal,
      })),
    )

  const { accountGroupList } = useAccountStore(
    useShallow(state => ({
      accountGroupList: state.accountGroupList,
    })),
  )

  const { token } = useUserStore(
    useShallow(state => ({
      token: state.token,
    })),
  )

  // 返回主页
  const handleBack = () => {
    setCurrentView('main')
  }

  // 处理平台点击
  const handlePlatformClick = (platform: PlatType) => {
    // 移动端点击小红书时显示提示
    if (isMobile && platform === PlatType.Xhs) {
      toast.warning(t('channelManager.xhsMobileNotSupported'))
      return
    }

    // 未登录时关闭频道弹框并跳转登录页
    if (!token) {
      closeModal()
      navigateToLogin()
      return
    }

    // 如果没有设置目标空间，使用默认空间
    let spaceId = targetSpaceId
    if (!spaceId) {
      const defaultSpace = accountGroupList.find(g => g.isDefault)
      spaceId = defaultSpace?.id || null
      if (spaceId) {
        setTargetSpaceId(spaceId)
      }
    }

    // 开始授权流程
    startAuth(platform, spaceId || undefined)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 头部 - 返回按钮 */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button data-testid="cm-connect-back-btn" variant="ghost" size="sm" className="cursor-pointer" onClick={handleBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('channelManager.backToChannels')}
        </Button>
      </div>

      {/* 新用户提示 */}
      {isNewUser && (
        <div data-testid="cm-connect-new-user-tip" className="mx-4 mt-4 flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
          <Sparkles className="h-6 w-6 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('channelManager.newUserTip')}</p>
        </div>
      )}

      {/* 平台网格 */}
      <ScrollArea className="flex-1 p-4">
        <div
          data-testid="cm-connect-list"
          className="
            grid w-full gap-2 sm:gap-3
            pt-3
            grid-cols-3
            sm:grid-cols-4
            md:grid-cols-5
            lg:grid-cols-6
          "
        >
          <TooltipProvider>
            {RegionSortedPlatInfoArr.map(([key, value]) => {
              const isRegionRestricted = !isPlatformAvailable(key)
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      data-testid="cm-connect-platform-card"
                      variant="ghost"
                      className={`
                        group relative flex h-[90px] min-w-0
                        w-full cursor-pointer flex-col items-center
                        justify-center overflow-hidden whitespace-normal
                        rounded-lg border border-border bg-card
                        p-2 transition-all duration-200
                        hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-accent
                        hover:shadow-md
                        active:translate-y-0 active:scale-[0.98]
                        sm:h-[100px] sm:rounded-xl sm:p-3
                        md:h-[110px]
                        ${isRegionRestricted ? 'opacity-50 grayscale' : ''}
                      `}
                      onClick={() => handlePlatformClick(key as PlatType)}
                    >
                      {/* 小红书浏览器插件标签 */}
                      {key === PlatType.Xhs && (
                        <span className="absolute -right-px -top-px z-20 rounded-bl rounded-tr-lg bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {t('channelManager.browserPlugin')}
                        </span>
                      )}

                      {/* 光泽效果 */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                      <div className="relative z-10 flex w-full flex-col items-center gap-1.5 sm:gap-2">
                        <img
                          src={value.icon}
                          className="
                            h-9 w-9 object-contain
                            drop-shadow-md filter transition-all
                            duration-300 group-hover:rotate-[5deg]
                            group-hover:scale-110
                            sm:h-10 sm:w-10
                            md:h-11 md:w-11
                          "
                          alt={value.name}
                        />
                        <span
                          className="
                            line-clamp-2 w-full text-center
                            text-[11px] font-medium leading-tight
                            text-foreground transition-all duration-300
                            group-hover:font-semibold
                            sm:text-xs
                          "
                        >
                          {value.name}
                        </span>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  {value.tips?.account && (
                    <TooltipContent className="max-w-[200px] text-xs">
                      <p>{value.tips.account}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </div>
      </ScrollArea>
    </div>
  )
}
