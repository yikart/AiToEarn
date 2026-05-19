/**
 * AllListSection - 全部列表区域
 * 合并草稿、视频、图片三种数据源，瀑布流布局 + IntersectionObserver 无限滚动
 * 根据数据来源分发渲染 DraftCard 或 MediaCard
 * 支持批量选择和混合删除（草稿调 apiBatchDeleteMaterials，媒体调 batchDeleteMedia）
 */

'use client'

import type { MediaItem } from '@/api/types/media'
import type { PromotionMaterial } from '@/app/[lng]/brand-promotion/brandPromotionStore/types'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { ArrowRightLeft, Check, Inbox, Loader2, Trash2 } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import { useDraftReferenceMaxImages } from '../../hooks/useDraftReferenceMaxImages'
import { useTransferDraftDialogStore } from '../../transferDraftDialogStore'
import { useMediaTabStore } from '../ContentTabs/mediaTabStore'
import { GeneratingTaskCard, shouldShowDraftGenerationTaskCard } from '../GeneratingCard'
import { LazyImage } from '../LazyImage'
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

// 骨架屏
function AllCardSkeleton({ index }: { index: number }) {
  const heights = [120, 160, 200, 140, 180, 150, 170, 190]
  const height = heights[index % heights.length]

  return (
    <div className="mb-4">
      <Skeleton className="w-full rounded-xl" style={{ height: `${height}px` }} />
      <div className="pt-2 px-1">
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}

// 加载更多指示器
const LoadingIndicator = memo(({ label }: { label: string }) => (
  <div className="flex justify-center py-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <span>{label}</span>
    </div>
  </div>
))
LoadingIndicator.displayName = 'LoadingIndicator'

/** 草稿卡片（用于全部列表，支持批量模式） */
const AllDraftCard = memo(({ material, onClick, batchMode, selected, onToggleSelect }: {
  material: PromotionMaterial
  onClick: () => void
  batchMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}) => {
  const coverUrl = material.coverUrl || '/images/placeholder.png'

  const handleClick = useCallback(() => {
    if (batchMode) {
      onToggleSelect?.()
    }
    else {
      onClick()
    }
  }, [batchMode, onClick, onToggleSelect])

  return (
    <div
      className={cn(
        'mb-4 cursor-pointer group relative',
        batchMode && selected && 'rounded-xl shadow-lg',
      )}
      onClick={handleClick}
    >
      {/* 批量模式圆形勾选指示器 */}
      {batchMode && (
        <div
          className={cn(
            'absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shadow-sm',
            selected
              ? 'bg-primary border-primary scale-110'
              : 'bg-background/90 border-muted-foreground/30 group-hover:border-primary group-hover:scale-105',
          )}
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.() }}
        >
          {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
        </div>
      )}

      <div className="relative w-full overflow-hidden rounded-xl">
        <LazyImage
          src={coverUrl}
          alt={material.title || ''}
          width={400}
          height={300}
          className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
          skeletonClassName="rounded-xl"
          placeholderHeight={150}
          style={{ aspectRatio: 'auto' }}
        />
        {!batchMode && material.desc && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 rounded-xl">
            <p className="text-white text-xs line-clamp-4">
              {material.desc}
            </p>
          </div>
        )}
        {/* 选中遮罩 */}
        {batchMode && selected && (
          <div className="absolute inset-0 bg-primary/15 pointer-events-none rounded-xl" />
        )}
      </div>
      <div className="pt-2 px-1">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {material.title || ''}
        </p>
        {material.model && (
          <span className="inline-block mt-1 px-1.5 py-0.5 text-xs rounded bg-muted text-muted-foreground">
            {material.model}
          </span>
        )}
      </div>
    </div>
  )
})
AllDraftCard.displayName = 'AllDraftCard'

interface AllListSectionProps {
  materialGroupId: string
  showBatchDeleteTrigger?: boolean
}

export const AllListSection = memo(({ materialGroupId, showBatchDeleteTrigger = true }: AllListSectionProps) => {
  const { t } = useTransClient('material')
  const { t: tBrand } = useTransClient('brandPromotion')
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const draftReferenceMaxImages = useDraftReferenceMaxImages(materialGroupId)

  const currentPlan = usePlanDetailStore(state => state.currentPlan)
  const generationTasks = usePlanDetailStore(state => state.generationTasks)
  const openDraftDetailDialog = usePlanDetailStore(state => state.openDraftDetailDialog)
  const openGenerationDetailDialog = usePlanDetailStore(state => state.openGenerationDetailDialog)

  const { mergedList, loading, initialized, allExhausted } = useMediaTabStore(
    useShallow(state => ({
      mergedList: state.all.mergedList,
      loading: state.all.loading,
      initialized: state.all.initialized,
      allExhausted: state.all.allExhausted,
    })),
  )

  const { batchMode, selectedItems, batchDeleting } = useMediaTabStore(
    useShallow(state => ({
      batchMode: state.batchMode,
      selectedItems: state.selectedItems,
      batchDeleting: state.batchDeleting,
    })),
  )

  const fetchAllList = useMediaTabStore(state => state.fetchAllList)
  const loadMoreAll = useMediaTabStore(state => state.loadMoreAll)
  const enterBatchMode = useMediaTabStore(state => state.enterBatchMode)
  const exitBatchMode = useMediaTabStore(state => state.exitBatchMode)
  const toggleSelection = useMediaTabStore(state => state.toggleSelection)
  const selectAllLoaded = useMediaTabStore(state => state.selectAllLoaded)
  const deselectAll = useMediaTabStore(state => state.deselectAll)
  const batchDeleteAll = useMediaTabStore(state => state.batchDeleteAll)
  const openTransferDialog = useTransferDraftDialogStore(state => state.openDialog)

  // 媒体预览状态
  const { previewOpen, previewIndex, previewType } = useMediaTabStore(
    useShallow(state => ({
      previewOpen: state.previewOpen,
      previewIndex: state.previewIndex,
      previewType: state.previewType,
    })),
  )
  const openPreview = useMediaTabStore(state => state.openPreview)
  const closePreview = useMediaTabStore(state => state.closePreview)

  const selectedCount = Object.keys(selectedItems).length
  const allSelected = mergedList.length > 0 && selectedCount === mergedList.length
  const visibleGenerationTasks = useMemo(
    () => generationTasks.filter(shouldShowDraftGenerationTaskCard),
    [generationTasks],
  )
  const showGenerationTasks = !batchMode && visibleGenerationTasks.length > 0

  // 首次加载
  useEffect(() => {
    if (!initialized && materialGroupId && currentPlan) {
      fetchAllList(materialGroupId, currentPlan.id)
    }
  }, [initialized, materialGroupId, currentPlan, fetchAllList])

  // IntersectionObserver 无限滚动
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !allExhausted && !loading && materialGroupId && currentPlan) {
          loadMoreAll(materialGroupId, currentPlan.id)
        }
      },
      LOAD_MORE_OBSERVER_OPTIONS,
    )

    observer.observe(loadMoreElement)
    return () => observer.disconnect()
  }, [allExhausted, loading, materialGroupId, currentPlan, loadMoreAll])

  // 媒体卡片点击 - 打开预览
  const handleMediaClick = useCallback((media: MediaItem) => {
    // 找到在合并列表中同类型媒体的索引（用于预览导航）
    const mediaItems = mergedList.filter(item => item.source === media.type)
    const index = mediaItems.findIndex(item => item.id === media._id)
    if (index !== -1) {
      openPreview(media.type as 'video' | 'img', index)
    }
  }, [mergedList, openPreview])

  // 全选/取消全选
  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      deselectAll()
    }
    else {
      selectAllLoaded('all')
    }
  }, [allSelected, deselectAll, selectAllLoaded])

  // 批量删除
  const handleBatchDelete = useCallback(() => {
    if (selectedCount === 0)
      return

    confirm({
      title: t('mediaManagement.batchDeleteConfirmTitle'),
      content: t('mediaManagement.batchDeleteConfirmDesc', { count: selectedCount }),
      okType: 'destructive',
      onOk: async () => {
        const success = await batchDeleteAll(materialGroupId, currentPlan?.id || '')
        if (success) {
          toast.success(t('mediaManagement.batchDeleteSuccess'))
        }
        else {
          toast.error(t('mediaManagement.batchDeleteFailed'))
        }
      },
    })
  }, [selectedCount, batchDeleteAll, materialGroupId, currentPlan, t])

  const handleTransfer = useCallback(() => {
    if (selectedCount === 0) {
      return
    }

    const draftIds: string[] = []
    const mediaIds: string[] = []

    Object.entries(selectedItems).forEach(([id, source]) => {
      if (source === 'draft') {
        draftIds.push(id)
      }
      else {
        mediaIds.push(id)
      }
    })

    openTransferDialog({
      currentPlanId: materialGroupId,
      draftIds,
      mediaIds,
    })
  }, [materialGroupId, openTransferDialog, selectedCount, selectedItems])

  // 预览项列表（按当前预览类型过滤）
  const previewItems = useMemo((): MediaPreviewItem[] => {
    return mergedList
      .filter(item => item.source === previewType)
      .map((item) => {
        const media = item.data as MediaItem
        return {
          type: media.type === 'video' ? 'video' as const : 'image' as const,
          src: getOssUrl(media.url),
          title: media.title,
        }
      })
  }, [mergedList, previewType])

  // 初始加载骨架屏
  if (loading && mergedList.length === 0) {
    return (
      <Masonry
        breakpointCols={MASONRY_BREAKPOINTS}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <AllCardSkeleton key={i} index={i} />
        ))}
      </Masonry>
    )
  }

  // 空状态
  if (initialized && mergedList.length === 0 && !showGenerationTasks) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          {t('mediaManagement.noMedia')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('mediaManagement.noMediaDesc')}
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
                {t('mediaManagement.selectedCount', { count: selectedCount })}
              </span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleTransfer}
                disabled={selectedCount === 0 || batchDeleting}
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
        {showGenerationTasks && visibleGenerationTasks.map(task => (
          <GeneratingTaskCard key={task.id} task={task} onClick={openGenerationDetailDialog} />
        ))}
        {mergedList.map((item) => {
          if (item.source === 'draft') {
            const material = item.data as PromotionMaterial
            return (
              <AllDraftCard
                key={`draft-${item.id}`}
                material={material}
                onClick={() => openDraftDetailDialog(material)}
                batchMode={batchMode}
                selected={!!selectedItems[item.id]}
                onToggleSelect={() => toggleSelection(item.id, 'draft')}
              />
            )
          }
          else {
            const media = item.data as MediaItem
            return (
              <MediaCard
                key={`${item.source}-${item.id}`}
                media={media}
                onClick={handleMediaClick}
                batchMode={batchMode}
                selected={!!selectedItems[item.id]}
                onToggleSelect={() => toggleSelection(item.id, item.source as 'video' | 'img')}
                actions={
                  item.source === 'video'
                    ? <VideoCreateDraftAction media={media} groupId={materialGroupId} />
                    : <MediaAddToReferenceAction media={media} groupId={materialGroupId} maxImages={draftReferenceMaxImages} />
                }
              />
            )
          }
        })}
      </Masonry>

      {/* 加载触发器 */}
      <div ref={loadMoreRef} />

      {/* 加载更多指示器 */}
      {loading && <LoadingIndicator label={tBrand('common.loading')} />}

      {/* 没有更多数据 */}
      {allExhausted && mergedList.length > 0 && (
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
              {t('mediaManagement.selectedCount', { count: selectedCount })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTransfer}
                disabled={selectedCount === 0 || batchDeleting}
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
                disabled={selectedCount === 0 || batchDeleting}
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

      {/* 媒体预览弹窗 */}
      <MediaPreview
        open={previewOpen}
        items={previewItems}
        initialIndex={previewIndex}
        onClose={closePreview}
      />
    </>
  )
})

AllListSection.displayName = 'AllListSection'
