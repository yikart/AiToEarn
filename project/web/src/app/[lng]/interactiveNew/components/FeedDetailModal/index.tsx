'use client'

/**
 * 作品详情弹框组件
 * 使用 Framer Motion 的 layoutId 实现共享元素过渡动画
 */

import { memo, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { HomeFeedItem } from '@/store/plugin/plats/types'
import styles from './FeedDetailModal.module.scss'

interface FeedDetailModalProps {
  /** 当前选中的作品 */
  item: HomeFeedItem | null
  /** 关闭回调 */
  onClose: () => void
}

/** 动画时长配置 */
const ANIMATION_DURATION = 0.5

/** 共享元素过渡配置 */
const layoutTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 28,
  mass: 1,
}

/**
 * 作品详情弹框
 */
function FeedDetailModal({ item, onClose }: FeedDetailModalProps) {
  const { t } = useTranslation('interactiveNew')

  /**
   * 处理点击遮罩关闭
   */
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  /**
   * 处理 ESC 键关闭
   */
  useEffect(() => {
    if (!item) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [item, onClose])

  /**
   * 锁定 body 滚动
   */
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [item])

  // 不显示时返回 null
  if (!item) return null

  const modalContent = (
    <motion.div
      className={styles.feedDetailModal}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ANIMATION_DURATION, ease: 'easeOut' }}
      onClick={handleBackdropClick}
    >
      <motion.div 
        className="feedDetailModal_wrapper"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ 
          duration: ANIMATION_DURATION,
          ease: [0.32, 0.72, 0, 1], // iOS 风格缓动
        }}
      >
        {/* 左侧：封面预览 - 使用 layoutId 实现共享元素过渡 */}
        <motion.div 
          className="feedDetailModal_preview"
          layoutId={`feed-cover-${item.workId}`}
          transition={layoutTransition}
        >
          <img
            src={item.thumbnail}
            alt={item.title}
            className="feedDetailModal_preview_img"
          />
          {item.isVideo && (
            <motion.div 
              className="feedDetailModal_preview_badge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATION_DURATION * 0.6, delay: ANIMATION_DURATION * 0.4 }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          )}
        </motion.div>

        {/* 右侧：信息和操作区 */}
        <motion.div 
          className="feedDetailModal_info"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ 
            duration: ANIMATION_DURATION,
            ease: [0.32, 0.72, 0, 1],
            delay: 0.08,
          }}
        >
          {/* 关闭按钮 */}
          <button className="feedDetailModal_close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          {/* 作者信息 */}
          <div className="feedDetailModal_author">
            <img
              src={item.authorAvatar || '/images/default-avatar.png'}
              alt={item.authorName}
              className="feedDetailModal_author_avatar"
            />
            <div className="feedDetailModal_author_info">
              <span className="feedDetailModal_author_name">{item.authorName}</span>
              <span className="feedDetailModal_author_id">@{item.authorId}</span>
            </div>
          </div>

          {/* 标题 */}
          <h2 className="feedDetailModal_title">{item.title || t('noTitle')}</h2>

          {/* 统计数据 */}
          <div className="feedDetailModal_stats">
            <div className="feedDetailModal_stats_item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{item.likeCount}</span>
            </div>
          </div>

          {/* TODO: 互动操作区 */}
          <div className="feedDetailModal_actions">
            <div className="feedDetailModal_todo">
              <span className="feedDetailModal_todo_icon">🚧</span>
              <span className="feedDetailModal_todo_text">TODO: 互动操作功能开发中...</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )

  // 使用 Portal 渲染到 body
  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}

export default memo(FeedDetailModal)
