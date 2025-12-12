'use client'

/**
 * 作品详情弹框组件
 * 弹框从卡片位置放大展开到屏幕中央（类似小红书效果）
 */

import { memo, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { HomeFeedItem } from '@/store/plugin/plats/types'
import type { ClickRect } from '../FeedCard'
import styles from './FeedDetailModal.module.scss'

interface FeedDetailModalProps {
  /** 当前选中的作品 */
  item: HomeFeedItem | null
  /** 点击位置 */
  clickRect?: ClickRect | null
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 作品详情弹框
 */
function FeedDetailModal({ item, clickRect, onClose }: FeedDetailModalProps) {
  const { t } = useTranslation('interactiveNew')

  /**
   * 计算弹框的最终尺寸和位置
   */
  const finalRect = useMemo(() => {
    const modalWidth = Math.min(window.innerWidth * 0.9, 1100)
    const modalHeight = Math.min(window.innerHeight * 0.85, 700)
    return {
      width: modalWidth,
      height: modalHeight,
      x: (window.innerWidth - modalWidth) / 2,
      y: (window.innerHeight - modalHeight) / 2,
    }
  }, [])

  /**
   * 初始状态（卡片位置）- 不使用透明度变化
   */
  const initialState = useMemo(() => {
    if (!clickRect) {
      return {
        x: finalRect.x,
        y: finalRect.y,
        width: finalRect.width,
        height: finalRect.height,
        borderRadius: 12,
      }
    }
    return {
      x: clickRect.x,
      y: clickRect.y,
      width: clickRect.width,
      height: clickRect.height,
      borderRadius: 12,
    }
  }, [clickRect, finalRect])

  /**
   * 最终状态（居中放大）
   */
  const animateState = useMemo(() => {
    return {
      x: finalRect.x,
      y: finalRect.y,
      width: finalRect.width,
      height: finalRect.height,
      borderRadius: 20,
    }
  }, [finalRect])

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
      transition={{ duration: 0.4 }}
      onClick={handleBackdropClick}
    >
      {/* 弹框主体 - 从卡片位置放大到中央，不使用透明度变化 */}
      <motion.div 
        className="feedDetailModal_wrapper"
        initial={initialState}
        animate={animateState}
        exit={initialState}
        transition={{ 
          type: 'spring',
          stiffness: 350,
          damping: 35,
          mass: 1,
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        {/* 左侧：封面预览 */}
        <div className="feedDetailModal_preview">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="feedDetailModal_preview_img"
          />
          {item.isVideo && (
            <div className="feedDetailModal_preview_badge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* 右侧：信息和操作区 */}
        <div className="feedDetailModal_info">
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
        </div>
      </motion.div>
    </motion.div>
  )

  // 使用 Portal 渲染到 body
  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}

export default memo(FeedDetailModal)
