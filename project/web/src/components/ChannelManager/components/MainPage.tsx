/**
 * MainPage - 频道管理主页
 * 左侧侧边栏 + 右侧空间和账号管理
 */

'use client'

import type { SocialAccount } from '@/api/types/account.type'
import type { PlatType } from '@/app/config/platConfig'
import { useCallback, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { deleteAccountApi, deleteAccountGroupApi, updateAccountGroupApi } from '@/api/account'
import { apiUpdateAccountGroupSortRank } from '@/api/accountSort'
import { useTransClient } from '@/app/i18n/client'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/lib/toast'
import { useAccountStore } from '@/store/account'
import { useChannelManagerStore } from '../channelManagerStore'
import { ChannelSidebar } from './ChannelSidebar'
import { CreateSpaceSection } from './CreateSpaceSection'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { SpaceItem } from './SpaceItem'
import { SpaceListSkeleton } from './SpaceListSkeleton'

export function MainPage() {
  const { t } = useTransClient('account')

  const { selectedPlatform, setCurrentView, startAuth, setTargetSpaceId }
    = useChannelManagerStore(
      useShallow(state => ({
        selectedPlatform: state.selectedPlatform,
        setCurrentView: state.setCurrentView,
        startAuth: state.startAuth,
        setTargetSpaceId: state.setTargetSpaceId,
      })),
    )

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
      toast.success(t('channelManager.editSpaceSuccess'))
      setEditingSpace(null)
      setEditSpaceName('')
    }
    catch (error) {
      toast.error(t('channelManager.editSpaceFailed'))
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
        toast.success(t('channelManager.deleteSpaceSuccess'))
        await getAccountGroup()
      }
      else {
        await deleteAccountApi(deleteDialog.id)
        toast.success(t('channelManager.deleteChannelSuccess'))
        await Promise.all([getAccountList(), getAccountGroup()])
      }
      setDeleteDialog({ open: false, type: 'space', id: '', name: '' })
    }
    catch (error) {
      const errorType = deleteDialog.type === 'space' ? '空间' : '频道'
      toast.error(`删除${errorType}失败`)
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
      return

    setSortingSpaceLoading(spaceId)

    try {
      const sortedGroups = [...accountGroupList].sort((a, b) => (a.rank || 0) - (b.rank || 0))
      const currentIndex = sortedGroups.findIndex(g => g.id === spaceId)

      if (currentIndex === -1)
        return

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (newIndex < 0 || newIndex >= sortedGroups.length)
        return

      [sortedGroups[currentIndex], sortedGroups[newIndex]] = [sortedGroups[newIndex], sortedGroups[currentIndex]]

      const updateList = sortedGroups.map((group, index) => ({
        id: group.id,
        rank: index,
      }))

      await apiUpdateAccountGroupSortRank({ list: updateList })
      await getAccountGroup()
      toast.success(t('channelManager.sortSuccess'))
    }
    catch (error) {
      toast.error(t('channelManager.sortFailed'))
    }
    finally {
      setSortingSpaceLoading(null)
    }
  }, [accountGroupList, getAccountGroup, t, sortingSpaceLoading])

  // 获取空间下的频道（支持平台过滤）
  const getChannelsInSpace = useCallback((spaceId: string): SocialAccount[] => {
    let channels = accountList.filter(account => account.groupId === spaceId)

    // 根据侧边栏选择的平台过滤
    if (selectedPlatform !== 'all') {
      channels = channels.filter(account => account.type === selectedPlatform)
    }

    return channels
  }, [accountList, selectedPlatform])

  // 处理添加频道点击
  const handleAddChannel = useCallback((spaceId: string) => {
    setTargetSpaceId(spaceId)

    if (selectedPlatform === 'all') {
      // 选中"全部频道"时，进入连接频道列表页
      setCurrentView('connect-list')
    }
    else {
      // 选中具体平台时，直接进入授权流程
      startAuth(selectedPlatform as PlatType, spaceId)
    }
  }, [selectedPlatform, setCurrentView, startAuth, setTargetSpaceId])

  // 过滤后的空间列表（如果选中某平台，只显示有该平台账号的空间，或空空间）
  const filteredAccountGroupList = useMemo(() => {
    if (selectedPlatform === 'all') {
      return accountGroupList
    }

    // 选中具体平台时，显示所有空间（但频道会被过滤）
    return accountGroupList
  }, [accountGroupList, selectedPlatform])

  return (
    <div className="flex h-full">
      {/* 左侧侧边栏 */}
      <ChannelSidebar />

      {/* 右侧主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {accountLoading ? (
          <div className="flex-1 p-4">
            <SpaceListSkeleton />
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
            {/* 添加新空间 */}
            <CreateSpaceSection onSpaceCreated={getAccountGroup} />

            {/* 空间和频道列表 */}
            <ScrollArea className="h-full flex-1">
              <div className="space-y-2">
                {filteredAccountGroupList.map((space, index) => {
                  const channels = getChannelsInSpace(space.id)
                  const isEditing = editingSpace === space.id
                  const isCollapsed = collapsedSpaces.has(space.id)

                  return (
                    <SpaceItem
                      key={space.id}
                      space={space}
                      channels={channels}
                      index={index}
                      totalSpaces={filteredAccountGroupList.length}
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
                      onAddChannel={() => handleAddChannel(space.id)}
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
        )}
      </div>
    </div>
  )
}
