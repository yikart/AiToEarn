/**
 * MediaListSection - 媒体列表区域
 * 瀑布流布局 + IntersectionObserver 无限滚动展示视频/图片
 * 支持批量选择和删除
 */

'use client'

import type { MediaItem } from '@/api/types/media'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { ArrowRightLeft, ImageIcon, Loader2, Trash2, Video } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import Masonry from 'react-masonry-css'
import { useShallow } from 'zustand/react/shallow'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { confirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { getOssUrl } from '@/utils/oss'
import { useDraftReferenceMaxImages } from '../../hooks/useDraftReferenceMaxImages'
import { useTransferDraftDialogStore } from '../../transferDraftDialogStore'
import { useMediaTabStore } from '../ContentTabs/mediaTabStore'
import {
  GeneratingTaskCard,
  getDraftGenerationTaskTarget,
  shouldShowDraftGenerationTaskCard,
} from '../GeneratingCard'
import { LOAD_MORE_OBSERVER_OPTIONS } from '../loadMoreObserver'
import { MediaAddToReferenceAction } from '../MediaAddToReferenceAction'
import { MediaCard } from '../MediaCard'
import { VideoCreateDraftAction } from '../VideoCreateDraftAction'

/**
 * 瀑布流断点配置
 */
const MASONRY_BREAKPOINTS = {
  default: 5,
  1280: 4,
  1024: 3,
  768: 3,
  640: 2,
}

interface MediaListSectionProps {
  type: 'video' | 'img'
  materialGroupId: string
  showBatchDeleteTrigger?: boolean
}

// 骨架屏
function MediaCardSkeleton({ index }: { index: number }) {
  const heights = [120, 160, 200, 140, 180, 150, 170, 190]
  const height = heights[index % heights.length]

  return (
    <div className="mb-4">
      <Skeleton className="w-full rounded-xl" style={{ height: `${height}px` }} />
    </div>
  )
}

// 加载更多指示器
const LoadingIndicator = memo(() => (
  <div className="flex justify-center py-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  </div>
))
LoadingIndicator.displayName = 'LoadingIndicator'

export const MediaListSection = memo(({ type, materialGroupId, showBatchDeleteTrigger = true }: MediaListSectionProps) => {
  const { t } = useTransClient('material')
  const { t: tBrand } = useTransClient('brandPromotion')
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const draftReferenceMaxImages = useDraftReferenceMaxImages(materialGroupId)
  const generationTasks = usePlanDetailStore(state => state.generationTasks)
  const openGenerationDetailDialog = usePlanDetailStore(state => state.openGenerationDetailDialog)

  const { list, loading, hasMore, initialized, total } = useMediaTabStore(
    useShallow(state => ({
      list: state[type].list,
      loading: state[type].loading,
      hasMore: state[type].hasMore,
      initialized: state[type].initialized,
      total: state[type].total,
    })),
  )

  const { previewOpen, previewIndex, previewType } = useMediaTabStore(
    useShallow(state => ({
      previewOpen: state.previewOpen,
      previewIndex: state.previewIndex,
      previewType: state.previewType,
    })),
  )

  const { batchMode, selectedItems, batchDeleting } = useMediaTabStore(
    useShallow(state => ({
      batchMode: state.batchMode,
      selectedItems: state.selectedItems,
      batchDeleting: state.batchDeleting,
    })),
  )

  const { fetchMediaList, loadMore, openPreview, closePreview, enterBatchMode, exitBatchMode, toggleSelection, selectAllLoaded, deselectAll, batchDeleteByType } = useMediaTabStore(
    useShallow(state => ({
      fetchMediaList: state.fetchMediaList,
      loadMore: state.loadMore,
      openPreview: state.openPreview,
      closePreview: state.closePreview,
      enterBatchMode: state.enterBatchMode,
      exitBatchMode: state.exitBatchMode,
      toggleSelection: state.toggleSelection,
      selectAllLoaded: state.selectAllLoaded,
      deselectAll: state.deselectAll,
      batchDeleteByType: state.batchDeleteByType,
    })),
  )

  const openTransferDialog = useTransferDraftDialogStore(state => state.openDialog)

  // 当前 Tab 类型的选中 ID 列表
  const selectedIds = useMemo(() => {
    return Object.entries(selectedItems)
      .filter(([_, source]) => source === type)
      .map(([id]) => id)
  }, [selectedItems, type])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected = list.length > 0 && selectedIds.length === list.length
  const visibleGenerationTasks = useMemo(() => {
    const target = type === 'video' ? 'video' : 'img'
    return generationTasks
      .filter(shouldShowDraftGenerationTaskCard)
      .filter(task => getDraftGenerationTaskTarget(task) === target)
  }, [generationTasks, type])

  // 首次加载
  useEffect(() => {
    if (!initialized && materialGroupId) {
      fetchMediaList(materialGroupId, type)
    }
  }, [initialized, materialGroupId, type, fetchMediaList])

  // IntersectionObserver 无限滚动
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading && materialGroupId) {
          loadMore(materialGroupId, type)
        }
      },
      LOAD_MORE_OBSERVER_OPTIONS,
    )

    observer.observe(loadMoreElement)
    return () => observer.disconnect()
  }, [hasMore, loading, materialGroupId, type, loadMore])

  // 点击媒体卡片
  const handleMediaClick = useCallback((media: MediaItem) => {
    const index = list.findIndex(m => m._id === media._id)
    if (index !== -1) {
      openPreview(type, index)
    }
  }, [list, type, openPreview])

  // 全选/取消全选
  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      deselectAll()
    }
    else {
      selectAllLoaded(type)
    }
  }, [allSelected, deselectAll, selectAllLoaded, type])

  // 批量删除
  const handleBatchDelete = useCallback(() => {
    if (selectedIds.length === 0)
      return

    confirm({
      title: t('mediaManagement.batchDeleteConfirmTitle'),
      content: t('mediaManagement.batchDeleteConfirmDesc', { count: selectedIds.length }),
      okType: 'destructive',
      onOk: async () => {
        const success = await batchDeleteByType(materialGroupId, type)
        if (success) {
          toast.success(t('mediaManagement.batchDeleteSuccess'))
        }
        else {
          toast.error(t('mediaManagement.batchDeleteFailed'))
        }
      },
    })
  }, [selectedIds.length, batchDeleteByType, materialGroupId, type, t])

  const handleTransfer = useCallback(() => {
    if (selectedIds.length === 0) {
      return
    }

    openTransferDialog({
      currentPlanId: materialGroupId,
      draftIds: [],
      mediaIds: selectedIds,
    })
  }, [materialGroupId, openTransferDialog, selectedIds])

  // 预览项列表
  const previewItems = useMemo((): MediaPreviewItem[] => {
    return list.map(media => ({
      type: media.type === 'video' ? 'video' : 'image',
      src: getOssUrl(media.url),
      title: media.title,
    }))
  }, [list])

  // 初始加载骨架屏
  if (loading && list.length === 0) {
    return (
      <Masonry
        breakpointCols={MASONRY_BREAKPOINTS}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <MediaCardSkeleton key={i} index={i} />
        ))}
      </Masonry>
    )
  }

  // 空状态
  if (initialized && list.length === 0 && visibleGenerationTasks.length === 0) {
    const Icon = type === 'video' ? Video : ImageIcon
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          {type === 'video' ? t('mediaManagement.noVideo') : t('mediaManagement.noImage')}
        </p>
        <p className="text-sm text-muted-foreground">
          {type === 'video' ? t('mediaManagement.noVideoDesc') : t('mediaManagement.noImageDesc')}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* 工具栏 */}
      {batchMode
        ? (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={handleToggleSelectAll}>
                <Checkbox checked={allSelected} onCheckedChange={handleToggleSelectAll} />
                <span className="text-sm">{t('mediaManagement.selectAll')}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {t('mediaManagement.selectedCount', { count: selectedIds.length })}
              </span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleTransfer}
                disabled={selectedIds.length === 0 || batchDeleting}
                className="cursor-pointer gap-1.5"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                {tBrand('draftManage.transfer')}
              </Button>
              <Button variant="ghost" size="sm" onClick={exitBatchMode} className="cursor-pointer">
                {t('mediaManagement.cancel')}
              </Button>
            </div>
          )
        : (
            showBatchDeleteTrigger
              ? (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={enterBatchMode}
                      className="cursor-pointer gap-1.5"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      {tBrand('draftManage.batchTransfer')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={enterBatchMode}
                      className="cursor-pointer gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('mediaManagement.batchDelete')}
                    </Button>
                  </div>
                )
              : null
          )}

      <Masonry
        breakpointCols={MASONRY_BREAKPOINTS}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {!batchMode && visibleGenerationTasks.map(task => (
          <GeneratingTaskCard key={task.id} task={task} onClick={openGenerationDetailDialog} />
        ))}
        {list.map(media => (
          <MediaCard
            key={media._id}
            media={media}
            onClick={handleMediaClick}
            batchMode={batchMode}
            selected={selectedSet.has(media._id)}
            onToggleSelect={() => toggleSelection(media._id, type)}
            actions={
              media.type === 'video'
                ? <VideoCreateDraftAction media={media} groupId={materialGroupId} />
                : <MediaAddToReferenceAction media={media} groupId={materialGroupId} maxImages={draftReferenceMaxImages} />
            }
          />
        ))}
      </Masonry>

      {/* 加载触发器 */}
      <div ref={loadMoreRef} />

      {/* 加载更多指示器 */}
      {loading && <LoadingIndicator />}

      {/* 没有更多数据 */}
      {!hasMore && list.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">
            {t('mediaManagement.loadedAll')}
          </span>
        </div>
      )}

      {/* 批量模式底部操作栏 */}
      {batchMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 py-3">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <span className="text-sm text-muted-foreground">
              {t('mediaManagement.selectedCount', { count: selectedIds.length })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTransfer}
                disabled={selectedIds.length === 0 || batchDeleting}
                className="cursor-pointer gap-1.5"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                {tBrand('draftManage.transfer')}
              </Button>
              <Button variant="ghost" size="sm" onClick={exitBatchMode} className="cursor-pointer">
                {t('mediaManagement.cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.length === 0 || batchDeleting}
                className="cursor-pointer gap-1.5"
              >
                {batchDeleting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
                {t('mediaManagement.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 媒体预览弹窗 - 仅当前 type 匹配时渲染 */}
      {previewType === type && (
        <MediaPreview
          open={previewOpen}
          items={previewItems}
          initialIndex={previewIndex}
          onClose={closePreview}
        />
      )}
    </>
  )
})

MediaListSection.displayName = 'MediaListSection'
