/**
 * ChannelSidebar - 频道类型侧边栏
 * 显示"全部频道"和各平台列表，支持过滤和快速授权
 */

'use client'

import { Layers, Plus, Puzzle } from 'lucide-react'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoArr, AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { PLUGIN_SUPPORTED_PLATFORMS } from '@/store/plugin'
import { useChannelManagerStore } from '../channelManagerStore'

/**
 * 检查平台是否需要插件支持
 */
function isPluginPlatform(platform: PlatType): boolean {
  return PLUGIN_SUPPORTED_PLATFORMS.includes(platform as any)
}

export function ChannelSidebar() {
  const { t } = useTransClient('account')

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

  // 从配置获取支持的平台列表
  const allPlatforms = useMemo(() => {
    return AccountPlatInfoArr.map(([platform]) => platform)
  }, [])

  // 统计各平台账号数量
  const platformAccountCounts = useMemo(() => {
    const counts = new Map<PlatType, number>()
    for (const account of accountList) {
      const current = counts.get(account.type) || 0
      counts.set(account.type, current + 1)
    }
    return counts
  }, [accountList])

  // 获取有账号的平台列表
  const platformsWithAccounts = useMemo(() => {
    return allPlatforms.filter(platform => (platformAccountCounts.get(platform) || 0) > 0)
  }, [allPlatforms, platformAccountCounts])

  // 获取无账号的平台列表
  const platformsWithoutAccounts = useMemo(() => {
    return allPlatforms.filter(platform => (platformAccountCounts.get(platform) || 0) === 0)
  }, [allPlatforms, platformAccountCounts])

  // 处理平台点击
  const handlePlatformClick = (platform: PlatType) => {
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
    <div className="flex h-full w-48 flex-col border-r bg-muted/30">
      {/* 侧边栏标题 */}
      <div className="border-b p-3">
        <h3 className="text-sm font-medium text-foreground">
          {t('channelManager.platforms')}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {/* 全部频道选项 */}
          <button
            type="button"
            onClick={() => setSelectedPlatform('all')}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
              selectedPlatform === 'all'
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-muted/60',
            )}
          >
            <Layers className="h-4 w-4" />
            <span className="flex-1 text-left">{t('channelManager.allChannels')}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                selectedPlatform === 'all'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {accountList.length}
            </span>
          </button>

          {/* 分隔线 */}
          {platformsWithAccounts.length > 0 && (
            <div className="my-2 border-t" />
          )}

          {/* 有账号的平台 */}
          {platformsWithAccounts.map((platform) => {
            const info = AccountPlatInfoMap.get(platform)
            const count = platformAccountCounts.get(platform) || 0
            const needsPlugin = isPluginPlatform(platform)

            if (!info)
              return null

            return (
              <button
                key={platform}
                type="button"
                onClick={() => handlePlatformClick(platform)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  selectedPlatform === platform
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted/60',
                )}
              >
                <div className="relative shrink-0">
                  <img
                    src={typeof info.icon === 'string' ? info.icon : info.icon}
                    alt={info.name}
                    className="h-4 w-4 object-contain"
                  />
                  {needsPlugin && (
                    <Puzzle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
                <span className="flex-1 truncate text-left">{info.name}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    selectedPlatform === platform
                      ? 'bg-primary-foreground/20 text-primary-foreground'
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
              <div className="my-2 border-t" />
              <div className="px-3 py-1 text-xs text-muted-foreground">
                {t('channelManager.availablePlatforms')}
              </div>
              {platformsWithoutAccounts.map((platform) => {
                const info = AccountPlatInfoMap.get(platform)
                const needsPlugin = isPluginPlatform(platform)

                if (!info)
                  return null

                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => handlePlatformClick(platform)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-60 transition-colors hover:bg-muted/60 hover:opacity-100"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={typeof info.icon === 'string' ? info.icon : info.icon}
                        alt={info.name}
                        className="h-4 w-4 object-contain grayscale"
                      />
                      {needsPlugin && (
                        <Puzzle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-left">{info.name}</span>
                    <Plus className="h-3 w-3" />
                  </button>
                )
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* 底部：连接新频道按钮 */}
      <div className="border-t p-3">
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleConnectNewChannel}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('channelManager.connectNewChannel')}
        </Button>
      </div>
    </div>
  )
}
