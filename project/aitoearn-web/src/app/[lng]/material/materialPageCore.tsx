/**
 * MaterialPageCore - 素材库核心页面
 * 素材分组和管理的核心功能页面（重构版）
 */

'use client'

import type { CreateGroupData, MediaGroup } from './materialStore'
import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Pagination } from '@/components/ui/pagination'
import { AgentAssetGroupCard } from './components/AgentAssetGroupCard'
import { CreateGroupModal } from './components/CreateGroupModal'
import { EmptyState } from './components/EmptyState'
import { MaterialGroupCard } from './components/MaterialGroupCard'
import { GroupCardSkeleton } from './components/MaterialGroupCard/GroupCardSkeleton'
import { MaterialHeader } from './components/MaterialHeader'
import { useMaterialStore } from './materialStore'

export function MaterialPageCore() {
  // 从 Store 获取状态和方法
  const {
    groups,
    total,
    isLoading,
    isSubmitting,
    isDeleting,
    currentPage,
    pageSize,
    filterType,
    searchText,
    createModalOpen,
    editingGroup,
    fetchGroups,
    setFilterType,
    setSearchText,
    setCurrentPage,
    openCreateModal,
    openEditModal,
    closeCreateModal,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useMaterialStore(
    useShallow(state => ({
      groups: state.groups,
      total: state.total,
      isLoading: state.isLoading,
      isSubmitting: state.isSubmitting,
      isDeleting: state.isDeleting,
      currentPage: state.currentPage,
      pageSize: state.pageSize,
      filterType: state.filterType,
      searchText: state.searchText,
      createModalOpen: state.createModalOpen,
      editingGroup: state.editingGroup,
      fetchGroups: state.fetchGroups,
      setFilterType: state.setFilterType,
      setSearchText: state.setSearchText,
      setCurrentPage: state.setCurrentPage,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      closeCreateModal: state.closeCreateModal,
      createGroup: state.createGroup,
      updateGroup: state.updateGroup,
      deleteGroup: state.deleteGroup,
    })),
  )

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // 初始化加载
  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  // 处理搜索（防抖后触发）
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text)
      // 搜索时重置到第一页
      if (currentPage !== 1) {
        setCurrentPage(1)
      }
      else {
        fetchGroups()
      }
    },
    [setSearchText, currentPage, setCurrentPage, fetchGroups],
  )

  // 处理分页
  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages)
        return
      setCurrentPage(page)
    },
    [totalPages, setCurrentPage],
  )

  // 处理编辑
  const handleEdit = useCallback(
    (group: MediaGroup) => {
      openEditModal(group)
    },
    [openEditModal],
  )

  // 处理删除
  const handleDelete = useCallback(
    async (id: string) => {
      await deleteGroup(id)
    },
    [deleteGroup],
  )

  // 处理创建/更新提交
  const handleSubmit = useCallback(
    async (data: CreateGroupData) => {
      if (editingGroup) {
        return await updateGroup(editingGroup._id, data)
      }
      else {
        return await createGroup(data)
      }
    },
    [editingGroup, createGroup, updateGroup],
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 顶部导航 */}
      <MaterialHeader
        total={total}
        filterType={filterType}
        onFilterChange={setFilterType}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onCreateClick={openCreateModal}
        isLoading={isLoading}
      />

      {/* 主内容区 */}
      <main className="flex-1 px-4 py-6">
        <div className="w-full mx-auto">
          {isLoading ? (
            // 加载骨架屏
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: pageSize }).map((_, index) => (
                <GroupCardSkeleton key={index} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            // 空状态
            <EmptyState onCreateClick={openCreateModal} />
          ) : (
            // 分组卡片网格
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Agent 素材分组卡片 - 仅在第一页且无类型筛选时显示 */}
                {currentPage === 1 && filterType === 'all' && <AgentAssetGroupCard />}
                {groups.map(group => (
                  <MaterialGroupCard
                    key={group._id}
                    group={group}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>

              {/* 分页器 */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onChange={handlePageChange}
                    showTotal={(totalCount, [_start, _end]) => (
                      <span className="text-sm text-muted-foreground">
                        {currentPage}
                        {' '}
                        /
                        {totalPages}
                      </span>
                    )}
                    className="w-full"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 创建/编辑弹窗 */}
      <CreateGroupModal
        open={createModalOpen}
        onClose={closeCreateModal}
        editingGroup={editingGroup}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
