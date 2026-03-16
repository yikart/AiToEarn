/**
 * Chat 布局组件
 * 包含移动端公告提示
 */
'use client'

import { Bot, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import styles from './layout.module.css'

const STORAGE_KEY = 'chat-announcement-dismissed'

/**
 * 移动端公告提示组件
 * 仅在移动端显示，浮动在内容区
 * 通过获取 #chatHeader 元素来动态定位，适配手机状态栏高度
 */
function MobileAnnouncementTip() {
  const { t } = useTransClient('home')
  const text = t('announcement.text')
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [needsScroll, setNeedsScroll] = useState(false)
  const [dismissed, setDismissed] = useState(true)
  const [topPosition, setTopPosition] = useState<number | null>(null)

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true'
      setDismissed(isDismissed)
    }
    catch {
      setDismissed(false)
    }
  }, [])

  // 通过 chatHeader 元素计算定位
  useEffect(() => {
    if (dismissed)
      return

    const updatePosition = () => {
      const chatHeader = document.getElementById('chatHeader')
      if (chatHeader) {
        const rect = chatHeader.getBoundingClientRect()
        // 定位在 header 底部下方 8px
        setTopPosition(rect.bottom + 8)
      }
    }

    // 初始计算位置
    updatePosition()

    // 使用 MutationObserver 监听 DOM 变化，确保 chatHeader 加载后能获取到
    const observer = new MutationObserver(() => {
      updatePosition()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    // 监听窗口 resize 和 scroll 事件
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [dismissed])

  // 检测文字是否需要滚动
  useEffect(() => {
    if (dismissed || topPosition === null)
      return

    const checkScroll = () => {
      if (containerRef.current && textRef.current) {
        setNeedsScroll(textRef.current.scrollWidth > containerRef.current.offsetWidth)
      }
    }

    // 延迟检测，确保 DOM 渲染完成
    const timer = setTimeout(checkScroll, 100)
    window.addEventListener('resize', checkScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScroll)
    }
  }, [text, dismissed, topPosition])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true')
    }
    catch {
      // ignore
    }
  }

  // 未加载位置或已关闭时不显示
  if (dismissed || topPosition === null)
    return null

  return (
    // 仅移动端显示，通过 chatHeader 动态定位
    <div
      className="md:hidden fixed left-1/2 -translate-x-1/2 z-10 w-[calc(100%-24px)] max-w-lg"
      style={{ top: topPosition }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background shadow">
        <Bot className="w-4 h-4 text-muted-foreground shrink-0" />
        <div ref={containerRef} className="flex-1 overflow-hidden flex items-center min-h-5">
          {needsScroll ? (
            <div className={styles.marquee}>
              <span ref={textRef} className="text-xs text-muted-foreground whitespace-nowrap pr-8">
                {text}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap pr-8">{text}</span>
            </div>
          ) : (
            <span ref={textRef} className="text-xs text-muted-foreground whitespace-nowrap">
              {text}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-muted text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer shrink-0"
          aria-label="关闭"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col h-full">
      <MobileAnnouncementTip />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}
