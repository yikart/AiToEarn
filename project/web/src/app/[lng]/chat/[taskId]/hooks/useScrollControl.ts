/**
 * 滚动控制 Hook
 * 管理消息列表的智能滚动行为
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface IScrollControlOptions {
  /** 判断为"底部附近"的阈值（px） */
  nearBottomThreshold?: number
  /** 显示回到底部按钮的阈值（px） */
  showButtonThreshold?: number
  /** 滚动状态重置延迟（ms） */
  scrollResetDelay?: number
}

export interface IScrollControlReturn {
  /** 消息容器 ref */
  containerRef: React.RefObject<HTMLDivElement>
  /** 消息底部 ref（用于滚动到底部） */
  bottomRef: React.RefObject<HTMLDivElement>
  /** 用户是否在底部附近 */
  isNearBottom: boolean
  /** 是否显示回到底部按钮 */
  showScrollButton: boolean
  /** 滚动到底部 */
  scrollToBottom: (force?: boolean) => void
  /** 处理滚动事件（绑定到容器） */
  handleScroll: () => void
}

/**
 * 滚动控制 Hook
 * @param options 配置选项
 */
export function useScrollControl(options: IScrollControlOptions = {}): IScrollControlReturn {
  const {
    nearBottomThreshold = 150,
    showButtonThreshold = 300,
    scrollResetDelay = 150,
  } = options

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  /** 检查是否在底部附近 */
  const checkIfNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container)
      return true

    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < nearBottomThreshold
  }, [nearBottomThreshold])

  /** 滚动到底部 */
  const scrollToBottom = useCallback((force = false) => {
    if (force) {
      isUserScrollingRef.current = false
      setIsNearBottom(true)
      setShowScrollButton(false)
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  /** 处理滚动事件 */
  const handleScroll = useCallback(() => {
    // 标记用户正在滚动
    isUserScrollingRef.current = true

    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // 延迟重置滚动状态
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, scrollResetDelay)

    const nearBottom = checkIfNearBottom()
    setIsNearBottom(nearBottom)

    // 根据距离底部的距离决定是否显示按钮
    const container = containerRef.current
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      setShowScrollButton(distanceFromBottom > showButtonThreshold)
    }
  }, [checkIfNearBottom, scrollResetDelay, showButtonThreshold])

  /** 清理定时器 */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return {
    containerRef,
    bottomRef,
    isNearBottom,
    showScrollButton,
    scrollToBottom,
    handleScroll,
  }
}
