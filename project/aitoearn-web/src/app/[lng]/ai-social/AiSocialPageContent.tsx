/**
 * AI 社媒内容组件 - AI social media Page Content
 * 客户端组件，包含所有交互逻辑
 */
'use client'

import type { IHomeChatRef } from './components/HomeChat'
import { ArrowUp, Upload } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useAgentStore } from '@/store/agent'
import { useTransClient } from '../../i18n/client'
import AgentFeatures from './components/AgentFeatures'
import EcosystemDiagram from './components/EcosystemDiagram'
import { HomeChat } from './components/HomeChat'
import PromptGallery from './components/PromptGallery'
import TaskPreview from './components/TaskPreview'

export function AiSocialPageContent() {
  const { t } = useTransClient('home')

  // Store 方法
  const { setDebugFiles } = useAgentStore()

  // 拖拽上传状态
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const homeChatRef = useRef<IHomeChatRef>(null)

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer.files
    if (files.length > 0) {
      homeChatRef.current?.handleFileDrop(files)
    }
  }, [])

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
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    )
  }

  const [appliedPrompt, setAppliedPrompt] = useState<string>('')
  const [appliedMaterials, setAppliedMaterials] = useState<string[]>([])

  // 处理提示词应用
  const handleApplyPrompt = useCallback(
    (data: { prompt: string, materials?: string[], mode: 'edit' | 'generate' }) => {
      setAppliedPrompt(data.prompt)
      setAppliedMaterials(data.materials || [])
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast.success('Prompt applied!')
    },
    [],
  )

  // 从 URL query 读取 agentExternalPrompt 和 agentTaskId（由任务页通过 query 传参）
  const searchParams = useSearchParams()
  const router = useRouter()
  const [agentTaskId, setAgentTaskId] = useState<string>('')
  const params = useParams()

  // 解析 debug URL 参数，设置 debug 模式
  useEffect(() => {
    try {
      const debugParam = searchParams.get('debug')
      if (debugParam) {
        // 解析 debug=[file1.txt,file2.txt] 或 debug=file1.txt,file2.txt 格式
        const cleanedParam = debugParam.replace(/^\[|\]$/g, '')
        const files = cleanedParam
          .split(',')
          .map(f => f.trim())
          .filter(Boolean)

        if (files.length > 0) {
          setDebugFiles(files)

          // 清理 URL 上的 debug 参数
          const url = new URL(window.location.href)
          url.searchParams.delete('debug')
          router.replace(url.pathname + url.search)
        }
      }
    }
    catch (e) {
      console.warn('[AiSocialPageContent] Failed to parse debug param:', e)
    }
  }, [searchParams, router, setDebugFiles])

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
        router.replace(`/${params.lng}/ai-social`)
      }
    }
    catch (e) {
      // ignore
    }
  }, [searchParams, router, params.lng])

  // 清除外部提示词
  const handleClearExternalPrompt = useCallback(() => {
    setAppliedPrompt('')
    setAppliedMaterials([])
  }, [])

  return (
    <div
      className="bg-background"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 拖拽遮罩层 */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-primary bg-card">
            <Upload className="w-12 h-12 text-primary" />
            <p className="text-lg font-medium text-foreground">{t('dropToUpload')}</p>
          </div>
        </div>
      )}

      {/* 首屏 Chat 区域 */}
      <section className="min-h-[60vh] flex items-center justify-center px-4 pt-16 pb-8 md:pt-24 md:pb-12">
        <HomeChat
          ref={homeChatRef}
          externalPrompt={appliedPrompt}
          externalMaterials={appliedMaterials}
          onClearExternalPrompt={handleClearExternalPrompt}
          agentTaskId={agentTaskId}
        />
      </section>

      {/* 任务预览区域 - 无数据时自动隐藏 */}
      <TaskPreview limit={4} className="px-4 py-8" />

      {/* /!* 提示词画廊区域 *!/ */}
      <PromptGallery onApplyPrompt={handleApplyPrompt} />

      {/* AI Agent 功能亮点（独立展示） */}
      <AgentFeatures />

      {/* 一图解读 AiToEarn 生态 */}
      <EcosystemDiagram />

      {/* 回到顶部按钮 - 右侧 */}
      <BackToTop position="right" />
    </div>
  )
}
