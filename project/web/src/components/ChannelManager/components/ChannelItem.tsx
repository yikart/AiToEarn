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
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'

import Image from 'next/image'
import AccountStatusView from '@/app/[lng]/accounts/components/AccountsTopNav/components/AccountStatusView'
import { AccountStatus } from '@/app/config/accountConfig'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getOssUrl } from '@/utils/oss'
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
  const { t } = useTransClient('account')
  const openAndAuth = useChannelManagerStore(state => state.openAndAuth)

  // 处理重新授权
  const handleReauth = () => {
    openAndAuth(channel.type, channel.groupId)
  }

  return (
    <div
      className={`flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors group relative ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      } ${isOffline ? 'opacity-60' : ''}`}
    >
      <Avatar className={`h-10 w-10 shrink-0 ${isOffline ? 'grayscale' : ''}`}>
        <AvatarImage src={getOssUrl(channel.avatar)} alt={channel.nickname} />
        <AvatarFallback>{channel.nickname?.[0] || channel.account?.[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm truncate ${isOffline ? 'text-muted-foreground' : ''}`}>
          {channel.nickname || channel.account}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {platInfo?.icon && (
            <Image
              src={platInfo.icon}
              alt={platInfo.name}
              width={14}
              height={14}
              className={`rounded-sm shrink-0 ${isOffline ? 'grayscale' : ''}`}
            />
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            {platInfo?.name}
          </span>
          <AccountStatusView account={channel} />
          {channel.fansCount !== undefined && channel.fansCount !== null && (
            <span className="text-xs text-muted-foreground shrink-0">
              {t('channelManager.fans', { count: channel.fansCount })}
            </span>
          )}
        </div>
      </div>

      {/* 离线状态显示重新授权按钮 */}
      {isOffline && !isDeleting && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 cursor-pointer shrink-0"
          onClick={handleReauth}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          {t('channelManager.reauth')}
        </Button>
      )}

      {isDeleting ? (
        <div className="p-1">
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(channel)}
          className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
