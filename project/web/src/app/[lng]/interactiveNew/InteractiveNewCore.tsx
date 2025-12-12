'use client'

/**
 * 互动模块主组件
 * 整合平台选择器、瀑布流列表等子组件
 */

import { useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import Masonry from 'react-masonry-css'
import type { HomeFeedItem } from '@/store/plugin/plats/types'
import { PluginStatus } from '@/store/plugin'
import { PLUGIN_DOWNLOAD_LINKS } from '@/store/plugin/constants'
import PlatformSelector from './components/PlatformSelector'
import WaterfallList from './components/WaterfallList'
import FeedDetailModal from './components/FeedDetailModal'
import { FeedCardSkeleton } from './components/FeedCard'
import { useInteractive } from './useInteractive'
import styles from './InteractiveNew.module.scss'

/** 瀑布流响应式断点配置 */
const MASONRY_BREAKPOINTS = {
  default: 5,
  1400: 4,
  1100: 3,
  768: 2,
  480: 2,
}

/**
 * 互动模块主组件
 */
export default function InteractiveNewCore() {
  const { t } = useTranslation('interactiveNew')

  const {
    // 状态
    currentPlatform,
    feedList,
    loading,
    loadingMore,
    hasMore,
    error,
    platforms,
    hasAnyLoggedIn,
    isPluginReady,
    isPluginInitializing,
    pluginStatus,

    // 方法
    switchPlatform,
    loadMore,
    refresh,
  } = useInteractive()

  /**
   * 处理卡片点击 - 打开详情弹框
   */
  const handleCardClick = useCallback((item: HomeFeedItem) => {
    setSelectedItem(item)
  }, [])

  /**
   * 关闭弹框
   */
  const handleCloseModal = useCallback(() => {
    setSelectedItem(null)
  }, [])

  /**
   * 处理去登录
   */
  const handleGoLogin = useCallback(() => {
    // 跳转到账号页面
    window.location.href = '/accounts'
  }, [])

  /**
   * 处理安装插件
   */
  const handleInstallPlugin = useCallback(() => {
    window.open(PLUGIN_DOWNLOAD_LINKS.chrome, '_blank')
  }, [])

  // 是否显示返回顶部按钮
  const [showBackTop, setShowBackTop] = useState(false)

  // 弹框状态 - 选中的作品
  const [selectedItem, setSelectedItem] = useState<HomeFeedItem | null>(null)

  /**
   * 监听滚动，控制返回顶部按钮显示
   */
  useEffect(() => {
    const container = document.getElementById('interactiveScrollContainer')
    if (!container) return

    const handleScroll = () => {
      setShowBackTop(container.scrollTop > 300)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isPluginReady])

  /**
   * 返回顶部
   */
  const handleBackTop = useCallback(() => {
    const container = document.getElementById('interactiveScrollContainer')
    container?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 插件初始化中 - 显示骨架屏
  if (isPluginInitializing) {
    return (
      <div className={styles.interactiveNew} id="interactiveScrollContainer">
        <div className="interactiveNew_container">
          <div className="interactiveNew_content">
            {/* 平台选择器骨架 */}
            <div className="interactiveNew_toolbar">
              <div className={styles.skeletonPlatforms}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeletonPlatforms_item" />
                ))}
              </div>
            </div>
            {/* 内容骨架屏 */}
            <Masonry
              breakpointCols={MASONRY_BREAKPOINTS}
              className="masonry-grid"
              columnClassName="masonry-grid_column"
            >
              {Array.from({ length: 10 }).map((_, index) => (
                <FeedCardSkeleton key={index} />
              ))}
            </Masonry>
          </div>
        </div>
      </div>
    )
  }

  // 插件未就绪（初始化完成后仍未就绪）
  if (!isPluginReady) {
    return (
      <div className={styles.interactiveNew}>
        <div className="interactiveNew_container">
          <div className={styles.pluginNotReady}>
            <span className="pluginNotReady_icon">🔌</span>
            <h2 className="pluginNotReady_title">{t('pluginNotReady')}</h2>
            <p className="pluginNotReady_desc">{t('pluginNotReadyDesc')}</p>
            {pluginStatus === PluginStatus.NOT_INSTALLED && (
              <button className="pluginNotReady_btn" onClick={handleInstallPlugin}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                {t('installPlugin')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.interactiveNew} id="interactiveScrollContainer">
      <div className="interactiveNew_container">
        {/* 内容区域 */}
        <div className="interactiveNew_content">
          {/* 工具栏 */}
          <div className="interactiveNew_toolbar">
            {/* 平台选择器 */}
            <PlatformSelector
              platforms={platforms}
              currentPlatform={currentPlatform}
              hasAnyLoggedIn={hasAnyLoggedIn}
              onSwitch={switchPlatform}
              onGoLogin={handleGoLogin}
            />
          </div>

          {/* 瀑布流列表 */}
          {currentPlatform && (
            <LayoutGroup>
              <WaterfallList
                feedList={feedList}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                error={error}
                selectedId={selectedItem?.workId}
                onLoadMore={loadMore}
                onRefresh={refresh}
                onCardClick={handleCardClick}
              />

              {/* 作品详情弹框 - 使用 AnimatePresence 处理进出动画 */}
              <AnimatePresence>
                {selectedItem && (
                  <FeedDetailModal
                    key={selectedItem.workId}
                    item={selectedItem}
                    onClose={handleCloseModal}
                  />
                )}
              </AnimatePresence>
            </LayoutGroup>
          )}

          {/* 未选择平台时的提示 */}
          {!currentPlatform && hasAnyLoggedIn && (
            <div className={styles.pluginNotReady}>
              <span className="pluginNotReady_icon">👆</span>
              <h2 className="pluginNotReady_title">{t('selectPlatform')}</h2>
              <p className="pluginNotReady_desc">{t('describe')}</p>
            </div>
          )}
        </div>
      </div>

      {/* 右下角悬浮按钮 */}
      <div className={styles.floatingActions}>
        {/* 返回顶部 */}
        <button
          className={`floatingActions_btn ${showBackTop ? 'floatingActions_btn-visible' : ''}`}
          onClick={handleBackTop}
          title={t('backTop')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </button>

        {/* 刷新 */}
        <button
          className={`floatingActions_btn floatingActions_btn-visible ${loading ? 'floatingActions_btn-loading' : ''}`}
          onClick={refresh}
          disabled={loading || !currentPlatform}
          title={t('refresh')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
