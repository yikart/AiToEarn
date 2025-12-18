/**
 * AccountsTab - 平台账号 Tab 组件
 * 显示插件支持的平台账号列表及其状态
 */

'use client'

import type { PluginPlatformType } from '@/store/plugin/types/baseTypes'
import { CheckCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import AvatarPlat from '@/components/AvatarPlat'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useAccountStore } from '@/store/account'
import { usePluginStore } from '@/store/plugin'
import { PLUGIN_SUPPORTED_PLATFORMS } from '@/store/plugin/types/baseTypes'
import { cn } from '@/lib/utils'

interface AccountsTabProps {
  /** 需要高亮的平台 */
  highlightPlatform?: string | null
}

/**
 * 获取平台显示名称
 */
function getPlatformName(platform: PluginPlatformType): string {
  const platInfo = AccountPlatInfoMap.get(platform)
  return platInfo?.name || platform
}

/**
 * 平台账号 Tab 组件
 */
export function AccountsTab({ highlightPlatform }: AccountsTabProps) {
  const { t } = useTranslation('plugin')
  const platformAccounts = usePluginStore(state => state.platformAccounts)
  const syncAccountToDatabase = usePluginStore(state => state.syncAccountToDatabase)
  const accountGroupList = useAccountStore(state => state.accountGroupList)

  const [syncLoading, setSyncLoading] = useState<PluginPlatformType | null>(null)

  /**
   * 处理同步账号到数据库
   */
  const handleSyncAccount = async (platform: PluginPlatformType) => {
    setSyncLoading(platform)
    try {
      const defaultGroup = accountGroupList.find(g => g.isDefault)
      const result = await syncAccountToDatabase(platform, defaultGroup?.id)

      if (result) {
        toast.success(t('header.syncSuccess' as any))
      }
      else {
        toast.error(t('header.syncFailed' as any))
      }
    }
    catch (error) {
      console.error('同步账号失败:', error)
      toast.error(t('header.syncFailed' as any))
    }
    finally {
      setSyncLoading(null)
    }
  }

  /**
   * 处理去登录
   */
  const handleGoLogin = (platform: PluginPlatformType) => {
    const platInfo = AccountPlatInfoMap.get(platform)
    if (platInfo?.url) {
      window.open(platInfo.url, '_blank')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部状态栏 */}
      <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3">
        <CheckCircle className="h-5 w-5 text-success" />
        <span className="text-sm text-success">
          {t('header.activeDescription')}
        </span>
      </div>

      {/* 平台账号列表 */}
      <div className="flex flex-col gap-3">
        {PLUGIN_SUPPORTED_PLATFORMS.map((platform) => {
          const account = platformAccounts[platform]
          const shouldHighlight = highlightPlatform?.toLowerCase() === platform.toLowerCase()

          return (
            <div
              key={platform}
              className={cn(
                'flex items-center justify-between rounded-lg border p-4 transition-all',
                shouldHighlight
                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                  : 'border-border bg-card hover:border-border',
              )}
            >
              {/* 左侧：账号信息 */}
              <div className="flex items-center gap-3">
                {account
                  ? (
                      <AvatarPlat
                        account={{
                          type: platform,
                          avatar: account.avatar || '',
                          nickname: account.nickname || '',
                          uid: account.uid || '',
                          id: '0',
                          fansCount: account.fansCount || 0,
                        }}
                        size="large"
                        avatarWidth={44}
                      />
                    )
                  : (
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {getPlatformName(platform).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {getPlatformName(platform)}
                  </span>
                  {account
                    ? (
                        <span className="text-sm text-muted-foreground">
                          {account.nickname || account.uid}
                        </span>
                      )
                    : (
                        <span className="text-sm text-muted-foreground">
                          {t('header.notLoggedIn')}
                          {platform === PlatType.Xhs && (
                            <span className="ml-1 text-xs text-warning">
                              {t('header.xhsNotLoggedInTip' as any)}
                            </span>
                          )}
                        </span>
                      )}
                </div>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex items-center gap-2">
                {account
                  ? (
                      <>
                        <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                          {t('status.connected')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => handleSyncAccount(platform)}
                          disabled={syncLoading === platform}
                        >
                          <RefreshCw className={cn('h-4 w-4', syncLoading === platform && 'animate-spin')} />
                          {t('header.sync' as any)}
                        </Button>
                      </>
                    )
                  : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleGoLogin(platform)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t('header.loginNow')}
                      </Button>
                    )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
