/**
 * UnifiedChannelSpaceList - 统一的空间和频道管理列表
 *
 * 功能：
 * - 空间列表（支持添加、编辑、删除、排序）
 * - 每个空间下显示频道（支持删除）
 * - 完全使用全局account store数据
 */

'use client'

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit,
  Folder,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { createAccountGroupApi, deleteAccountGroupApi, updateAccountGroupApi } from '@/api/account'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { getOssUrl } from '@/utils/oss'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/lib/toast'
import { useAccountStore } from '@/store/account'

// 模拟频道数据类型（后续需要从API获取）
interface Channel {
  id: string
  name: string
  platform: string
  accountId: string
  avatar?: string
  fansCount?: number
}

export function UnifiedChannelSpaceList() {
  const { t } = useTransClient('account')
  const {
    accountGroupList,
    accountList,
    accountLoading,
    getAccountGroup,
  } = useAccountStore(
    useShallow(state => ({
      accountGroupList: state.accountGroupList,
      accountList: state.accountList,
      accountLoading: state.accountLoading,
      getAccountGroup: state.getAccountGroup,
    })),
  )

  // UI状态
  const [editingSpace, setEditingSpace] = useState<string | null>(null)
  const [editSpaceName, setEditSpaceName] = useState('')
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [creatingSpace, setCreatingSpace] = useState(false)
  const [editingSpaceLoading, setEditingSpaceLoading] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')

  // 删除确认对话框
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: 'space' | 'channel'
    id: string
    name: string
  }>({
    open: false,
    type: 'space',
    id: '',
    name: '',
  })


  // 开始编辑空间
  const startEditingSpace = useCallback((spaceId: string, currentName: string) => {
    setEditingSpace(spaceId)
    setEditSpaceName(currentName)
  }, [])

  // 保存空间编辑
  const saveSpaceEdit = useCallback(async () => {
    if (!editingSpace || !editSpaceName.trim())
      return

    setEditingSpaceLoading(true)
    try {
      await updateAccountGroupApi({
        id: editingSpace,
        name: editSpaceName.trim(),
      })
      await getAccountGroup()
      toast.success(t('channelManager.editSpaceSuccess', '空间编辑成功'))
      setEditingSpace(null)
      setEditSpaceName('')
    }
    catch (error) {
      toast.error(t('channelManager.editSpaceFailed', '空间编辑失败'))
    }
    finally {
      setEditingSpaceLoading(false)
    }
  }, [editingSpace, editSpaceName, getAccountGroup, t])

  // 取消编辑
  const cancelSpaceEdit = useCallback(() => {
    setEditingSpace(null)
    setEditSpaceName('')
  }, [])

  // 添加新空间
  const addNewSpace = useCallback(async () => {
    if (!newSpaceName.trim())
      return

    setCreatingSpace(true)
    try {
      await createAccountGroupApi({ name: newSpaceName.trim() })
      await getAccountGroup()
      toast.success(t('channelManager.createSpaceSuccess', '创建空间成功'))
      setNewSpaceName('')
      setCreatingSpace(false)
      setShowCreateSpace(false)
    }
    catch (error) {
      toast.error(t('channelManager.createSpaceFailed', '创建空间失败'))
      setCreatingSpace(false)
      // 注意：这里不重置showCreateSpace，让用户可以重试
    }
  }, [newSpaceName, getAccountGroup, t])

  // 删除空间或频道
  const confirmDelete = useCallback(async () => {
    try {
      if (deleteDialog.type === 'space') {
        await deleteAccountGroupApi([deleteDialog.id])
        toast.success(t('channelManager.deleteSpaceSuccess', '删除空间成功'))
      }
      else {
        // TODO: 实现删除频道API
        toast.success(t('channelManager.deleteChannelSuccess', '删除频道成功'))
      }
      await getAccountGroup()
    }
    catch (error) {
      const errorType = deleteDialog.type === 'space' ? '空间' : '频道'
      toast.error(`删除${errorType}失败`)
    }

    setDeleteDialog({ open: false, type: 'space', id: '', name: '' })
  }, [deleteDialog, getAccountGroup, t])

  // 获取空间下的频道
  const getChannelsInSpace = useCallback((spaceId: string): Channel[] => {
    // TODO: 从API获取真实频道数据
    // 暂时返回模拟数据
    return accountList
      .filter(account => account.groupId === spaceId)
      .map(account => ({
        id: account.id,
        name: account.nickname || account.account,
        platform: account.type || 'unknown',
        accountId: account.account,
        avatar: account.avatar,
        fansCount: account.fansCount,
      }))
  }, [accountList])

  if (accountLoading) {
    return (
      <div className="space-y-4">
        {/* 骨架屏 */}
        <div className="flex items-center gap-3 p-4 bg-muted/30 border-b">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>

        {/* 频道骨架屏 */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-4 border-b last:border-b-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}

        {/* 加载动画 */}
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            {t('common.loading', '加载中...')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 添加新空间 */}
      <div className="flex gap-2">
        {showCreateSpace ? (
          <>
            <Input
              placeholder={t('channelManager.createSpaceNamePlaceholder', '输入空间名称')}
              value={newSpaceName}
              onChange={e => setNewSpaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  addNewSpace()
                if (e.key === 'Escape') {
                  setNewSpaceName('')
                  setShowCreateSpace(false)
                }
              }}
              disabled={creatingSpace}
              autoFocus
              className="flex-1"
            />
            <Button onClick={addNewSpace} size="sm" disabled={!newSpaceName.trim() || creatingSpace}>
              {creatingSpace ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {t('common.confirm', '确认')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setNewSpaceName('')
                setShowCreateSpace(false)
              }}
              size="sm"
            >
              {t('common.cancel', '取消')}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowCreateSpace(true)}
            className="w-full justify-start"
            disabled={showCreateSpace}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('channelManager.createSpace', '新建空间')}
          </Button>
        )}
      </div>

      {/* 空间和频道列表 */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {accountGroupList.map((space, index) => {
            const channels = getChannelsInSpace(space.id)
            const canMoveUp = index > 0
            const canMoveDown = index < accountGroupList.length - 1
            const isEditing = editingSpace === space.id

            return (
              <div key={space.id} className="border rounded-lg overflow-hidden">
                {/* 空间标题栏 */}
                <div className="flex items-center gap-3 p-4 bg-muted/30 border-b">
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

                  <Folder className="h-5 w-5 text-primary shrink-0" />

                  {isEditing ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editSpaceName}
                        onChange={e => setEditSpaceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveSpaceEdit()
                          if (e.key === 'Escape') cancelSpaceEdit()
                        }}
                        autoFocus
                        className="h-8 text-sm"
                      />
                      <Button onClick={saveSpaceEdit} size="sm" disabled={editingSpaceLoading}>
                        {editingSpaceLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        {t('common.save', '保存')}
                      </Button>
                      <Button variant="outline" onClick={cancelSpaceEdit} size="sm" disabled={editingSpaceLoading}>
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

                      {!space.isDefault && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditingSpace(space.id, space.name)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('common.edit', '编辑')}
                            </DropdownMenuItem>
                            {canMoveUp && (
                              <DropdownMenuItem>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                {t('channelManager.moveUp', '上移')}
                              </DropdownMenuItem>
                            )}
                            {canMoveDown && (
                              <DropdownMenuItem>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                {t('channelManager.moveDown', '下移')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({
                                open: true,
                                type: 'space',
                                id: space.id,
                                name: space.name,
                              })}
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
                <div className="divide-y">
                  {channels.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">
                      {t('channelManager.noChannels', '暂无频道')}
                    </div>
                  ) : (
                    channels.map((channel) => {
                      const platInfo = AccountPlatInfoMap.get(channel.platform as any)
                      return (
                        <div
                          key={channel.id}
                          className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors group"
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

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({
                              open: true,
                              type: 'channel',
                              id: channel.id,
                              name: channel.name,
                            })}
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={open =>
          setDeleteDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('channelManager.deleteConfirm', '确认删除')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除
              {deleteDialog.type === 'space' ? '空间' : '频道'}
              {' '}
              "
              {deleteDialog.name}
              " 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', '取消')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.confirm', '确认')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
