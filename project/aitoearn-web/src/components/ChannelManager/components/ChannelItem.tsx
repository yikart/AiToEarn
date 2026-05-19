/**
 * ChannelItem - 频道项组件
 *
 * 功能：
 * - 显示频道信息（头像、名称、平台、粉丝数等）
 * - 处理频道删除操作
 * - 离线频道显示灰色样式和重新授权按钮
 */

'use client'

import type { SocialAccount } from '@/api/types/account.type'
import { BarChart3, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import Image from 'next/image'

import { useState } from 'react'
import AccountStatusView from '@/app/[lng]/accounts/components/AccountsTopNav/components/AccountStatusView'
import { AccountStatus } from '@/app/config/accountConfig'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import TwitterExploreDialog from '@/components/twitter/TwitterAnalyticsDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import { shouldShowFansSyncNotice } from '@/utils/socialAccount'
import { useChannelManagerStore } from '../channelManagerStore'

interface ChannelItemProps {
  channel: SocialAccount
  onDelete: (channel: SocialAccount) => void
  deleteLoading?: string | null
}

export function ChannelItem({ channel, onDelete, deleteLoading }: ChannelItemProps) {
  const platInfo = AccountPlatInfoMap.get(channel.type)
  const isDeleting = deleteLoading === channel.id
  const isOffline = channel.status !== AccountStatus.USABLE
  const showFansSyncNotice = shouldShowFansSyncNotice(channel.type, channel.fansCount)
  const { t } = useTransClient('account')
  const openAndAuth = useChannelManagerStore(state => state.openAndAuth)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)

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
          {channel.nickname?.[0] || channel.account?.[0]}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div data-testid="cm-channel-name" className={cn('truncate text-base font-semibold leading-5 text-foreground', isOffline && 'text-muted-foreground')}>
          {channel.nickname || channel.account}
        </div>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          {channel.account && channel.nickname && (
            <div className="inline-flex max-w-[240px] min-w-0 shrink items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">ID</span>
              <span className="truncate font-mono text-[11px] text-foreground/80">{channel.account}</span>
            </div>
          )}
          {platInfo?.icon && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Image
                src={platInfo.icon}
                alt={platInfo.name}
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
          ) : channel.fansCount !== undefined && channel.fansCount !== null && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t('channelManager.fans', { count: channel.fansCount })}
            </span>
          )}
        </div>
      </div>

      {/* Twitter 账号显示查看数据按钮 */}
      {channel.type === PlatType.Twitter && !isOffline && !isDeleting && (
        <>
          <Button
            data-testid="cm-channel-analytics-btn"
            variant="outline"
            size="sm"
            className="h-7 cursor-pointer shrink-0 px-2 sm:px-3"
            onClick={() => setAnalyticsOpen(true)}
          >
            <BarChart3 className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">{t('channelManager.viewExplore')}</span>
          </Button>
          <TwitterExploreDialog
            open={analyticsOpen}
            onOpenChange={setAnalyticsOpen}
            accountId={channel.id}
            username={channel.account}
          />
        </>
      )}

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
