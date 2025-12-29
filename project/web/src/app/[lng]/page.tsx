/**
 * 首页 - AI Agent 内容生成
 * 功能：AI 驱动的内容创作、任务预览
 */
'use client'

import { ArrowUp } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import AgentFeatures from '@/components/Home/AgentFeatures'
import { HomeChat } from '@/components/Home/HomeChat'
import PromptGallery from '@/components/Home/PromptGallery'
import { TaskPreview } from '@/components/Home/TaskPreview'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

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
          : 'opacity-0 translate-y-4 pointer-events-none',
      )}
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  )
}

export default function Home() {
  const [appliedPrompt, setAppliedPrompt] = useState<string>('')

  // 处理提示词应用
  const handleApplyPrompt = useCallback((data: { prompt: string, image?: string, mode: 'edit' | 'generate' }) => {
    setAppliedPrompt(data.prompt)
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success('Prompt applied!')
  }, [])

  // 从 URL query 读取 agentExternalPrompt 和 agentTaskId（由任务页通过 query 传参）
  const searchParams = useSearchParams()
  const router = useRouter()
  const [agentTaskId, setAgentTaskId] = useState<string>('')
  const params = useParams()
  useEffect(() => {
    try {
      const prompt = searchParams.get('agentExternalPrompt')
      const id = searchParams.get('agentTaskId')
      if (prompt) {
        setAppliedPrompt(prompt)
      }
      if (id) {
        setAgentTaskId(id)
      }
      // 清理 URL 上的 query，避免重复
      if (prompt || id) {
        router.replace(`/${params.lng}`)
      }
    }
    catch (e) {
      // ignore
    }
  }, [searchParams, router, params.lng])

  // 清除外部提示词
  const handleClearExternalPrompt = useCallback(() => {
    setAppliedPrompt('')
  }, [])

  return (
    <div className="bg-background">
      {/* 首屏 Chat 区域 */}
      <section className="min-h-[60vh] flex items-center justify-center px-4 pt-16 pb-8 md:pt-24 md:pb-12">
        <HomeChat
          externalPrompt={appliedPrompt}
          onClearExternalPrompt={handleClearExternalPrompt}
          agentTaskId={agentTaskId}
        />
      </section>

      {/* 任务预览区域 - 无数据时自动隐藏 */}
      <TaskPreview limit={4} className="px-4 py-8" />

      {/* 提示词画廊区域 */}
      <section>
        <PromptGallery onApplyPrompt={handleApplyPrompt} />
      </section>

      {/* AI Agent 功能亮点（独立展示） */}
      <AgentFeatures />

      {/* 回到顶部按钮 - 右侧 */}
      <BackToTop position="right" />
    </div>
  )
}
