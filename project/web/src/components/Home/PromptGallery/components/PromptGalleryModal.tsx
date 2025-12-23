/**
 * PromptGalleryModal - 全屏弹框画廊组件
 * 使用 react-masonry-css 实现瀑布流 + react-infinite-scroll-component 实现上拉加载
 */

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, X, Sparkles, Wand2, ImageIcon, Loader2, Grid3X3, Star, Image as ImageLucide } from 'lucide-react'
import Masonry from 'react-masonry-css'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { MasonryCard } from './MasonryCard'
import { SAMPLE_PROMPTS, LOAD_MORE_COUNT, MASONRY_BREAKPOINTS } from '../constants'
import { getGalleryCache, updateGalleryCache, resetGalleryCache } from '../cache'
import type { PromptItem, FilterMode, CategoryFilter } from '../types'

interface PromptGalleryModalProps {
  open: boolean
  onClose: () => void
  onApplyPrompt: (item: PromptItem, e?: React.MouseEvent) => void
  onSelectPrompt: (item: PromptItem) => void
  t: (key: string) => string
  lng?: string
}

export function PromptGalleryModal({
  open,
  onClose,
  onApplyPrompt,
  onSelectPrompt,
  t,
  lng = 'zh-CN',
}: PromptGalleryModalProps) {
  const cache = getGalleryCache()

  // 使用缓存的初始值
  const [selectedMode, setSelectedMode] = useState<FilterMode>(cache.selectedMode)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [titleFilter, setTitleFilter] = useState(cache.titleFilter)
  const [displayCount, setDisplayCount] = useState(cache.displayCount)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 恢复滚动位置
  useEffect(() => {
    if (open && scrollContainerRef.current && cache.scrollTop > 0) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = cache.scrollTop
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open, cache.scrollTop])

  // 保存滚动位置
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      updateGalleryCache({ scrollTop: scrollContainerRef.current.scrollTop })
    }
  }, [])

  // 保存筛选状态到缓存
  useEffect(() => {
    updateGalleryCache({ selectedMode })
  }, [selectedMode])

  useEffect(() => {
    updateGalleryCache({ titleFilter })
  }, [titleFilter])

  useEffect(() => {
    updateGalleryCache({ displayCount })
  }, [displayCount])

  // 根据筛选条件过滤提示词
  const filteredPrompts = useMemo(() => {
    return SAMPLE_PROMPTS.filter((item) => {
      // 分类筛选
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }
      if (selectedMode !== 'all' && item.mode !== selectedMode) {
        return false
      }
      if (
        titleFilter.trim() &&
        !item.title.toLowerCase().includes(titleFilter.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [selectedMode, selectedCategory, titleFilter])

  // 当筛选条件改变时重置显示数量
  useEffect(() => {
    setDisplayCount(LOAD_MORE_COUNT)
    resetGalleryCache()
  }, [selectedMode, selectedCategory, titleFilter])

  // 当前显示的提示词
  const displayedPrompts = filteredPrompts.slice(0, displayCount)
  const hasMore = displayCount < filteredPrompts.length

  // 加载更多
  const loadMore = useCallback(() => {
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filteredPrompts.length))
    }, 300)
  }, [filteredPrompts.length])

  // 分类筛选按钮配置
  const categoryButtons = [
    { key: 'all' as CategoryFilter, label: t('categories.all' as any), icon: Grid3X3 },
    { key: 'Recommend' as CategoryFilter, label: t('categories.recommend' as any), icon: Star },
    { key: 'Image' as CategoryFilter, label: t('categories.image' as any), icon: ImageLucide },
  ]

  // 模式筛选按钮配置
  const filterButtons = [
    { key: 'all' as FilterMode, label: t('filters.all' as any), icon: Sparkles },
    { key: 'generate' as FilterMode, label: t('filters.generate' as any), icon: Wand2 },
    { key: 'edit' as FilterMode, label: t('filters.edit' as any), icon: ImageIcon },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="!w-[min(1800px,95vw)] !max-w-none sm:!w-[min(1800px,95vw)] sm:!max-w-none h-[90vh] p-0 overflow-hidden bg-background rounded-2xl flex flex-col mx-auto">
        {/* 头部 */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-card/80 backdrop-blur-md border-b border-border">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Grid3X3 className="w-5 h-5 text-primary-foreground" />
              </div>
              {t('title')}
              <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                {filteredPrompts.length} {t('expandCount')}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* 筛选区域 */}
          <div className="flex flex-col gap-4">
            {/* 分类筛选按钮组 */}
            <div className="flex items-center gap-2 flex-wrap">
              {categoryButtons.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                  className="rounded-full px-4"
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {label}
                </Button>
              ))}
            </div>

            {/* 模式筛选和搜索 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* 模式筛选按钮组 */}
              <div className="flex items-center gap-2 flex-wrap">
                {filterButtons.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={selectedMode === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMode(key)}
                    className="rounded-full px-4"
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    {label}
                  </Button>
                ))}
              </div>

              {/* 搜索框 */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('filters.searchPlaceholder' as any)}
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  className="pl-10 pr-10 rounded-full bg-card border-border"
                />
                {titleFilter && (
                  <button
                    onClick={() => setTitleFilter('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 - 瀑布流 + 无限滚动 */}
        <div
          id="gallery-scroll-container"
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-6"
          onScroll={handleScroll}
        >
          {filteredPrompts.length > 0 ? (
            <InfiniteScroll
              dataLength={displayedPrompts.length}
              next={loadMore}
              hasMore={hasMore}
              scrollThreshold={0.6}
              loader={
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              }
              endMessage={
                <div className="flex justify-center py-8 text-muted-foreground text-sm">
                  {t('loadedAll')} {filteredPrompts.length} {t('promptsCount')}
                </div>
              }
              scrollableTarget="gallery-scroll-container"
            >
              <Masonry
                breakpointCols={MASONRY_BREAKPOINTS}
                className="flex -ml-5 w-auto"
                columnClassName="pl-5 bg-clip-padding"
              >
                {displayedPrompts.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="mb-5">
                    <MasonryCard
                      item={item}
                      onApply={onApplyPrompt}
                      onClick={onSelectPrompt}
                      t={t}
                      lng={lng}
                    />
                  </div>
                ))}
              </Masonry>
            </InfiniteScroll>
          ) : (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noResults')}</p>
              <p className="text-sm mt-1">{t('tryOtherKeywords')}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

