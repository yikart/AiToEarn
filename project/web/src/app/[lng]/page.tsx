/**
 * 首页 - AI Agent 内容生成
 * 功能：AI 驱动的内容创作、提示词画廊、任务预览
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { HomeChat } from '@/components/Home/HomeChat'
import { TaskPreview } from '@/components/Home/TaskPreview'
import PromptGallery from '@/components/Home/PromptGallery'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
// store
import { useUserStore } from '@/store/user'

/**
 * 回到顶部按钮组件
 * @param position 按钮位置，'left' 或 'right'
 */
function BackToTop({ position = 'left' }: { position?: 'left' | 'right' }) {
  const [isVisible, setIsVisible] = useState(false)

  // 监听滚动显示/隐藏按钮
  useEffect(() => {
    const handleScroll = () => {
      // 滚动超过 400px 显示按钮
      setIsVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 点击回到顶部
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <Button
      size="icon"
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-8 z-50 w-12 h-12 rounded-full',
        'shadow-lg transition-all duration-300 transform',
        position === 'left' ? 'left-8' : 'right-8',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      )}
      aria-label="回到顶部"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  )
}

export default function Home() {
  // 获取登录状态
  const token = useUserStore((state) => state.token)
  const router = useRouter()

  // 用于接收从 PromptGallery 应用的提示词
  const [appliedPrompt, setAppliedPrompt] = useState<{
    prompt: string
    image?: string
    mode: 'edit' | 'generate'
  } | null>(null)

  /** 检查登录状态 */
  const handleLoginRequired = () => {
    if (!token) {
      router.push('/auth/login')
    }
  }

  /** 处理应用提示词 */
  const handleApplyPrompt = useCallback(
    (data: { prompt: string; image?: string; mode: 'edit' | 'generate' }) => {
      setAppliedPrompt(data)
      // 可以在这里扩展更多逻辑，比如自动填充到 HomeChat
    },
    []
  )

  return (
    <div className="min-h-screen bg-background">
      {/* 首屏 Chat 区域 */}
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <HomeChat
          onLoginRequired={token ? undefined : handleLoginRequired}
          appliedPrompt={appliedPrompt}
          onAppliedPromptHandled={() => setAppliedPrompt(null)}
        />
      </section>

      {/* 任务预览区域 - 无数据时自动隐藏 */}
      <TaskPreview limit={4} className="px-4 py-8 border-t border-border" />

      {/* 提示词画廊区域 */}
      <section className="border-t border-border">
        <PromptGallery onApplyPrompt={handleApplyPrompt} />
      </section>

      {/* 回到顶部按钮 - 左侧 */}
      <BackToTop position="left" />
    </div>
  )
}
