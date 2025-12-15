'use client'

/**
 * 作品详情弹框组件
 * 弹框从卡片位置放大展开到屏幕中央（类似小红书效果）
 */

import { memo, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CaretRightOutlined,
  CheckOutlined,
  CloseOutlined,
  HeartFilled,
  StarFilled,
} from '@ant-design/icons'
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
              <CaretRightOutlined />
            </div>
          )}
        </div>

        {/* 右侧：信息和操作区 */}
        <div className="feedDetailModal_info">
          {/* 关闭按钮 */}
          <button className="feedDetailModal_close" onClick={onClose}>
            <CloseOutlined />
          </button>

          {/* 作者信息 */}
          <div className="feedDetailModal_author">
            <a
              href={item.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="feedDetailModal_author_link"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={item.authorAvatar || '/images/default-avatar.png'}
                alt={item.authorName}
                className="feedDetailModal_author_avatar"
              />
            </a>
            <div className="feedDetailModal_author_info">
              <a
                href={item.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="feedDetailModal_author_name_link"
                onClick={(e) => e.stopPropagation()}
              >
                {item.authorName}
              </a>
              <span className="feedDetailModal_author_id">@{item.authorId}</span>
            </div>
            {/* 关注状态 */}
            {item.isFollowed && (
              <span className="feedDetailModal_author_followed">
                <CheckOutlined />
                {t('followed')}
              </span>
            )}
          </div>

          {/* 标题 */}
          <h2 className="feedDetailModal_title">{item.title || t('noTitle')}</h2>

          {/* 话题标签 - 放在标题后面 */}
          {item.topics && item.topics.length > 0 && (
            <div className="feedDetailModal_topics">
              {item.topics.map((topic, index) => (
                <a
                  key={index}
                  href={topic.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feedDetailModal_topic"
                  onClick={(e) => e.stopPropagation()}
                >
                  #{topic.name}
                </a>
              ))}
            </div>
          )}

          {/* 统计数据 */}
          <div className="feedDetailModal_stats">
            {/* 点赞 */}
            <div className={`feedDetailModal_stats_item ${item.isLiked ? 'feedDetailModal_stats_item-active' : ''}`}>
              <HeartFilled />
              <span>{item.likeCount}</span>
              {item.isLiked && <span className="feedDetailModal_stats_label">{t('liked')}</span>}
            </div>
            {/* 收藏 */}
            <div className={`feedDetailModal_stats_item ${item.isCollected ? 'feedDetailModal_stats_item-collected' : ''}`}>
              <StarFilled />
              <span>{item.isCollected ? t('collected') : t('collect')}</span>
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
