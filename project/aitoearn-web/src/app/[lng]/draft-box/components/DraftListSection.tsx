/**
 * 草稿列表组件
 * 使用 react-masonry-css 瀑布流布局 + IntersectionObserver 无限滚动展示全部草稿
 * 图片保持原始比例显示
 * 创建按钮卡片作为瀑布流前两个元素
 * 支持搜索筛选、批量删除、条件删除
 * 当传入 materialGroupId 时，集成 Tab（草稿箱/视频/图片）
 */

'use client'

import type { PromotionMaterial } from '@/app/[lng]/brand-promotion/brandPromotionStore/types'
import type { PlatType } from '@/app/config/platConfig'
import { Check, ListChecks, Plus } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import Masonry from 'react-masonry-css'
import { useShallow } from 'zustand/react/shallow'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { AllListSection } from './AllListSection'
import { BatchActionBar } from './BatchActionBar'
import { ConditionalDeleteDialog } from './ConditionalDeleteDialog'
import { useMediaTabStore } from './ContentTabs/mediaTabStore'
import { DraftListToolbar } from './DraftListToolbar'
import { GeneratingCard } from './GeneratingCard'
import { LazyImage } from './LazyImage'
import { MediaListSection } from './MediaListSection'

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
  useCountLabel?: string
}

// 草稿卡片组件（小红书风格）
const DraftCard = memo(({ material, onClick, batchMode, selected, onToggleSelect, useCountLabel }: DraftCardProps) => {
  const { t } = useTransClient('brandPromotion')
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
        {useCountLabel && (
          <span className="inline-block mt-1 ml-1 px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary">
            {useCountLabel}
          </span>
        )}
        {material.accountTypes && material.accountTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {material.accountTypes.map((type) => {
              const platInfo = AccountPlatInfoMap.get(type as PlatType)
              if (!platInfo)
                return null
              return (
                <Image
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
  /** 传入时显示 Tab（草稿箱/视频/图片），不传则只显示草稿列表 */
  materialGroupId?: string
}

export const DraftListSection = memo(({ materialGroupId }: DraftListSectionProps) => {
  const { t } = useTransClient('brandPromotion')
  const { t: tMaterial } = useTransClient('material')

  const showTabs = !!materialGroupId
  const [activeTab, setActiveTab] = useState('all')

  // materialGroupId 变化时，有 Tab 模式默认选中"全部"
  useEffect(() => {
    if (materialGroupId) {
      setActiveTab('all')
    }
  }, [materialGroupId])

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
  } = usePlanDetailStore(
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

  const openCreateMaterialModal = usePlanDetailStore(state => state.openCreateMaterialModal)
  const loadMoreMaterials = usePlanDetailStore(state => state.loadMoreMaterials)
  const openDraftDetailDialog = usePlanDetailStore(state => state.openDraftDetailDialog)
  const openGenerationDetailDialog = usePlanDetailStore(state => state.openGenerationDetailDialog)
  const toggleMaterialSelection = usePlanDetailStore(state => state.toggleMaterialSelection)

  const { videoTotal, imgTotal, allTotal } = useMediaTabStore(
    useShallow(state => ({
      videoTotal: state.video.total,
      imgTotal: state.img.total,
      allTotal: state.all.draftTotal + state.all.videoTotal + state.all.imgTotal,
    })),
  )

  const fetchMediaList = useMediaTabStore(state => state.fetchMediaList)
  const fetchAllList = useMediaTabStore(state => state.fetchAllList)
  const videoInitialized = useMediaTabStore(state => state.video.initialized)
  const imgInitialized = useMediaTabStore(state => state.img.initialized)
  const allInitialized = useMediaTabStore(state => state.all.initialized)

  const selectedSet = new Set(selectedMaterialIds)

  // Tab 切换处理
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)

    // 首次切换到对应 Tab 时触发加载
    if (value === 'all' && !allInitialized && materialGroupId && currentPlan) {
      fetchAllList(materialGroupId, currentPlan.id)
    }
    if (value === 'video' && !videoInitialized && materialGroupId) {
      fetchMediaList(materialGroupId, 'video')
    }
    if (value === 'img' && !imgInitialized && materialGroupId) {
      fetchMediaList(materialGroupId, 'img')
    }
  }, [allInitialized, videoInitialized, imgInitialized, materialGroupId, currentPlan, fetchAllList, fetchMediaList])

  // IntersectionObserver 实现无限滚动
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && materialsPagination.hasMore && !materialsLoading && currentPlan) {
          loadMoreMaterials(currentPlan.id)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(loadMoreElement)

    return () => {
      observer.disconnect()
    }
  }, [materialsPagination.hasMore, materialsLoading, currentPlan, loadMoreMaterials])

  // 根据 activeTab 获取标题（数量已在 Tab Badge 中展示，此处不再重复）
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'all':
        return tMaterial('mediaManagement.all')
      case 'video':
        return tMaterial('mediaManagement.video')
      case 'img':
        return tMaterial('mediaManagement.image')
      default:
        return tMaterial('mediaManagement.drafts', '草稿箱')
    }
  }

  // 草稿内容区域
  const draftsContent = (
    <>
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
              key={material.id}
              material={material}
              onClick={() => openDraftDetailDialog(material)}
              batchMode={batchMode}
              selected={selectedSet.has(material.id)}
              onToggleSelect={() => toggleMaterialSelection(material.id)}
              useCountLabel={material.useCount != null && material.useCount > 0 ? t('material.useCount', { count: material.useCount }) : undefined}
            />
          ))}
        </Masonry>

        {/* 加载触发器 */}
        <div ref={loadMoreRef} />

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
  const skeletonCard = (
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
          {Array.from({ length: 8 }).map((_, i) => (
            <DraftCardSkeleton key={i} index={i} />
          ))}
        </Masonry>
      </CardContent>
    </Card>
  )

  // TabsList 组件
  const tabsList = (
    <TabsList className="w-full sm:w-auto">
      <TabsTrigger value="all" className="cursor-pointer gap-1.5 flex-1 sm:flex-initial">
        {tMaterial('mediaManagement.all')}
        {allTotal > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
            {allTotal}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="drafts" className="cursor-pointer gap-1.5 flex-1 sm:flex-initial">
        {tMaterial('mediaManagement.drafts', '草稿箱')}
        {materialsPagination.total > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
            {materialsPagination.total}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="video" className="cursor-pointer gap-1.5 flex-1 sm:flex-initial">
        {tMaterial('mediaManagement.video')}
        {videoTotal > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
            {videoTotal}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="img" className="cursor-pointer gap-1.5 flex-1 sm:flex-initial">
        {tMaterial('mediaManagement.image')}
        {imgTotal > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
            {imgTotal}
          </Badge>
        )}
      </TabsTrigger>
    </TabsList>
  )

  // 页面加载时预取全部/视频/图片数据
  useEffect(() => {
    if (materialGroupId && showTabs) {
      if (!allInitialized && currentPlan) {
        fetchAllList(materialGroupId, currentPlan.id)
      }
      if (!videoInitialized) {
        fetchMediaList(materialGroupId, 'video')
      }
      if (!imgInitialized) {
        fetchMediaList(materialGroupId, 'img')
      }
    }
  }, [materialGroupId, showTabs, allInitialized, videoInitialized, imgInitialized, currentPlan, fetchAllList, fetchMediaList])

  // 初始加载骨架屏
  if (materialsLoading && materials.length === 0) {
    if (showTabs) {
      return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <Card>
            <div className="px-6 pt-6">
              {tabsList}
            </div>
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
                {Array.from({ length: 8 }).map((_, i) => (
                  <DraftCardSkeleton key={i} index={i} />
                ))}
              </Masonry>
            </CardContent>
          </Card>
        </Tabs>
      )
    }
    return skeletonCard
  }

  // 无 Tab 模式（DraftManageDrawer）
  if (!showTabs) {
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
          {draftsContent}
        </CardContent>
        {batchMode && <BatchActionBar />}
        <ConditionalDeleteDialog />
      </Card>
    )
  }

  // 有 Tab 模式：TabsList 在 Card 内部
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <Card>
        <div className="px-6 pt-6">
          {tabsList}
        </div>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{getHeaderTitle()}</CardTitle>
            <Button variant="ghost" size="sm" onClick={openGenerationDetailDialog} className="cursor-pointer gap-1.5 text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              {t('draftManage.generationDetail')}
            </Button>
          </div>
        </CardHeader>

        <TabsContent value="all" className="mt-0">
          <CardContent>
            <AllListSection materialGroupId={materialGroupId} />
          </CardContent>
        </TabsContent>

        <TabsContent value="drafts" className="mt-0">
          <CardContent className={cn(batchMode && 'pb-16')}>
            {draftsContent}
          </CardContent>
        </TabsContent>

        <TabsContent value="video" className="mt-0">
          <CardContent>
            <MediaListSection type="video" materialGroupId={materialGroupId} />
          </CardContent>
        </TabsContent>

        <TabsContent value="img" className="mt-0">
          <CardContent>
            <MediaListSection type="img" materialGroupId={materialGroupId} />
          </CardContent>
        </TabsContent>

        {batchMode && <BatchActionBar />}
        <ConditionalDeleteDialog />
      </Card>
    </Tabs>
  )
})

DraftListSection.displayName = 'DraftListSection'
