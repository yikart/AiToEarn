/**
 * ChannelItem - 频道项组件
 *
 * 功能：
 * - 显示频道信息（头像、名称、平台、粉丝数等）
 * - 处理频道删除操作
 */

'use client'

import Image from 'next/image'
import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons'
import { Trash2 } from 'lucide-react'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { getOssUrl } from '@/utils/oss'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface Channel {
  id: string
  name: string
  platform: string
  accountId: string
  avatar?: string
  fansCount?: number
}

interface ChannelItemProps {
  channel: Channel
  onDelete: (channel: Channel) => void
  deleteLoading?: string | null
}

export function ChannelItem({ channel, onDelete, deleteLoading }: ChannelItemProps) {
  const platInfo = AccountPlatInfoMap.get(channel.platform as any)
  const isDeleting = deleteLoading === channel.id

  return (
    <div
      className={`flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors group relative ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={getOssUrl(channel.avatar)} alt={channel.name} />
        <AvatarFallback>{channel.name[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{channel.name}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {platInfo?.icon && (
            <Image
              src={platInfo.icon}
              alt={platInfo.name}
              width={14}
              height={14}
              className="rounded-sm shrink-0"
            />
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            {platInfo?.name}
          </span>
          {/* 状态显示 */}
          <span className="flex items-center gap-1 text-xs text-green-600 shrink-0">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            在线
          </span>
          {channel.fansCount !== undefined && (
            <span className="text-xs text-muted-foreground shrink-0">
              粉丝: {channel.fansCount}
            </span>
          )}
        </div>
      </div>

      {isDeleting ? (
        <div className="p-1">
          <LoadingOutlined className="h-4 w-4 text-muted-foreground animate-spin" />
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
