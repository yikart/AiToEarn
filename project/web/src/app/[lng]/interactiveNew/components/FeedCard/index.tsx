'use client'

/**
 * 作品卡片组件
 * 展示封面、标题、作者信息、点赞数等
 * 使用 Framer Motion 实现共享元素过渡动画
 */

import { memo, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CaretRightOutlined,
  HeartFilled,
  PictureOutlined,
} from '@ant-design/icons'
import type { HomeFeedItem } from '@/store/plugin/plats/types'
import styles from './FeedCard.module.scss'

/** 点击位置信息 */
export interface ClickRect {
  x: number
  y: number
  width: number
  height: number
}

interface FeedCardProps {
  /** 作品数据 */
  item: HomeFeedItem
  /** 点击回调，包含点击位置 */
  onClick?: (item: HomeFeedItem, rect: ClickRect) => void
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
function FeedCard({ item, onClick }: FeedCardProps) {
  const { t } = useTranslation('interactiveNew')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onClick?.(item, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    })
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

  return (
    <article className={styles.feedCard} onClick={handleClick}>
      {/* 封面区域 - 使用 padding-bottom 预设高度 */}
      <div
        className="feedCard_cover"
        style={{ paddingBottom }}
      >
        {/* 占位背景 */}
        {!imageLoaded && <div className="feedCard_cover_placeholder" />}

        {/* 图片 */}
        {!imageError && (
          <img
            src={item.thumbnail}
            alt={item.title}
            className={`feedCard_cover_img ${imageLoaded ? 'feedCard_cover_img-loaded' : ''}`}
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* 图片加载失败时显示占位 */}
        {imageError && (
          <div className="feedCard_cover_error">
            <PictureOutlined className="feedCard_cover_error_icon" />
          </div>
        )}

        <div className="feedCard_cover_overlay" />

        {/* 视频标识 */}
        {item.isVideo && (
          <div className="feedCard_video_badge">
            <CaretRightOutlined className="feedCard_video_icon" />
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
          {/* 作者信息 - 点击跳转作者主页 */}
          <a
            href={item.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="feedCard_author"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={item.authorAvatar || '/images/default-avatar.png'}
              alt={item.authorName}
              className="feedCard_author_avatar"
              loading="lazy"
            />
            <span className="feedCard_author_name">{item.authorName}</span>
          </a>

          {/* 点赞数 */}
          <div className={`feedCard_likes ${item.isLiked ? 'feedCard_likes-active' : ''}`}>
            <HeartFilled className="feedCard_likes_icon" />
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
