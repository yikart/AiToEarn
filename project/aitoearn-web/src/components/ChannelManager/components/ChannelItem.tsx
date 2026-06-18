/**
 * ChannelItem - 频道项组件
 *
 * 功能：
 * - 显示频道信息（头像、名称、平台、粉丝数等）
 * - 处理频道删除操作
 * - 离线频道显示灰色样式和重新授权按钮
 */

'use client'

import type { SocialAccount } from '@/api/accounts/account.types'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'

import { useState } from 'react'
import AccountStatusView from '@/app/[lng]/accounts/components/AccountsTopNav/components/AccountStatusView'
import { AccountStatus } from '@/app/config/accountConfig'
import { PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { PlatformIcon } from '@/components/common/PlatformIcon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePlatformInfo } from '@/hooks/usePlatformMetadata'
import { cn } from '@/utils/className'
import { getOssUrl } from '@/utils/oss'
import { shouldShowFansSyncNotice } from '@/utils/social/account'
import { useChannelManagerStore } from '../channelManagerStore'
import { isPlatformFansRefreshSupported } from '../utils/fansRefreshSupport'

interface ChannelItemProps {
  channel: SocialAccount
  onDelete: (channel: SocialAccount) => void
  deleteLoading?: string | null
  fansRefreshTarget?: 'all' | PlatType | null
  onRefreshFans?: (platform: PlatType) => void
}

export function ChannelItem({
  channel,
  onDelete,
  deleteLoading,
  fansRefreshTarget,
  onRefreshFans,
}: ChannelItemProps) {
  const platInfo = usePlatformInfo(channel.type)
  const isDeleting = deleteLoading === channel.id
  const isOffline = channel.status !== AccountStatus.USABLE
  const isFansRefreshing = fansRefreshTarget === 'all' || fansRefreshTarget === channel.type
  const supportsFansRefresh = isPlatformFansRefreshSupported(channel.type, platInfo)
  const showFansSyncNotice = channel.type === PlatType.Douyin && shouldShowFansSyncNotice(channel.type, channel.fansCount)
  const showXhsFansAsyncNotice = channel.type === PlatType.Xhs && channel.fansCount === 0
  const { t } = useTransClient('account')
  const openAndAuth = useChannelManagerStore(state => state.openAndAuth)
  const [refreshTooltipOpen, setRefreshTooltipOpen] = useState(false)

  // 处理重新授权
  const handleReauth = () => {
    openAndAuth(channel.type, channel.groupId)
  }

  return (
    <div
      data-testid="cm-channel-item"
      className={cn(
        'group relative flex min-w-0 items-center gap-3 px-3 py-4 transition-colors hover:bg-muted/20 sm:px-5',
        isDeleting && 'cursor-not-allowed opacity-50',
        isOffline && 'opacity-70',
      )}
    >
      <Avatar className={cn('h-12 w-12 shrink-0 border border-border/70 shadow-sm', isOffline && 'grayscale')}>
        <AvatarImage src={getOssUrl(channel.avatar)} alt={channel.nickname} />
        <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
          {channel.nickname?.[0]}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div data-testid="cm-channel-name" className={cn('truncate text-base font-semibold leading-5 text-foreground', isOffline && 'text-muted-foreground')}>
          {channel.nickname}
        </div>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          {platInfo?.icon && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <PlatformIcon
                platform={channel.type}
                width={16}
                height={16}
                className={cn('shrink-0 rounded-sm', isOffline && 'grayscale')}
              />
              <span className="shrink-0">{platInfo.name}</span>
            </span>
          )}
          <span data-testid="cm-channel-status"><AccountStatusView account={channel} /></span>
          {showFansSyncNotice ? (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t('channelManager.fansSyncNotice')}
            </span>
          ) : showXhsFansAsyncNotice ? (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t('channelManager.xhsFansAsyncNotice')}
            </span>
          ) : channel.fansCount !== undefined && channel.fansCount !== null && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t('channelManager.fans', { count: channel.fansCount })}
            </span>
          )}
        </div>
      </div>

      {/* 离线状态显示重新授权按钮 */}
      {isOffline && !isDeleting && (
        <Button
          data-testid="cm-channel-reauth-btn"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 cursor-pointer rounded-lg px-3 sm:px-4"
          onClick={handleReauth}
        >
          <RefreshCw className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">{t('channelManager.reauth')}</span>
        </Button>
      )}

      {!isOffline && !isDeleting && onRefreshFans && supportsFansRefresh && (
        <TooltipProvider delayDuration={0}>
          <Tooltip open={refreshTooltipOpen} onOpenChange={setRefreshTooltipOpen}>
            <TooltipTrigger asChild>
              <Button
                data-testid="cm-channel-refresh-fans-btn"
                type="button"
                variant="outline"
                size="sm"
                aria-label={t('channelManager.refreshFansAction')}
                disabled={!!fansRefreshTarget}
                className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-primary/35 bg-background p-0 text-primary hover:border-primary/65 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed"
                onClick={() => {
                  setRefreshTooltipOpen(false)
                  onRefreshFans(channel.type)
                }}
              >
                {isFansRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {t('channelManager.refreshFansAction')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isDeleting ? (
        <div className="p-1">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Button
          data-testid="cm-channel-delete-btn"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(channel)}
          className="h-8 w-8 shrink-0 rounded-lg p-0 text-muted-foreground opacity-100 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
