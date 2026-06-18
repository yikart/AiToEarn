/**
 * ChannelSidebar - 频道类型侧边栏
 * 显示"全部频道"和各平台列表，支持过滤和快速授权
 */

'use client'

import type { PlatType } from '@/app/config/platConfig'
import { Layers, Plus, Puzzle } from 'lucide-react'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { PlatformIcon } from '@/components/common/PlatformIcon'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isChina } from '@/constant'
import { usePlatformInfoMap, useRegionSortedPlatforms } from '@/hooks/usePlatformMetadata'
import { useAccountStore } from '@/store/account'
import { isPlatformComingSoon, isPlatformRegionLimited } from '@/store/platformMetadata/utils'
import { cn } from '@/utils/className'
import { confirmPlatformRegionRedirect } from '@/utils/region/redirect'
import { toast } from '@/utils/ui/toast'
import { useChannelManagerStore } from '../channelManagerStore'

export function ChannelSidebar() {
  const { t } = useTransClient('account')
  const regionSortedPlatforms = useRegionSortedPlatforms()
  const platformInfoMap = usePlatformInfoMap()

  const { selectedPlatform, setSelectedPlatform, setCurrentView, startAuth, setTargetSpaceId }
    = useChannelManagerStore(
      useShallow(state => ({
        selectedPlatform: state.selectedPlatform,
        setSelectedPlatform: state.setSelectedPlatform,
        setCurrentView: state.setCurrentView,
        startAuth: state.startAuth,
        setTargetSpaceId: state.setTargetSpaceId,
      })),
    )

  const { accountList, accountGroupList } = useAccountStore(
    useShallow(state => ({
      accountList: state.accountList,
      accountGroupList: state.accountGroupList,
    })),
  )

  // 获取所有平台列表（始终显示所有平台，不可用的会禁用）
  const allPlatforms = useMemo<PlatType[]>(() => {
    return regionSortedPlatforms.map(([platform]) => platform)
  }, [regionSortedPlatforms])

  // 统计各平台账号数量
  const platformAccountCounts = useMemo(() => {
    const counts = new Map<PlatType, number>()
    for (const account of accountList) {
      const current = counts.get(account.type) || 0
      counts.set(account.type, current + 1)
    }
    return counts
  }, [accountList])

  // 获取有账号的平台列表（暂未开放的平台统一排到最后）
  const platformsWithAccounts = useMemo(() => {
    return allPlatforms.filter((platform) => {
      const platformInfo = platformInfoMap.get(platform)
      return !isPlatformComingSoon(platformInfo) && (platformAccountCounts.get(platform) || 0) > 0
    })
  }, [allPlatforms, platformAccountCounts, platformInfoMap])

  // 获取无账号的平台列表（暂未开放的平台统一排到最后）
  const platformsWithoutAccounts = useMemo(() => {
    return allPlatforms.filter((platform) => {
      const platformInfo = platformInfoMap.get(platform)
      return !isPlatformComingSoon(platformInfo) && (platformAccountCounts.get(platform) || 0) === 0
    })
  }, [allPlatforms, platformAccountCounts, platformInfoMap])

  // 获取暂未开放的平台列表，始终显示在最后
  const comingSoonPlatforms = useMemo(() => {
    return allPlatforms.filter(platform => isPlatformComingSoon(platformInfoMap.get(platform)))
  }, [allPlatforms, platformInfoMap])

  // 处理平台点击
  const handlePlatformClick = async (platform: PlatType) => {
    const platformInfo = platformInfoMap.get(platform)
    const platformName = platformInfo?.name || platform

    if (isPlatformComingSoon(platformInfo)) {
      toast.warning(t('channelManager.platformComingSoon', { platform: platformName }))
      return
    }

    if (isPlatformRegionLimited(platformInfo)) {
      await confirmPlatformRegionRedirect(platformName)
      return
    }

    const hasAccount = (platformAccountCounts.get(platform) || 0) > 0

    if (hasAccount) {
      // 有账号：切换过滤
      setSelectedPlatform(platform)
    }
    else {
      // 无账号：进入授权流程
      const defaultSpace = accountGroupList.find(g => g.isDefault)
      if (defaultSpace) {
        setTargetSpaceId(defaultSpace.id)
      }
      startAuth(platform, defaultSpace?.id)
    }
  }

  // 处理"连接新频道"按钮点击
  const handleConnectNewChannel = () => {
    setCurrentView('connect-list')
  }

  return (
    <div data-testid="cm-sidebar" className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm">
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-2 pt-3">
          {/* 全部频道选项 */}
          <button
            data-testid="cm-sidebar-all-channels"
            type="button"
            onClick={() => setSelectedPlatform('all')}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all',
              selectedPlatform === 'all'
                ? 'bg-gradient-back text-gradient-foreground shadow-sm shadow-primary/20'
                : 'text-foreground hover:bg-muted/70',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                selectedPlatform === 'all'
                  ? 'border-primary-foreground/20 bg-primary-foreground/15'
                  : 'border-border bg-background',
              )}
            >
              <Layers className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate text-left font-semibold">{t('channelManager.allChannels')}</span>
            <span
              className={cn(
                'min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-medium',
                selectedPlatform === 'all'
                  ? 'bg-primary-foreground/20 text-gradient-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {accountList.length}
            </span>
          </button>

          {/* 分隔线 */}
          {platformsWithAccounts.length > 0 && <div className="my-1.5 border-t border-border/70" />}

          {/* 有账号的平台 */}
          {platformsWithAccounts.map((platform) => {
            const info = platformInfoMap.get(platform)
            const count = platformAccountCounts.get(platform) || 0
            const needsPlugin = info?.authType === 'plugin'

            if (!info)
              return null

            const isRegionLimited = isPlatformRegionLimited(info)
            const regionLimitedLabel = isRegionLimited
              ? t(isChina ? 'channelManager.internationalSiteOnly' : 'channelManager.chinaSiteOnly')
              : undefined

            return (
              <button
                data-testid="cm-sidebar-platform-item"
                key={platform}
                type="button"
                onClick={() => handlePlatformClick(platform)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all',
                  selectedPlatform === platform
                    ? 'bg-gradient-back text-gradient-foreground shadow-sm shadow-primary/20'
                    : 'text-foreground hover:bg-muted/70',
                  isRegionLimited ? 'opacity-45 grayscale' : '',
                )}
              >
                <div
                  className={cn(
                    'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                    selectedPlatform === platform
                      ? 'border-primary-foreground/20 bg-primary-foreground/15'
                      : 'border-border bg-background',
                  )}
                >
                  <PlatformIcon
                    platform={platform}
                    width={16}
                    height={16}
                    className="h-4 w-4 object-contain"
                  />
                  {needsPlugin && (
                    <Puzzle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
                <span className="flex-1 truncate text-left font-medium">{info.name}</span>
                {regionLimitedLabel && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {regionLimitedLabel}
                  </span>
                )}
                <span
                  className={cn(
                    'min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-medium',
                    selectedPlatform === platform
                      ? 'bg-primary-foreground/20 text-gradient-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}

          {/* 无账号的平台（灰色显示） */}
          {platformsWithoutAccounts.length > 0 && (
            <>
              <div className="my-1.5 border-t border-border/70" />
              <div className="px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {t('channelManager.availablePlatforms')}
              </div>
              {platformsWithoutAccounts.map((platform) => {
                const info = platformInfoMap.get(platform)
                const isDisabled = isPlatformComingSoon(info)

                if (!info)
                  return null

                const needsPlugin = info.authType === 'plugin'
                const isRegionLimited = isPlatformRegionLimited(info)
                const regionLimitedLabel = isRegionLimited
                  ? t(isChina ? 'channelManager.internationalSiteOnly' : 'channelManager.chinaSiteOnly')
                  : undefined

                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => handlePlatformClick(platform)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-all',
                      isDisabled
                        ? 'opacity-30 grayscale'
                        : 'opacity-70 hover:bg-muted/70 hover:text-foreground hover:opacity-100',
                      isRegionLimited ? 'opacity-45 grayscale' : '',
                    )}
                  >
                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                      <PlatformIcon
                        platform={platform}
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain grayscale"
                      />
                      {needsPlugin && (
                        <Puzzle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-left font-medium">{info.name}</span>
                    {regionLimitedLabel && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {regionLimitedLabel}
                      </span>
                    )}
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )
              })}
            </>
          )}

          {comingSoonPlatforms.length > 0 && (
            <>
              <div className="my-1.5 border-t border-border/70" />
              {comingSoonPlatforms.map((platform) => {
                const info = platformInfoMap.get(platform)

                if (!info)
                  return null

                const needsPlugin = info.authType === 'plugin'

                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => handlePlatformClick(platform)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground opacity-30 grayscale transition-all hover:bg-muted/70 hover:text-foreground"
                  >
                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                      <PlatformIcon
                        platform={platform}
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain grayscale"
                      />
                      {needsPlugin && (
                        <Puzzle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-left font-medium">{info.name}</span>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* 底部：连接新频道按钮 */}
      <div className="border-t border-border/70 p-3">
        <Button
          data-testid="cm-sidebar-connect-btn"
          variant="outline"
          className="h-10 w-full cursor-pointer rounded-lg border-primary/45 bg-background text-primary shadow-sm hover:border-primary/70 hover:bg-primary/5"
          onClick={handleConnectNewChannel}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('channelManager.connectNewChannel')}
        </Button>
      </div>
    </div>
  )
}
