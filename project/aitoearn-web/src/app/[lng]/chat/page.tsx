/**
 * 分享对话查看页面 - Shared Chat View
 * 功能：通过分享 token 查看对话记录（只读模式）
 * 路由：/chat?token=xxx
 */
'use client'

import type { TaskDetail } from '@/api/agent'
import { ArrowLeft, Eye, Link2Off } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { agentApi } from '@/api/agent'
import { useTransClient } from '@/app/i18n/client'
import { ChatMessage } from '@/components/Chat/ChatMessage'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/hooks'
import { convertMessages } from './[taskId]/utils'

/** 分享页面加载骨架屏 */
function SharedChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="w-8 h-8 rounded-md" />
        <Skeleton className="h-5 w-40" />
      </div>
      {/* Messages skeleton */}
      <div className="flex-1 px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 分享链接无效/过期提示 */
function SharedChatError({ type, onBack }: { type: 'notFound' | 'expired', onBack: () => void }) {
  const { t } = useTransClient('share')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-8 h-8 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-medium text-foreground">{t('sharedConversation')}</h1>
      </header>

      {/* Error content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center">
            <Link2Off className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium text-foreground">
            {type === 'expired' ? t('linkExpired') : t('linkNotFound')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {type === 'expired'
              ? t('linkExpiredDesc')
              : t('linkNotFoundDesc')}
          </p>
          <Button onClick={onBack} className="mt-2 cursor-pointer">
            {t('backToHome')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SharedChatPage() {
  const { t } = useTransClient('share')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // 状态
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'notFound' | 'expired' | null>(null)
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null)

  // 滚动控制
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 动态更新页面标题
  useDocumentTitle(taskDetail?.title, t('sharedConversation'))

  // 加载分享数据
  useEffect(() => {
    if (!token) {
      setError('notFound')
      setLoading(false)
      return
    }

    const loadSharedTask = async () => {
      try {
        setLoading(true)
        setError(null)

        let data: TaskDetail | null = null

        // Debug 模式：从本地文件加载数据
        if (token === 'debug') {
          const res = await fetch('/en/agent测试res查询发布详情数据.txt')
          const json = await res.json()
          data = json.data
        }
        else {
          // 正常模式：调用 API
          const res = await agentApi.getTaskByShareToken(token)
          data = res?.data ?? null
        }

        if (data) {
          setTaskDetail(data)
        }
        else {
          setError('notFound')
        }
      }
      catch (err: any) {
        console.error('Failed to load shared task:', err)
        // 根据错误类型判断是过期还是不存在
        if (err?.response?.status === 410 || (typeof err?.message === 'string' && err.message.includes('expired'))) {
          setError('expired')
        }
        else {
          setError('notFound')
        }
      }
      finally {
        setLoading(false)
      }
    }

    loadSharedTask()
  }, [token])

  // 返回首页
  const handleBack = useCallback(() => {
    router.push('/')
  }, [router])

  // 转换消息格式
  const displayMessages = taskDetail?.messages ? convertMessages(taskDetail.messages) : []

  // 过滤出用户和 AI 消息
  const filteredMessages = displayMessages.filter(
    message => message.role === 'user' || message.role === 'assistant',
  )

  // 加载中
  if (loading) {
    return <SharedChatSkeleton />
  }

  // 错误状态
  if (error) {
    return <SharedChatError type={error} onBack={handleBack} />
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部导航 - 只读模式 */}
      <header className="flex items-center gap-3 px-4 py-3 shrink-0">
        {/* 返回按钮 */}
        <Button variant="ghost" size="icon" onClick={handleBack} className="w-8 h-8 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* 标题 */}
        <h1 className="text-base font-medium text-foreground line-clamp-1 flex-1">
          {taskDetail?.title || t('sharedConversation')}
        </h1>

        {/* 只读标识 */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          <span className="text-xs">{t('viewOnly')}</span>
        </div>
      </header>

      {/* 消息列表 - 只读 */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 pt-4 pb-4 flex gap-4 flex-col">
            {filteredMessages.map(message => (
              <ChatMessage
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                content={message.content}
                medias={message.medias}
                status={message.status}
                errorMessage={message.errorMessage}
                createdAt={message.createdAt}
                steps={message.steps}
                // 只读模式：不显示 actions 和 publishFlows
                actions={[]}
                publishFlows={[]}
                isGenerating={false}
              />
            ))}

            {/* 底部占位元素 */}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* 底部提示 - 只读模式无输入框 */}
      <div className="p-4 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span>
            {t('viewOnly')}
            {' '}
            -
            {t('sharedConversation')}
          </span>
        </div>
      </div>
    </div>
  )
}
