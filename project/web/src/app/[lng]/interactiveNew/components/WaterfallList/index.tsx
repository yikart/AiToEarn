'use client'

/**
 * 瀑布流列表组件
 * 使用 @egjs/react-infinitegrid 实现虚拟瀑布流
 * 支持无限滚动和 DOM 回收，优化大量数据渲染性能
 */

import { memo, useCallback, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Spin } from 'antd'
import { MasonryInfiniteGrid } from '@egjs/react-infinitegrid'
import Masonry from 'react-masonry-css'
import type { HomeFeedItem } from '@/store/plugin/plats/types'
import FeedCard, { FeedCardSkeleton, type ClickRect } from '../FeedCard'
import styles from './WaterfallList.module.scss'

/**
 * 根据窗口宽度获取列数
 */
function getColumnCount(width: number): number {
  if (width <= 480) return 2
  if (width <= 768) return 2
  if (width <= 1100) return 3
  if (width <= 1400) return 4
  return 5
}

/**
 * 响应式列数 Hook
 */
function useResponsiveColumns(): number {
  const [columns, setColumns] = useState(5)

  useEffect(() => {
    const updateColumns = () => {
      setColumns(getColumnCount(window.innerWidth))
    }

    // 初始化
    updateColumns()

    // 监听窗口大小变化
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  return columns
}

interface WaterfallListProps {
  /** 作品列表 */
  feedList: HomeFeedItem[]
  /** 是否正在加载（首次） */
  loading: boolean
  /** 是否正在加载更多 */
  loadingMore: boolean
  /** 是否有更多数据 - 此接口永远有更多数据 */
  hasMore: boolean
  /** 错误信息 */
  error: string | null
  /** 加载更多回调 */
  onLoadMore: () => void
  /** 刷新回调 */
  onRefresh: () => void
  /** 卡片点击回调，包含点击位置 */
  onCardClick?: (item: HomeFeedItem, rect: ClickRect) => void
}

/** 骨架屏瀑布流响应式断点配置 */
const SKELETON_BREAKPOINTS = {
  default: 5,
  1400: 4,
  1100: 3,
  768: 2,
  480: 2,
}

/**
 * 加载中组件 - 使用 Ant Design Spin
 */
function LoadingIndicator() {
  const { t } = useTranslation('interactiveNew')
  return (
    <div className={styles.loadingIndicator}>
      <Spin />
      <span>{t('loading')}</span>
    </div>
  )
}

/**
 * 瀑布流列表组件
 * 使用虚拟滚动优化，只渲染可视区域内的 DOM
 */
function WaterfallList({
  feedList,
  loading,
  loadingMore,
  error,
  onLoadMore,
  onRefresh,
  onCardClick,
}: WaterfallListProps) {
  const { t } = useTranslation('interactiveNew')
  const isLoadingRef = useRef(false)
  const columns = useResponsiveColumns()

  /**
   * 处理卡片点击
   */
  const handleCardClick = useCallback((item: HomeFeedItem, rect: ClickRect) => {
    onCardClick?.(item, rect)
  }, [onCardClick])

  /**
   * 处理加载更多
   * 使用 ref 防止重复触发
   */
  const handleRequestAppend = useCallback(() => {
    if (isLoadingRef.current || loading || loadingMore) {
      return
    }
    isLoadingRef.current = true
    onLoadMore()
    // 延迟重置，防止短时间内重复触发
    setTimeout(() => {
      isLoadingRef.current = false
    }, 500)
  }, [loading, loadingMore, onLoadMore])

  // 首次加载中
  if (loading && feedList.length === 0) {
    return (
      <div className={styles.loadingSkeleton}>
        <Masonry
          breakpointCols={SKELETON_BREAKPOINTS}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {Array.from({ length: 10 }).map((_, index) => (
            <FeedCardSkeleton key={index} />
          ))}
        </Masonry>
      </div>
    )
  }

  // 错误状态
  if (error && feedList.length === 0) {
    return (
      <div className={styles.errorState}>
        <span className="errorState_icon">😵</span>
        <p className="errorState_text">{error}</p>
        <button className="errorState_btn" onClick={onRefresh}>
          {t('retry')}
        </button>
      </div>
    )
  }

  // 空状态
  if (!loading && feedList.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className="emptyState_icon">📭</span>
        <h3 className="emptyState_title">{t('empty')}</h3>
        <p className="emptyState_desc">{t('emptyDesc')}</p>
        <button className="emptyState_btn" onClick={onRefresh}>
          {t('refresh')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.waterfallList}>
      <MasonryInfiniteGrid
        className="masonry-virtual-grid"
        column={columns}
        gap={16}
        align="stretch"
        useResizeObserver
        observeChildren
        scrollContainer={typeof window !== 'undefined' ? document.getElementById('main-content') : null}
        onRequestAppend={handleRequestAppend}
        threshold={800}
      >
        {feedList.map((item, index) => (
          <div
            key={item.workId}
            data-grid-groupkey={Math.floor(index / 15)}
          >
            <FeedCard
              item={item}
              onClick={handleCardClick}
            />
          </div>
        ))}
      </MasonryInfiniteGrid>

      {/* 加载中指示器 */}
      {loadingMore && <LoadingIndicator />}
    </div>
  )
}

export default memo(WaterfallList)
