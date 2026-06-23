/**
 * 草稿列表组件
 * 使用 react-masonry-css 瀑布流布局 + IntersectionObserver 无限滚动展示全部草稿
 * 图片保持原始比例显示
 * 创建按钮卡片作为瀑布流前两个元素
 * 支持搜索筛选、批量删除、条件删除
 * 当传入 materialGroupId 时，集成 Tab（草稿箱/视频/图片）
 */

'use client'

import type { PromotionMaterial } from '@/api/materials/material.types'
import type { PlatType } from '@/app/config/platConfig'
import { ArrowRightLeft, Check, ListChecks, Plus, Trash2 } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import Masonry from 'react-masonry-css'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { OssImage } from '@/components/common/OssImage'
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlanDetailStore } from '@/store/draft-box/planDetailStore'
import { getPlatformInfoSync } from '@/store/platformMetadata'
import { cn } from '@/utils/className'
import { useContainerMasonryColumns } from '../hooks/useContainerMasonryColumns'
import { getMaterialUseCountLabels } from '../utils/materialUseCount'
import { AllListSection } from './AllListSection'
import { BatchActionBar } from './BatchActionBar'
import { ConditionalDeleteDialog } from './ConditionalDeleteDialog'
import { useMediaTabStore } from './ContentTabs/mediaTabStore'
import { DraftListToolbar } from './DraftListToolbar'
import {
  GeneratingTaskCard,
  getDraftGenerationTaskTarget,
  shouldShowDraftGenerationTaskCard,
} from './GeneratingCard'
import { LazyImage } from './LazyImage'
import { LOAD_MORE_OBSERVER_OPTIONS } from './loadMoreObserver'
import { MediaListSection } from './MediaListSection'
import { PublishDialogDragSource } from './PublishDialogDragSource'

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
  material: PromotionMaterial
  onClick: () => void
  batchMode: boolean
  selected: boolean
  onToggleSelect: () => void
  useCountLabels?: string[]
  enablePublishDrag?: boolean
}

// 草稿卡片组件（小红书风格）
const DraftCard = memo(({ material, onClick, batchMode, selected, onToggleSelect, useCountLabels = [], enablePublishDrag }: DraftCardProps) => {
  const { t } = useTransClient('brandPromotion')
  const coverUrl = material.coverUrl || '/images/placeholder.png'
  const canPublishDrag = !!enablePublishDrag && !batchMode

  const handleClick = useCallback(() => {
    if (batchMode) {
      onToggleSelect()
    }
    else {
      onClick()
    }
  }, [batchMode, onClick, onToggleSelect])

  const cardNode = (
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
              ? 'border-transparent bg-gradient-back scale-110'
              : 'bg-background/90 border-muted-foreground/30 group-hover:border-primary group-hover:scale-105',
          )}
          onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
        >
          {selected && <Check className="w-3.5 h-3.5 text-gradient-foreground" />}
        </div>
      )}

      {/* 封面图 - 保持原始比例，圆角独立 */}
      <div className="relative w-full overflow-hidden rounded-xl">
        <LazyImage
          src={coverUrl}
          alt={material.title || t('material.draft')}
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
          {material.title || t('material.untitled')}
        </p>
        {material.model && (
          <span className="inline-block mt-1 px-1.5 py-0.5 text-xs rounded bg-muted text-muted-foreground">
            {material.model}
          </span>
        )}
        {useCountLabels.map(label => (
          <span
            key={label}
            className="inline-block mt-1 ml-1 px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary"
          >
            {label}
          </span>
        ))}
        {material.accountTypes && material.accountTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {material.accountTypes.map((type) => {
              const platInfo = getPlatformInfoSync(type as PlatType)
              if (!platInfo)
                return null
              return (
                <OssImage
                  key={type}
                  src={platInfo.icon}
                  alt={platInfo.name}
                  width={16}
                  height={16}
                  className="w-4 h-4"
                  unoptimized
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  if (!canPublishDrag)
    return cardNode

  return (
    <PublishDialogDragSource dragItem={{ kind: 'draft', material }}>
      {cardNode}
    </PublishDialogDragSource>
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
const LoadingIndicator = memo(({ label }: { label: string }) => (
  <div className="flex justify-center py-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <span>{label}</span>
    </div>
  </div>
))

LoadingIndicator.displayName = 'LoadingIndicator'

interface DraftListSectionProps {
  materialGroupId: string
  tabs?: DraftListSectionTab[]
  defaultTab?: DraftListSectionTab
  allowTransfer?: boolean
  batchActionPosition?: 'fixed' | 'sticky'
  useContainerResponsive?: boolean
  enablePublishDrag?: boolean
}

export type DraftListSectionTab = 'all' | 'drafts' | 'video' | 'img'

const DEFAULT_DRAFT_LIST_TABS: DraftListSectionTab[] = ['all', 'drafts', 'video', 'img']

export const DraftListSection = memo(({
  materialGroupId,
  tabs = DEFAULT_DRAFT_LIST_TABS,
  defaultTab = 'all',
  allowTransfer = true,
  batchActionPosition = 'fixed',
  useContainerResponsive = false,
  enablePublishDrag = false,
}: DraftListSectionProps) => {
  const { t } = useTransClient('brandPromotion')
  const { t: tMaterial } = useTransClient('material')
  const visibleTabs = useMemo(() => tabs.length > 0 ? tabs : DEFAULT_DRAFT_LIST_TABS, [tabs])
  const resolvedDefaultTab = visibleTabs.includes(defaultTab) ? defaultTab : visibleTabs[0]
  const [activeTab, setActiveTab] = useState<DraftListSectionTab>(resolvedDefaultTab)
  const hasAllTab = visibleTabs.includes('all')
  const hasDraftsTab = visibleTabs.includes('drafts')
  const hasVideoTab = visibleTabs.includes('video')
  const hasImgTab = visibleTabs.includes('img')
  const showTabsList = visibleTabs.length > 1
  const { containerRef, masonryColumns } = useContainerMasonryColumns(useContainerResponsive)
  const masonryBreakpointCols = useContainerResponsive ? masonryColumns : MASONRY_BREAKPOINTS

  // materialGroupId 变化时，默认选中配置的 Tab
  useEffect(() => {
    setActiveTab(resolvedDefaultTab)
  }, [materialGroupId, resolvedDefaultTab])

  // 无限滚动加载触发器（使用 callback ref + state，确保 Tab 切换后 observer 能正确绑定）
  const [loadMoreElement, setLoadMoreElement] = useState<HTMLDivElement | null>(null)
  const loadMoreCallbackRef = useCallback((node: HTMLDivElement | null) => {
    setLoadMoreElement(node)
  }, [])

  const {
    materials,
    materialsLoading,
    materialsPagination,
    generationTasks,
    batchMode,
    selectedMaterialIds,
    openCreateMaterialModal,
    loadMoreMaterials,
    openDraftDetailDialog,
    openGenerationDetailDialog,
    toggleMaterialSelection,
    fetchMaterials,
  } = usePlanDetailStore(
    useShallow(state => ({
      materials: state.materials,
      materialsLoading: state.materialsLoading,
      materialsPagination: state.materialsPagination,
      generationTasks: state.generationTasks,
      batchMode: state.batchMode,
      selectedMaterialIds: state.selectedMaterialIds,
      openCreateMaterialModal: state.openCreateMaterialModal,
      loadMoreMaterials: state.loadMoreMaterials,
      openDraftDetailDialog: state.openDraftDetailDialog,
      openGenerationDetailDialog: state.openGenerationDetailDialog,
      toggleMaterialSelection: state.toggleMaterialSelection,
      fetchMaterials: state.fetchMaterials,
    })),
  )

  const { draftTotal, videoTotal, imgTotal } = useMediaTabStore(
    useShallow(state => ({
      draftTotal: state.all.draftTotal,
      videoTotal: state.video.initialized ? state.video.total : state.all.videoTotal,
      imgTotal: state.img.initialized ? state.img.total : state.all.imgTotal,
    })),
  )

  const selectedSet = new Set(selectedMaterialIds)
  const visibleGenerationTasks = useMemo(
    () => generationTasks.filter(shouldShowDraftGenerationTaskCard),
    [generationTasks],
  )
  const visibleDraftGenerationTasks = useMemo(
    () => visibleGenerationTasks.filter(task => getDraftGenerationTaskTarget(task) === 'draft'),
    [visibleGenerationTasks],
  )
  const visibleVideoGenerationTasks = useMemo(
    () => visibleGenerationTasks.filter(task => getDraftGenerationTaskTarget(task) === 'video'),
    [visibleGenerationTasks],
  )
  const visibleImageGenerationTasks = useMemo(
    () => visibleGenerationTasks.filter(task => getDraftGenerationTaskTarget(task) === 'img'),
    [visibleGenerationTasks],
  )
  const allTotal = draftTotal + videoTotal + imgTotal + visibleGenerationTasks.length

  const exitMediaBatchMode = useMediaTabStore(state => state.exitBatchMode)
  const enterMediaBatchMode = useMediaTabStore(state => state.enterBatchMode)
  const mediaBatchMode = useMediaTabStore(state => state.batchMode)
  const exitDraftBatchMode = usePlanDetailStore(state => state.exitBatchMode)

  // Tab 切换处理
  const handleTabChange = useCallback((value: string) => {
    if (!visibleTabs.includes(value as DraftListSectionTab))
      return

    // 切换 Tab 时退出所有批量模式
    exitDraftBatchMode()
    exitMediaBatchMode()

    setActiveTab(value as DraftListSectionTab)

    // 草稿 Tab 无独立列表组件，仍在这里兜底首次加载；媒体/全部 Tab 交由各自内容组件加载。
    if (value === 'drafts' && !usePlanDetailStore.getState().materialsInitialized && materialGroupId) {
      fetchMaterials(materialGroupId, 1)
    }
  }, [materialGroupId, exitDraftBatchMode, exitMediaBatchMode, fetchMaterials, visibleTabs])

  // IntersectionObserver 实现无限滚动
  useEffect(() => {
    if (!loadMoreElement)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && materialsPagination.hasMore && !materialsLoading && materialGroupId) {
          loadMoreMaterials(materialGroupId)
        }
      },
      LOAD_MORE_OBSERVER_OPTIONS,
    )

    observer.observe(loadMoreElement)

    return () => {
      observer.disconnect()
    }
  }, [loadMoreElement, materialsPagination.hasMore, materialsLoading, materialGroupId, loadMoreMaterials])

  // 根据 activeTab 获取标题
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'all':
        return tMaterial('mediaManagement.all')
      case 'video':
        return tMaterial('mediaManagement.video')
      case 'img':
        return tMaterial('mediaManagement.image')
      default:
        return tMaterial('mediaManagement.drafts', '草稿')
    }
  }

  const getActiveTabCount = () => {
    switch (activeTab) {
      case 'all':
        return allTotal
      case 'drafts':
        return materialsPagination.total + visibleDraftGenerationTasks.length
      case 'video':
        return videoTotal + visibleVideoGenerationTasks.length
      case 'img':
        return imgTotal + visibleImageGenerationTasks.length
      default:
        return materialsPagination.total + visibleDraftGenerationTasks.length
    }
  }

  const isDraftsTab = activeTab === 'drafts'
  const showMediaHeaderBatchActions = !isDraftsTab && !mediaBatchMode && getActiveTabCount() > 0
  const cardContentClassName = useContainerResponsive
    ? 'px-4 pb-4 @min-[640px]:px-6 @min-[640px]:pb-6'
    : 'px-4 pb-4 sm:px-6 sm:pb-6'
  const tabCountBadgeClassName = 'ml-1 h-5 min-w-[20px] px-1.5 text-xs'
  const headerCountBadgeClassName = showTabsList ? 'hidden' : 'h-5 min-w-[20px] px-1.5 text-xs'
  const batchCardContentClassName = cn(
    cardContentClassName,
    (batchMode || mediaBatchMode) && 'pb-16',
  )

  // 草稿内容区域
  const draftsContent = (
    <>
      <DraftListToolbar allowTransfer={allowTransfer} useContainerResponsive={useContainerResponsive} />
      <div>
        <Masonry
          breakpointCols={masonryBreakpointCols}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
          data-testid="draftbox-masonry-list"
        >
          {!batchMode && (
            <ManualCreateCard onClick={openCreateMaterialModal} />
          )}

          {/* 生成中卡片 - 批量模式隐藏 */}
          {!batchMode && visibleDraftGenerationTasks.map(task => (
            <GeneratingTaskCard key={task.id} task={task} onClick={openGenerationDetailDialog} />
          ))}

          {/* 草稿数据 */}
          {materials.map(material => (
            <DraftCard
              key={material.id}
              material={material}
              onClick={() => openDraftDetailDialog(material)}
              batchMode={batchMode}
              selected={selectedSet.has(material.id)}
              onToggleSelect={() => toggleMaterialSelection(material.id)}
              useCountLabels={getMaterialUseCountLabels(material, t)}
              enablePublishDrag={enablePublishDrag}
            />
          ))}
        </Masonry>

        {/* 加载触发器 */}
        <div ref={loadMoreCallbackRef} />

        {/* 加载更多指示器 */}
        {materialsLoading && <LoadingIndicator label={t('common.loading')} />}

        {/* 没有更多数据 */}
        {!materialsPagination.hasMore && materials.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">
              {t('common.noMore', '没有更多了')}
            </span>
          </div>
        )}
      </div>
    </>
  )

  // 骨架屏内容
  // TabsList 组件
  const tabsList = showTabsList ? (
    <TabsList className={useContainerResponsive ? 'grid h-auto w-full grid-cols-4 gap-1 @min-[640px]:inline-flex @min-[640px]:w-auto' : 'grid h-auto w-full grid-cols-4 gap-1 sm:inline-flex sm:w-auto'}>
      {hasAllTab && (
        <TabsTrigger value="all" className={useContainerResponsive ? 'min-w-0 cursor-pointer px-2 text-xs @min-[640px]:px-3 @min-[640px]:text-sm' : 'cursor-pointer min-w-0 px-2 text-xs sm:px-3 sm:text-sm'}>
          {tMaterial('mediaManagement.all')}
          {allTotal > 0 && (
            <Badge variant="secondary" className={tabCountBadgeClassName}>
              {allTotal}
            </Badge>
          )}
        </TabsTrigger>
      )}
      {hasDraftsTab && (
        <TabsTrigger value="drafts" className={useContainerResponsive ? 'min-w-0 cursor-pointer px-2 text-xs @min-[640px]:px-3 @min-[640px]:text-sm' : 'cursor-pointer min-w-0 px-2 text-xs sm:px-3 sm:text-sm'}>
          {tMaterial('mediaManagement.drafts', '草稿')}
          {materialsPagination.total > 0 && (
            <Badge variant="secondary" className={tabCountBadgeClassName}>
              {materialsPagination.total}
            </Badge>
          )}
        </TabsTrigger>
      )}
      {hasVideoTab && (
        <TabsTrigger value="video" className={useContainerResponsive ? 'min-w-0 cursor-pointer px-2 text-xs @min-[640px]:px-3 @min-[640px]:text-sm' : 'cursor-pointer min-w-0 px-2 text-xs sm:px-3 sm:text-sm'}>
          {tMaterial('mediaManagement.video')}
          {videoTotal > 0 && (
            <Badge variant="secondary" className={tabCountBadgeClassName}>
              {videoTotal}
            </Badge>
          )}
        </TabsTrigger>
      )}
      {hasImgTab && (
        <TabsTrigger value="img" className={useContainerResponsive ? 'min-w-0 cursor-pointer px-2 text-xs @min-[640px]:px-3 @min-[640px]:text-sm' : 'cursor-pointer min-w-0 px-2 text-xs sm:px-3 sm:text-sm'}>
          {tMaterial('mediaManagement.image')}
          {imgTotal > 0 && (
            <Badge variant="secondary" className={tabCountBadgeClassName}>
              {imgTotal}
            </Badge>
          )}
        </TabsTrigger>
      )}
    </TabsList>
  ) : null

  // 初始加载骨架屏
  if (materialsLoading && materials.length === 0) {
    return (
      <Tabs ref={useContainerResponsive ? containerRef : undefined} value={activeTab} onValueChange={handleTabChange} className="w-full">
        <Card>
          {tabsList && (
            <div className={useContainerResponsive ? 'px-4 pt-4 @min-[640px]:px-6 @min-[640px]:pt-6' : 'px-4 pt-4 sm:px-6 sm:pt-6'}>
              {tabsList}
            </div>
          )}
          <CardHeader className={useContainerResponsive ? 'px-4 pb-4 pt-4 @min-[640px]:px-6' : 'px-4 pb-4 pt-4 sm:px-6'}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <CardTitle className="text-base">{getHeaderTitle()}</CardTitle>
                {getActiveTabCount() > 0 && (
                  <Badge variant="secondary" className={headerCountBadgeClassName}>
                    {getActiveTabCount()}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openGenerationDetailDialog}
                className="shrink-0 cursor-pointer justify-center gap-1.5 text-muted-foreground"
              >
                <ListChecks className="h-3.5 w-3.5" />
                {t('draftManage.generationDetail')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className={cardContentClassName}>
            <Masonry
              breakpointCols={masonryBreakpointCols}
              className="flex -ml-4 w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              <ManualCreateCard onClick={openCreateMaterialModal} />
              {Array.from({ length: 8 }).map((_, i) => (
                <DraftCardSkeleton key={i} index={i} />
              ))}
            </Masonry>
          </CardContent>
        </Card>
      </Tabs>
    )
  }
  return (
    <Tabs ref={useContainerResponsive ? containerRef : undefined} value={activeTab} onValueChange={handleTabChange} className="w-full">
      <Card>
        {tabsList && (
          <div className={useContainerResponsive ? 'px-4 pt-4 @min-[640px]:px-6 @min-[640px]:pt-6' : 'px-4 pt-4 sm:px-6 sm:pt-6'}>
            {tabsList}
          </div>
        )}
        <CardHeader className={useContainerResponsive ? 'px-4 pb-4 pt-4 @min-[640px]:px-6' : 'px-4 pb-4 pt-4 sm:px-6'}>
          <div className={useContainerResponsive ? 'flex flex-col gap-3 @min-[640px]:flex-row @min-[640px]:items-center @min-[640px]:justify-between' : 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'}>
            <div className={useContainerResponsive ? 'flex items-center justify-between gap-3 @min-[640px]:min-w-0 @min-[640px]:flex-1 @min-[640px]:justify-start' : 'flex items-center justify-between gap-3 sm:min-w-0 sm:flex-1 sm:justify-start'}>
              <div className={useContainerResponsive ? 'flex min-w-0 flex-wrap items-center gap-2' : 'flex min-w-0 flex-wrap items-center gap-2'}>
                <CardTitle className="text-base">{getHeaderTitle()}</CardTitle>
                {getActiveTabCount() > 0 && (
                  <Badge variant="secondary" className={headerCountBadgeClassName}>
                    {getActiveTabCount()}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openGenerationDetailDialog}
                className={useContainerResponsive ? 'shrink-0 cursor-pointer justify-center gap-1.5 text-muted-foreground @min-[640px]:hidden' : 'shrink-0 cursor-pointer justify-center gap-1.5 text-muted-foreground sm:hidden'}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {t('draftManage.generationDetail')}
              </Button>
            </div>
            <div className={useContainerResponsive ? 'flex w-full flex-col gap-2 @min-[640px]:w-auto @min-[640px]:flex-row @min-[640px]:items-center @min-[640px]:justify-end' : 'flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end'}>
              {showMediaHeaderBatchActions && (
                <div className={useContainerResponsive ? 'grid w-full grid-cols-2 gap-2 @min-[640px]:flex @min-[640px]:w-auto' : 'grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto'}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enterMediaBatchMode}
                    className={useContainerResponsive ? 'w-full cursor-pointer justify-center gap-1.5 @min-[640px]:w-auto' : 'w-full cursor-pointer justify-center gap-1.5 sm:w-auto'}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    {t('draftManage.batchTransfer')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enterMediaBatchMode}
                    className={useContainerResponsive ? 'w-full cursor-pointer justify-center gap-1.5 @min-[640px]:w-auto' : 'w-full cursor-pointer justify-center gap-1.5 sm:w-auto'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {tMaterial('mediaManagement.batchDelete')}
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={openGenerationDetailDialog}
                className={useContainerResponsive ? 'hidden cursor-pointer justify-center gap-1.5 text-muted-foreground @min-[640px]:inline-flex' : 'hidden cursor-pointer justify-center gap-1.5 text-muted-foreground sm:inline-flex'}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {t('draftManage.generationDetail')}
              </Button>
            </div>
          </div>
        </CardHeader>

        {hasAllTab && (
          <TabsContent value="all" className="mt-0">
            <CardContent className={batchCardContentClassName}>
              <AllListSection materialGroupId={materialGroupId} showBatchDeleteTrigger={false} batchActionPosition={batchActionPosition} useContainerResponsive={useContainerResponsive} enablePublishDrag={enablePublishDrag} />
            </CardContent>
          </TabsContent>
        )}

        {hasDraftsTab && (
          <TabsContent value="drafts" className="mt-0">
            <CardContent className={batchCardContentClassName}>
              {draftsContent}
            </CardContent>
          </TabsContent>
        )}

        {hasVideoTab && (
          <TabsContent value="video" className="mt-0">
            <CardContent className={batchCardContentClassName}>
              <MediaListSection
                type="video"
                materialGroupId={materialGroupId}
                showBatchDeleteTrigger={false}
                batchActionPosition={batchActionPosition}
                useContainerResponsive={useContainerResponsive}
                enablePublishDrag={enablePublishDrag}
              />
            </CardContent>
          </TabsContent>
        )}

        {hasImgTab && (
          <TabsContent value="img" className="mt-0">
            <CardContent className={batchCardContentClassName}>
              <MediaListSection
                type="img"
                materialGroupId={materialGroupId}
                showBatchDeleteTrigger={false}
                batchActionPosition={batchActionPosition}
                useContainerResponsive={useContainerResponsive}
                enablePublishDrag={enablePublishDrag}
              />
            </CardContent>
          </TabsContent>
        )}

        {activeTab === 'drafts' && batchMode && (
          <BatchActionBar allowTransfer={allowTransfer} position={batchActionPosition} useContainerResponsive={useContainerResponsive} />
        )}
        <ConditionalDeleteDialog />
      </Card>
    </Tabs>
  )
})

DraftListSection.displayName = 'DraftListSection'
