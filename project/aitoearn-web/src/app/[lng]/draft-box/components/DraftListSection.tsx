/**
 * 草稿列表组件
 * 使用 react-masonry-css 瀑布流布局 + IntersectionObserver 无限滚动展示全部草稿
 * 图片保持原始比例显示
 * 创建按钮卡片作为瀑布流前两个元素
 * 支持搜索筛选、批量删除、条件删除
 */

'use client'

import type { DraftMaterial } from '@/app/[lng]/draft-box/types'
import { Check, FileText, ListChecks, Plus } from 'lucide-react'
import { memo, useCallback, useEffect, useRef } from 'react'
import Masonry from 'react-masonry-css'
import { useShallow } from 'zustand/react/shallow'
import { useDraftBoxStore } from '@/app/[lng]/draft-box/draftBoxStore'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BatchActionBar } from './BatchActionBar'
import { ConditionalDeleteDialog } from './ConditionalDeleteDialog'
import { DraftListToolbar } from './DraftListToolbar'
import { GeneratingCard } from './GeneratingCard'
import { LazyImage } from './LazyImage'

/**
 * 瀑布流断点配置
 */
const MASONRY_BREAKPOINTS = {
  default: 5, // > 1280px
  1280: 4, // <= 1280px
  1024: 3, // <= 1024px
  768: 3, // <= 768px
  640: 2, // <= 640px
}

// 手动创建按钮卡片
const ManualCreateCard = memo(({ onClick }: { onClick: () => void }) => {
  const { t } = useTransClient('brandPromotion')
  return (
    <div
      data-testid="draftbox-manual-create-card"
      className="mb-4 rounded-lg border-2 border-dashed border-foreground/20 bg-muted/30 overflow-hidden transition-all duration-300 hover:border-foreground/40 hover:bg-muted/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/10">
          <Plus className="h-7 w-7 text-foreground/70" />
        </div>
        <span className="text-base font-medium">{t('detail.manualGenerate')}</span>
      </div>
    </div>
  )
})
ManualCreateCard.displayName = 'ManualCreateCard'

// 草稿卡片 props
interface DraftCardProps {
  material: DraftMaterial
  onClick: () => void
  batchMode: boolean
  selected: boolean
  onToggleSelect: () => void
  useCountLabel?: string
}

// 草稿卡片组件（小红书风格）
const DraftCard = memo(({ material, onClick, batchMode, selected, onToggleSelect, useCountLabel }: DraftCardProps) => {
  const coverUrl = material.coverUrl || '/images/placeholder.png'

  const handleClick = useCallback(() => {
    if (batchMode) {
      onToggleSelect()
    }
    else {
      onClick()
    }
  }, [batchMode, onClick, onToggleSelect])

  return (
    <div
      data-testid="draftbox-draft-card"
      className={cn(
        'mb-4 cursor-pointer group relative',
        batchMode
          ? cn(
              'rounded-xl transition-all duration-200',
              selected ? 'shadow-lg' : '',
            )
          : '',
      )}
      onClick={handleClick}
    >
      {/* 批量模式圆形勾选指示器 */}
      {batchMode && (
        <div
          data-testid="draftbox-draft-checkbox"
          className={cn(
            'absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shadow-sm',
            selected
              ? 'bg-primary border-primary scale-110'
              : 'bg-background/90 border-muted-foreground/30 group-hover:border-primary group-hover:scale-105',
          )}
          onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
        >
          {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
        </div>
      )}

      {/* 封面图 - 保持原始比例，圆角独立 */}
      <div className="relative w-full overflow-hidden rounded-xl">
        <LazyImage
          src={coverUrl}
          alt={material.title || '草稿'}
          width={400}
          height={300}
          className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
          skeletonClassName="rounded-xl"
          placeholderHeight={150}
          style={{ aspectRatio: 'auto' }}
        />

        {/* hover 时显示描述遮罩 - 批量模式下隐藏 */}
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
      {/* 标题和模型标签 */}
      <div className="pt-2 px-1">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {material.title || '未命名草稿'}
        </p>
        {material.model && (
          <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">
            {material.model}
          </span>
        )}
        {useCountLabel && (
          <span className="inline-block mt-1 ml-1 px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary">
            {useCountLabel}
          </span>
        )}
      </div>
    </div>
  )
})

DraftCard.displayName = 'DraftCard'

// 骨架屏 - 随机高度模拟瀑布流效果（小红书风格）
function DraftCardSkeleton({ index }: { index: number }) {
  // 根据 index 生成不同高度，模拟真实图片的随机比例
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
const LoadingIndicator = memo(() => (
  <div className="flex justify-center py-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <span>加载中...</span>
    </div>
  </div>
))

LoadingIndicator.displayName = 'LoadingIndicator'

export const DraftListSection = memo(() => {
  const { t } = useTransClient('brandPromotion')

  // 无限滚动加载触发器
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    materials,
    materialsLoading,
    materialsPagination,
    currentPlan,
    generatingCount,
    batchMode,
    selectedMaterialIds,
  } = useDraftBoxStore(
    useShallow(state => ({
      materials: state.materials,
      materialsLoading: state.materialsLoading,
      materialsPagination: state.materialsPagination,
      currentPlan: state.currentPlan,
      generatingCount: state.generatingCount,
      batchMode: state.batchMode,
      selectedMaterialIds: state.selectedMaterialIds,
    })),
  )

  const openCreateMaterialModal = useDraftBoxStore(state => state.openCreateMaterialModal)
  const loadMoreMaterials = useDraftBoxStore(state => state.loadMoreMaterials)
  const openDraftDetailDialog = useDraftBoxStore(state => state.openDraftDetailDialog)
  const openGenerationDetailDialog = useDraftBoxStore(state => state.openGenerationDetailDialog)
  const toggleMaterialSelection = useDraftBoxStore(state => state.toggleMaterialSelection)

  const selectedSet = new Set(selectedMaterialIds)

  // IntersectionObserver 实现无限滚动
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && materialsPagination.hasMore && !materialsLoading && currentPlan) {
          loadMoreMaterials(currentPlan._id)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(loadMoreElement)

    return () => {
      observer.disconnect()
    }
  }, [materialsPagination.hasMore, materialsLoading, currentPlan, loadMoreMaterials])

  // 初始加载骨架屏
  if (materialsLoading && materials.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('overview.draftList', { count: materialsPagination.total })}</CardTitle>
            <Button variant="ghost" size="sm" onClick={openGenerationDetailDialog} className="cursor-pointer gap-1.5 text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              {t('draftManage.generationDetail')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            <ManualCreateCard onClick={openCreateMaterialModal} />
            {/* 骨架屏 */}
            {Array.from({ length: 8 }).map((_, i) => (
              <DraftCardSkeleton key={i} index={i} />
            ))}
          </Masonry>
        </CardContent>
      </Card>
    )
  }

  // 空状态：加载完成且无草稿
  if (!materialsLoading && materials.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('overview.draftList', { count: 0 })}</CardTitle>
            <Button variant="ghost" size="sm" onClick={openGenerationDetailDialog} className="cursor-pointer gap-1.5 text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              {t('draftManage.generationDetail')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-muted-foreground">{t('material.emptyTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground/70">{t('material.emptyDesc')}</p>
            </div>
            <Button onClick={openCreateMaterialModal} className="cursor-pointer mt-2 gap-1.5">
              <Plus className="h-4 w-4" />
              {t('detail.manualGenerate')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('overview.draftList', { count: materialsPagination.total })}</CardTitle>
          <Button variant="ghost" size="sm" onClick={openGenerationDetailDialog} className="cursor-pointer gap-1.5 text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />
            {t('draftManage.generationDetail')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn(batchMode && 'pb-16')}>
        <DraftListToolbar />
        <div>
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
            data-testid="draftbox-masonry-list"
          >
            {!batchMode && (
              <ManualCreateCard onClick={openCreateMaterialModal} />
            )}

            {/* 生成中卡片 - 批量模式隐藏 */}
            {!batchMode && generatingCount > 0 && (
              <GeneratingCard count={generatingCount} onClick={openGenerationDetailDialog} />
            )}

            {/* 草稿数据 */}
            {materials.map(material => (
              <DraftCard
                key={material._id}
                material={material}
                onClick={() => openDraftDetailDialog(material)}
                batchMode={batchMode}
                selected={selectedSet.has(material._id)}
                onToggleSelect={() => toggleMaterialSelection(material._id)}
                useCountLabel={material.useCount != null && material.useCount > 0 ? t('material.useCount', { count: material.useCount }) : undefined}
              />
            ))}
          </Masonry>

          {/* 加载触发器 */}
          <div ref={loadMoreRef} />

          {/* 加载更多指示器 */}
          {materialsLoading && <LoadingIndicator />}

          {/* 没有更多数据 */}
          {!materialsPagination.hasMore && materials.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-muted-foreground">
                {t('common.noMore', '没有更多了')}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {/* 批量模式底部操作栏 */}
      {batchMode && <BatchActionBar />}

      {/* 条件删除弹窗 */}
      <ConditionalDeleteDialog />
    </Card>
  )
})

DraftListSection.displayName = 'DraftListSection'
