/**
 * UnifiedChannelSpaceList - 统一的空间和频道管理列表
 *
 * 功能：
 * - 空间列表（支持添加、编辑、删除、排序）
 * - 每个空间下显示频道（支持删除）
 * - 完全使用全局account store数据
 */

'use client'

import type { SocialAccount } from '@/api/types/account.type'
import { useCallback, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { deleteAccountApi, deleteAccountGroupApi, updateAccountGroupApi } from '@/api/account'
import { apiUpdateAccountGroupSortRank } from '@/api/accountSort'
import { useTransClient } from '@/app/i18n/client'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/lib/toast'
import { useAccountStore } from '@/store/account'
import { CreateSpaceSection } from './CreateSpaceSection'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { SpaceItem } from './SpaceItem'
import { SpaceListSkeleton } from './SpaceListSkeleton'

export function UnifiedChannelSpaceList() {
  const { t } = useTransClient('account')
  const {
    accountGroupList,
    accountList,
    accountLoading,
    getAccountGroup,
    getAccountList,
  } = useAccountStore(
    useShallow(state => ({
      accountGroupList: state.accountGroupList,
      accountList: state.accountList,
      accountLoading: state.accountLoading,
      getAccountGroup: state.getAccountGroup,
      getAccountList: state.getAccountList,
    })),
  )

  // UI状态
  const [editingSpace, setEditingSpace] = useState<string | null>(null)
  const [editSpaceName, setEditSpaceName] = useState('')
  const [editingSpaceLoading, setEditingSpaceLoading] = useState(false)
  const [collapsedSpaces, setCollapsedSpaces] = useState<Set<string>>(new Set())
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [sortingSpaceLoading, setSortingSpaceLoading] = useState<string | null>(null)

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

  // 删除空间或频道
  const confirmDelete = useCallback(async () => {
    setDeleteLoading(deleteDialog.id)
    try {
      if (deleteDialog.type === 'space') {
        await deleteAccountGroupApi([deleteDialog.id])
        toast.success(t('channelManager.deleteSpaceSuccess', '删除空间成功'))
        await getAccountGroup()
      }
      else {
        await deleteAccountApi(deleteDialog.id)
        toast.success(t('channelManager.deleteChannelSuccess', '删除频道成功'))
        // 删除频道后同时刷新账户列表和分组数据
        await Promise.all([getAccountList(), getAccountGroup()])
      }
      // 删除成功后关闭对话框
      setDeleteDialog({ open: false, type: 'space', id: '', name: '' })
    }
    catch (error) {
      const errorType = deleteDialog.type === 'space' ? '空间' : '频道'
      toast.error(`删除${errorType}失败`)
      // 删除失败不关闭对话框，让用户可以重试
    }
    finally {
      setDeleteLoading(null)
    }
  }, [deleteDialog, getAccountGroup, getAccountList, t])

  // 切换空间折叠状态
  const toggleSpaceCollapse = useCallback((spaceId: string) => {
    setCollapsedSpaces((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(spaceId)) {
        newSet.delete(spaceId)
      }
      else {
        newSet.add(spaceId)
      }
      return newSet
    })
  }, [])

  // 空间排序函数
  const handleSpaceSort = useCallback(async (spaceId: string, direction: 'up' | 'down') => {
    if (sortingSpaceLoading)
      return // 防止重复操作

    setSortingSpaceLoading(spaceId)

    try {
      const sortedGroups = [...accountGroupList].sort((a, b) => (a.rank || 0) - (b.rank || 0))
      const currentIndex = sortedGroups.findIndex(g => g.id === spaceId)

      if (currentIndex === -1)
        return

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (newIndex < 0 || newIndex >= sortedGroups.length)
        return

      // 交换位置
      [sortedGroups[currentIndex], sortedGroups[newIndex]] = [sortedGroups[newIndex], sortedGroups[currentIndex]]

      // 更新rank
      const updateList = sortedGroups.map((group, index) => ({
        id: group.id,
        rank: index,
      }))

      await apiUpdateAccountGroupSortRank({ list: updateList })
      await getAccountGroup()
      toast.success(t('channelManager.sortSuccess', '排序成功'))
    }
    catch (error) {
      toast.error(t('channelManager.sortFailed', '排序失败'))
    }
    finally {
      setSortingSpaceLoading(null)
    }
  }, [accountGroupList, getAccountGroup, t, sortingSpaceLoading])

  // 获取空间下的频道
  const getChannelsInSpace = useCallback((spaceId: string): SocialAccount[] => {
    // TODO: 从API获取真实频道数据
    // 暂时返回模拟数据
    return accountList.filter(account => account.groupId === spaceId)
  }, [accountList])

  if (accountLoading) {
    return <SpaceListSkeleton />
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* 添加新空间 */}
      <CreateSpaceSection onSpaceCreated={getAccountGroup} />

      {/* 空间和频道列表 */}
      <ScrollArea className="flex-1 h-full">
        <div className="space-y-2">
          {accountGroupList.map((space, index) => {
            const channels = getChannelsInSpace(space.id)
            const isEditing = editingSpace === space.id
            const isCollapsed = collapsedSpaces.has(space.id)

            return (
              <SpaceItem
                key={space.id}
                space={space}
                channels={channels}
                index={index}
                totalSpaces={accountGroupList.length}
                isCollapsed={isCollapsed}
                isEditing={isEditing}
                editSpaceName={editSpaceName}
                editingSpaceLoading={editingSpaceLoading}
                deleteLoading={deleteLoading}
                sortingLoading={sortingSpaceLoading}
                onToggleCollapse={() => toggleSpaceCollapse(space.id)}
                onStartEdit={() => startEditingSpace(space.id, space.name)}
                onEditNameChange={setEditSpaceName}
                onSaveEdit={saveSpaceEdit}
                onCancelEdit={cancelSpaceEdit}
                onMoveUp={() => handleSpaceSort(space.id, 'up')}
                onMoveDown={() => handleSpaceSort(space.id, 'down')}
                onDelete={() => setDeleteDialog({
                  open: true,
                  type: 'space',
                  id: space.id,
                  name: space.name,
                })}
                onChannelDelete={(channel: SocialAccount) => setDeleteDialog({
                  open: true,
                  type: 'channel',
                  id: channel.id,
                  name: channel.nickname,
                })}
                onRefresh={getAccountGroup}
              />
            )
          })}
        </div>
      </ScrollArea>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        type={deleteDialog.type}
        name={deleteDialog.name}
        loading={!!deleteLoading}
        onOpenChange={open => setDeleteDialog(prev => ({ ...prev, open }))}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
