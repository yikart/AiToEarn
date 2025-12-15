'use client'

/**
 * 作品详情弹框组件
 * 参考小红书详情页布局：
 * - 左侧：媒体区域（图片/视频）
 * - 右侧：详情区域
 *   - 顶部：作者区域（固定）
 *   - 中间：可滚动区域（描述、话题、评论）
 *   - 底部：操作区域（固定）- 评论输入、点赞、收藏
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Spin, Input } from 'antd'
import {
  CaretRightOutlined,
  CloseOutlined,
  HeartFilled,
  HeartOutlined,
  LoadingOutlined,
  MessageOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons'
import { useDetailModalStore } from '../../store/detailStore'
import styles from './FeedDetailModal.module.scss'

interface FeedDetailModalProps {
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 作品详情弹框
 */
function FeedDetailModal({ onClose }: FeedDetailModalProps) {
  const { t } = useTranslation('interactiveNew')

  // 从 store 获取状态
  const { clickRect, preview, detail, loading, error } = useDetailModalStore()

  // 使用详情数据，如果没有则使用预览数据
  const displayData = useMemo(() => {
    if (detail) {
      return {
        thumbnail: detail.coverUrl,
        title: detail.title,
        authorName: detail.author.name,
        authorAvatar: detail.author.avatar,
        authorUrl: detail.author.url,
        authorId: detail.author.id,
        isVideo: detail.type === 'video',
        isLiked: detail.interactInfo.isLiked,
        isFollowed: detail.interactInfo.isFollowed,
        isCollected: detail.interactInfo.isCollected,
        likeCount: detail.interactInfo.likeCount,
        collectCount: detail.interactInfo.collectCount,
        commentCount: detail.interactInfo.commentCount,
        shareCount: detail.interactInfo.shareCount,
        description: detail.description,
        topics: detail.topics,
      }
    }
    if (preview) {
      return {
        thumbnail: preview.thumbnail,
        title: preview.title,
        authorName: preview.authorName,
        authorAvatar: preview.authorAvatar,
        authorUrl: preview.authorUrl,
        authorId: preview.authorId,
        isVideo: preview.isVideo,
        isLiked: preview.isLiked,
        isFollowed: preview.isFollowed,
        isCollected: false,
        likeCount: preview.likeCount,
        collectCount: null,
        commentCount: null,
        shareCount: null,
        description: null,
        topics: null,
      }
    }
    return null
  }, [detail, preview])

  /**
   * 计算弹框的最终尺寸和位置
   */
  const calcFinalRect = useCallback(() => {
    if (typeof window === 'undefined') {
      return { width: 1100, height: 700, x: 0, y: 0 }
    }
    const modalWidth = Math.min(window.innerWidth * 0.9, 1100)
    const modalHeight = Math.min(window.innerHeight * 0.9, 750)
    return {
      width: modalWidth,
      height: modalHeight,
      x: (window.innerWidth - modalWidth) / 2,
      y: (window.innerHeight - modalHeight) / 2,
    }
  }, [])

  const [finalRect, setFinalRect] = useState(calcFinalRect)

  // 监听窗口大小变化，重新计算位置
  useEffect(() => {
    const handleResize = () => {
      setFinalRect(calcFinalRect())
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [calcFinalRect])

  /**
   * 初始状态（卡片位置）
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
      borderRadius: 16,
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  /**
   * 锁定 body 滚动
   */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // 没有数据时不显示
  if (!displayData) return null

  const modalContent = (
    <motion.div
      className={styles.feedDetailModal}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onClick={handleBackdropClick}
    >
      {/* 关闭按钮 */}
      <button className="feedDetailModal_close" onClick={onClose}>
        <CloseOutlined />
      </button>

      {/* 弹框主体 */}
      <motion.div 
        className="feedDetailModal_wrapper"
        initial={initialState}
        animate={animateState}
        exit={initialState}
        transition={{ 
          type: 'spring',
          stiffness: 280,
          damping: 32,
          mass: 1.2,
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        {/* 左侧：媒体区域 */}
        <div className="feedDetailModal_media">
          <img
            src={displayData.thumbnail}
            alt={displayData.title}
            className="feedDetailModal_media_img"
          />
          {displayData.isVideo && (
            <div className="feedDetailModal_media_playBtn">
              <CaretRightOutlined />
            </div>
          )}
          {/* 图片指示器（如果有多张） */}
          <div className="feedDetailModal_media_indicator">
            <span>1/4</span>
          </div>
        </div>

        {/* 右侧：详情区域 */}
        <div className="feedDetailModal_detail">
          {/* 顶部：作者区域（固定） */}
          <div className="feedDetailModal_header">
            <a
              href={displayData.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="feedDetailModal_author"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={displayData.authorAvatar || '/images/default-avatar.png'}
                alt={displayData.authorName}
                className="feedDetailModal_author_avatar"
              />
              <span className="feedDetailModal_author_name">{displayData.authorName}</span>
            </a>
            {/* 关注按钮 */}
            <button className={`feedDetailModal_followBtn ${displayData.isFollowed ? 'feedDetailModal_followBtn-followed' : ''}`}>
              {displayData.isFollowed ? t('followed') : '关注'}
            </button>
          </div>

          {/* 中间：可滚动内容区域 */}
          <div className="feedDetailModal_content">
            {/* 标题和描述 */}
            <div className="feedDetailModal_desc">
              <h2 className="feedDetailModal_desc_title">{displayData.title || t('noTitle')}</h2>
              {loading ? (
                <div className="feedDetailModal_skeleton">
                  <div className="skeleton_line" />
                  <div className="skeleton_line skeleton_line-short" />
                </div>
              ) : displayData.description && displayData.description !== displayData.title ? (
                <p className="feedDetailModal_desc_text">{displayData.description}</p>
              ) : null}

              {/* 话题标签 */}
              {loading ? (
                <div className="feedDetailModal_topics_skeleton">
                  <div className="skeleton_tag" />
                  <div className="skeleton_tag" />
                  <div className="skeleton_tag" />
                </div>
              ) : displayData.topics && displayData.topics.length > 0 ? (
                <div className="feedDetailModal_topics">
                  {displayData.topics.map((topic, index) => (
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
              ) : null}

              {/* 发布时间和位置 */}
              <div className="feedDetailModal_meta">
                <span>3小时前</span>
                <span>云南</span>
              </div>
            </div>

            {/* 评论区域 */}
            <div className="feedDetailModal_comments">
              <div className="feedDetailModal_comments_header">
                共 {loading || displayData.commentCount === null ? (
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} size="small" />
                ) : (
                  displayData.commentCount
                )} 条评论
              </div>

              {/* 评论列表 - TODO */}
              <div className="feedDetailModal_comments_list">
                <div className="feedDetailModal_comments_empty">
                  <span>🚧</span>
                  <p>评论功能开发中...</p>
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="feedDetailModal_error">
                <span>⚠️ {error}</span>
              </div>
            )}
          </div>

          {/* 底部：操作区域（固定） */}
          <div className="feedDetailModal_footer">
            {/* 评论输入框 */}
            <div className="feedDetailModal_commentInput">
              <Input
                placeholder="说点什么..."
                className="feedDetailModal_commentInput_field"
              />
            </div>

            {/* 操作按钮 */}
            <div className="feedDetailModal_actions">
              {/* 点赞 */}
              <button className={`feedDetailModal_actionBtn ${displayData.isLiked ? 'feedDetailModal_actionBtn-active' : ''}`}>
                {displayData.isLiked ? <HeartFilled /> : <HeartOutlined />}
                <span>{displayData.likeCount}</span>
              </button>

              {/* 收藏 */}
              <button className={`feedDetailModal_actionBtn ${displayData.isCollected ? 'feedDetailModal_actionBtn-collected' : ''}`}>
                {displayData.isCollected ? <StarFilled /> : <StarOutlined />}
                {loading || displayData.collectCount === null ? (
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} size="small" />
                ) : (
                  <span>{displayData.collectCount}</span>
                )}
              </button>

              {/* 评论 */}
              <button className="feedDetailModal_actionBtn">
                <MessageOutlined />
                {loading || displayData.commentCount === null ? (
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} size="small" />
                ) : (
                  <span>{displayData.commentCount}</span>
                )}
              </button>

              {/* 分享 */}
              <button className="feedDetailModal_actionBtn">
                <ShareAltOutlined />
              </button>
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
