/**
 * SpaceItem - 空间项组件
 *
 * 功能：
 * - 显示空间信息和操作按钮
 * - 支持编辑空间名称
 * - 显示频道列表
 * - 处理空间折叠展开
 */

'use client'

import { useCallback, useState } from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit,
  MoreVertical,
  Trash2,
  Box,
  Loader2,
} from 'lucide-react'
import { updateAccountGroupApi } from '@/api/account'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import { ChannelItem } from './ChannelItem'

interface Channel {
  id: string
  name: string
  platform: string
  accountId: string
  avatar?: string
  fansCount?: number
}

interface AccountGroup {
  id: string
  name: string
  isDefault: boolean
}

interface SpaceItemProps {
  space: AccountGroup
  channels: Channel[]
  index: number
  totalSpaces: number
  isCollapsed: boolean
  isEditing: boolean
  editSpaceName: string
  editingSpaceLoading: boolean
  deleteLoading?: string | null
  sortingLoading?: string | null
  onToggleCollapse: () => void
  onStartEdit: () => void
  onEditNameChange: (name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete: () => void
  onChannelDelete: (channel: Channel) => void
  onRefresh: () => void
}

export function SpaceItem({
  space,
  channels,
  index,
  totalSpaces,
  isCollapsed,
  isEditing,
  editSpaceName,
  editingSpaceLoading,
  deleteLoading,
  sortingLoading,
  onToggleCollapse,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
  onChannelDelete,
  onRefresh,
}: SpaceItemProps) {
  const { t } = useTransClient('account')

  const canMoveUp = index > 0
  const canMoveDown = index < totalSpaces - 1
  const isSorting = sortingLoading === space.id

  return (
    <div className={`border rounded-lg overflow-hidden ${isSorting ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* 空间标题栏 */}
      <div className="flex items-center gap-2.5 py-2 px-4 bg-muted/30 border-b">
        {isCollapsed ? (
          <ChevronRight
            className="h-4 w-4 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => !isEditing && onToggleCollapse()}
          />
        ) : (
          <ChevronDown
            className="h-4 w-4 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => !isEditing && onToggleCollapse()}
          />
        )}

        <Box className="h-4 w-4 text-primary shrink-0" />

        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <Input
              value={editSpaceName}
              onChange={e => onEditNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit()
                if (e.key === 'Escape') onCancelEdit()
              }}
              autoFocus
              className="h-7 text-sm"
            />
            <Button onClick={onSaveEdit} size="sm" disabled={editingSpaceLoading}>
              {editingSpaceLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              {t('common.save', '保存')}
            </Button>
            <Button variant="outline" onClick={onCancelEdit} size="sm" disabled={editingSpaceLoading}>
              {t('common.cancel', '取消')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{space.name}</div>
              {space.isDefault && (
                <div className="text-xs text-muted-foreground">
                  {t('account.defaultSpace', '默认空间')}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground shrink-0">
              {channels.length} 个频道
            </div>

            {isSorting && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <LoadingOutlined className="h-3 w-3 animate-spin" />
                排序中...
              </div>
            )}

            {!space.isDefault && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onStartEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('common.edit', '编辑')}
                  </DropdownMenuItem>
                  {canMoveUp && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isSorting) onMoveUp?.()
                      }}
                      disabled={isSorting}
                    >
                      <ChevronUp className="h-4 w-4 mr-2" />
                      {t('channelManager.moveUp', '上移')}
                    </DropdownMenuItem>
                  )}
                  {canMoveDown && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isSorting) onMoveDown?.()
                      }}
                      disabled={isSorting}
                    >
                      <ChevronDown className="h-4 w-4 mr-2" />
                      {t('channelManager.moveDown', '下移')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete', '删除')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      {/* 频道列表 */}
      {!isCollapsed && (
        <div className="divide-y">
          {channels.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              {t('channelManager.noChannels', '暂无频道')}
            </div>
          ) : (
            channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                onDelete={onChannelDelete}
                deleteLoading={deleteLoading}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
