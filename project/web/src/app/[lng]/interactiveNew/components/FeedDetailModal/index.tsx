'use client'

/**
 * 作品详情弹框组件
 * 参考小红书详情页布局：
 * - 左侧：媒体区域（图片轮播/视频播放）
 * - 右侧：详情区域
 *
 * 模块化拆分：
 * - MediaSection: 左侧媒体区域
 * - DetailSection: 右侧详情区域
 * - detailStore: 状态管理
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { CloseOutlined } from '@ant-design/icons'
import { useDetailModalStore } from '../../store/detailStore'
import MediaSection from './MediaSection'
import DetailSection from './DetailSection'
import styles from './FeedDetailModal.module.scss'

interface FeedDetailModalProps {
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 作品详情弹框
 */
function FeedDetailModal({ onClose }: FeedDetailModalProps) {
  const { clickRect, preview, detail, imagePreviewVisible } = useDetailModalStore()

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
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
    },
    [onClose]
  )

  /**
   * 处理 ESC 键关闭（图片预览时不关闭）
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !imagePreviewVisible) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, imagePreviewVisible])

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
  if (!preview && !detail) return null

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
        <MediaSection />

        {/* 右侧：详情区域 */}
        <DetailSection />
      </motion.div>
    </motion.div>
  )

  // 使用 Portal 渲染到 body
  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}

export default memo(FeedDetailModal)
