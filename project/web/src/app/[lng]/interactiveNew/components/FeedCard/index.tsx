'use client'

/**
 * 作品卡片组件
 * 展示封面、标题、作者信息、点赞数等
 * 使用 Framer Motion 实现共享元素过渡动画
 */

import { memo, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { HomeFeedItem } from '@/store/plugin/plats/types'
import styles from './FeedCard.module.scss'

interface FeedCardProps {
  /** 作品数据 */
  item: HomeFeedItem
  /** 当前选中的作品 ID（用于控制 layoutId） */
  selectedId?: string | null
  /** 点击回调 */
  onClick?: (item: HomeFeedItem) => void
}

/** 默认宽高比（3:4） */
const DEFAULT_ASPECT_RATIO = 4 / 3

/**
 * 计算宽高比
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @returns 宽高比（height / width）
 */
function calcAspectRatio(width?: number, height?: number): number {
  if (width && height && width > 0) {
    return height / width
  }
  return DEFAULT_ASPECT_RATIO
}

/**
 * 格式化视频时长
 */
function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * 作品卡片组件
 */
function FeedCard({ item, selectedId, onClick }: FeedCardProps) {
  const { t } = useTranslation('interactiveNew')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    onClick?.(item)
  }

  /** 计算封面区域的宽高比 */
  const aspectRatio = useMemo(() => {
    return calcAspectRatio(item.thumbnailWidth, item.thumbnailHeight)
  }, [item.thumbnailWidth, item.thumbnailHeight])

  /** 封面区域的 padding-bottom 百分比 */
  const paddingBottom = useMemo(() => {
    return `${aspectRatio * 100}%`
  }, [aspectRatio])

  /** 处理图片加载完成 */
  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  /** 处理图片加载失败 */
  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  // 当前卡片是否被选中（用于隐藏图片，避免 layoutId 冲突）
  const isSelected = selectedId === item.workId

  return (
    <article className={styles.feedCard} onClick={handleClick}>
      {/* 封面区域 - 使用 padding-bottom 预设高度 */}
      <div
        className="feedCard_cover"
        style={{ paddingBottom }}
      >
        {/* 占位背景 */}
        {!imageLoaded && <div className="feedCard_cover_placeholder" />}

        {/* 图片 - 使用 motion.img 支持共享元素过渡 */}
        {!imageError && !isSelected && (
          <motion.img
            layoutId={`feed-cover-${item.workId}`}
            src={item.thumbnail}
            alt={item.title}
            className={`feedCard_cover_img ${imageLoaded ? 'feedCard_cover_img-loaded' : ''}`}
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          />
        )}

        {/* 选中时的占位（防止布局跳动） */}
        {isSelected && (
          <div 
            className="feedCard_cover_placeholder" 
            style={{ opacity: 0.5 }}
          />
        )}

        {/* 图片加载失败时显示占位 */}
        {imageError && (
          <div className="feedCard_cover_error">
            <svg className="feedCard_cover_error_icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}

        <div className="feedCard_cover_overlay" />

        {/* 视频标识 */}
        {item.isVideo && (
          <div className="feedCard_video_badge">
            <svg className="feedCard_video_icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {item.videoDuration ? formatDuration(item.videoDuration) : t('video')}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="feedCard_content">
        {/* 标题 */}
        <h3 className="feedCard_title">{item.title || t('noTitle')}</h3>

        {/* 底部信息 */}
        <div className="feedCard_footer">
          {/* 作者信息 */}
          <div className="feedCard_author">
            <img
              src={item.authorAvatar || '/images/default-avatar.png'}
              alt={item.authorName}
              className="feedCard_author_avatar"
              loading="lazy"
            />
            <span className="feedCard_author_name">{item.authorName}</span>
          </div>

          {/* 点赞数 */}
          <div className="feedCard_likes">
            <svg className="feedCard_likes_icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{item.likeCount}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * 卡片骨架屏
 */
export function FeedCardSkeleton() {
  return (
    <div className={styles.feedCardSkeleton}>
      <div className="skeleton_cover" />
      <div className="skeleton_content">
        <div className="skeleton_title" />
        <div className="skeleton_title_short" />
        <div className="skeleton_footer">
          <div className="skeleton_author">
            <div className="skeleton_avatar" />
            <div className="skeleton_name" />
          </div>
          <div className="skeleton_likes" />
        </div>
      </div>
    </div>
  )
}

export default memo(FeedCard)
