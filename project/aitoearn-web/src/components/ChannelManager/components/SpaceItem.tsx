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

import type { SocialAccount } from '@/api/types/account.type'
import {
  Box,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { ChannelItem } from './ChannelItem'

interface AccountGroup {
  id: string
  name: string
  isDefault: boolean
}

interface SpaceItemProps {
  space: AccountGroup
  channels: SocialAccount[]
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
  onChannelDelete: (channel: SocialAccount) => void
  onRefresh: () => void
  onAddChannel?: () => void
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
  onAddChannel,
}: SpaceItemProps) {
  const { t } = useTransClient('account')

  const canMoveUp = index > 0
  const canMoveDown = index < totalSpaces - 1
  const isSorting = sortingLoading === space.id

  return (
    <div
      data-testid="cm-space-item"
      className={cn(
        'relative min-w-0 overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm transition-shadow before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-back before:content-[""] hover:shadow-md',
        isSorting && 'pointer-events-none opacity-60',
      )}
    >
      {/* 空间标题栏 */}
      <div className="flex items-center gap-1.5 overflow-hidden border-b border-border/70 bg-background px-2 py-3 transition-colors hover:bg-muted/20 sm:gap-3 sm:px-5">
        {/* 可点击的折叠区域 */}
        <div
          data-testid="cm-space-toggle"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 sm:gap-3"
          onClick={() => !isEditing && onToggleCollapse()}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors hover:text-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-colors hover:text-foreground" />
          )}

          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Box className="h-4 w-4" />
          </span>

          {isEditing ? (
            <div
              className="flex min-w-0 flex-1 flex-wrap gap-1.5 sm:flex-nowrap sm:gap-2"
              onClick={e => e.stopPropagation()}
            >
              <Input
                data-testid="cm-space-edit-input"
                value={editSpaceName}
                onChange={e => onEditNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    onSaveEdit()
                  if (e.key === 'Escape')
                    onCancelEdit()
                }}
                autoFocus
                className="h-8 min-w-0 flex-1 rounded-lg text-sm"
              />
              <div className="flex gap-1.5 sm:gap-2">
                <Button
                  onClick={onSaveEdit}
                  size="sm"
                  disabled={editingSpaceLoading}
                  className="cursor-pointer rounded-lg"
                >
                  {editingSpaceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin sm:mr-1" />
                  ) : null}
                  <span className="hidden sm:inline">{t('common.save', '保存')}</span>
                  <span className="sm:hidden">{editingSpaceLoading ? '' : '✓'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancelEdit}
                  size="sm"
                  disabled={editingSpaceLoading}
                  className="cursor-pointer rounded-lg"
                >
                  <span className="hidden sm:inline">{t('common.cancel', '取消')}</span>
                  <span className="sm:hidden">✕</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <div data-testid="cm-space-name" className="truncate text-base font-semibold text-foreground">{space.name}</div>
              </div>

              <div className="shrink-0 text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">
                  {t('channelManager.channelCount', { count: channels.length })}
                </span>
                <span className="sm:hidden">{channels.length}</span>
              </div>
            </>
          )}
        </div>

        {/* 操作按钮区域 - 不参与折叠点击 */}
        {!isEditing && (
          <>
            {/* 添加频道按钮 */}
            {onAddChannel && (
              <Button
                data-testid="cm-space-add-channel-btn"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 cursor-pointer rounded-lg border-primary/45 bg-background px-4 font-semibold text-primary shadow-sm hover:border-primary/70 hover:bg-primary/5 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChannel()
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                <span>{t('channelManager.addChannel')}</span>
              </Button>
            )}

            {isSorting && (
              <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('channelManager.sorting', '排序中...')}
              </div>
            )}

            {!space.isDefault && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    data-testid="cm-space-more-menu"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 rounded-lg p-0 text-muted-foreground hover:text-foreground"
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onStartEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('actions.edit')}
                  </DropdownMenuItem>
                  {canMoveUp && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isSorting)
                          onMoveUp?.()
                      }}
                      disabled={isSorting}
                    >
                      <ChevronUp className="mr-2 h-4 w-4" />
                      {t('channelManager.moveUp', '上移')}
                    </DropdownMenuItem>
                  )}
                  {canMoveDown && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isSorting)
                          onMoveDown?.()
                      }}
                      disabled={isSorting}
                    >
                      <ChevronDown className="mr-2 h-4 w-4" />
                      {t('channelManager.moveDown', '下移')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      {/* 频道列表 */}
      {!isCollapsed && (
        <div className="divide-y divide-border/70">
          {channels.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('channelManager.noChannels', '暂无频道')}
            </div>
          ) : (
            channels.map(channel => (
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
