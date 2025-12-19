/**
 * HomeChat - 首页Chat组件
 * 功能：大尺寸聊天输入框，使用全局 AgentStore 发起 SSE 任务，获取 taskId 后跳转到对话详情页
 * 支持外部传入提示词和图片（如从 PromptGallery 一键应用）
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { ChatInput } from '@/components/Chat/ChatInput'
import { useTransClient } from '@/app/i18n/client'
import { useAgentStore } from '@/store/agent'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import logo from '@/assets/images/logo.png'

/** 应用的提示词数据 */
export interface IAppliedPrompt {
  prompt: string
  image?: string
  mode: 'edit' | 'generate'
}

export interface IHomeChatProps {
  /** 登录检查回调 */
  onLoginRequired?: () => void
  /** 自定义类名 */
  className?: string
  /** 外部应用的提示词（从 PromptGallery 一键应用） */
  appliedPrompt?: IAppliedPrompt | null
  /** 提示词已处理完成的回调 */
  onAppliedPromptHandled?: () => void
}

/**
 * HomeChat - 首页Chat组件
 */
export function HomeChat({
  onLoginRequired,
  className,
  appliedPrompt,
  onAppliedPromptHandled,
}: IHomeChatProps) {
  const { t } = useTransClient('chat')
  const { t: tHome } = useTransClient('home')
  const router = useRouter()
  const { lng } = useParams()

  // 状态
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 使用媒体上传 Hook
  const {
    medias,
    setMedias,
    isUploading,
    handleMediasChange,
    handleMediaRemove,
    clearMedias,
  } = useMediaUpload({
    onError: () => toast.error(t('media.uploadFailed' as any)),
  })

  /**
   * 处理外部应用的提示词（从 PromptGallery 一键应用）
   */
  useEffect(() => {
    if (appliedPrompt) {
      // 设置提示词到输入框
      setInputValue(appliedPrompt.prompt)

      // 如果是编辑模式且有图片，添加到媒体列表
      if (appliedPrompt.mode === 'edit' && appliedPrompt.image) {
        setMedias([
          {
            url: appliedPrompt.image,
            type: 'image',
          },
        ])
      }

      // 通知父组件已处理完成
      onAppliedPromptHandled?.()

      // 显示提示
      toast.success('提示词已应用，可直接发送或修改后发送')
    }
  }, [appliedPrompt, setMedias, onAppliedPromptHandled])

  // 全局 Store
  const { createTask, setActionContext } = useAgentStore()

  /**
   * 设置 Action 上下文（用于处理任务结果的 action）
   */
  useEffect(() => {
    setActionContext({
      router,
      lng: lng as string,
      t: tHome as any,
    })
  }, [router, lng, tHome, setActionContext])

  /** 处理发送消息 */
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return

    setIsSubmitting(true)

    // 保存当前输入（因为下面会清空）
    const currentPrompt = inputValue
    const currentMedias = [...medias]

    // 清空输入
    setInputValue('')
    clearMedias()

    try {
      // 使用全局 Store 创建任务
      await createTask({
        prompt: currentPrompt,
        medias: currentMedias,
        t: t as (key: string) => string,
        onLoginRequired,
        onTaskIdReady: (taskId) => {
          console.log('[HomeChat] Task ID ready:', taskId)
          // 收到 taskId 后立即跳转到对话详情页
          router.push(`/${lng}/chat/${taskId}`)
        },
      })
    } catch (error: any) {
      toast.error(error.message || t('message.error' as any))
      console.error('Create task failed:', error)
      // 恢复输入
      setInputValue(currentPrompt)
    } finally {
      setIsSubmitting(false)
    }
  }, [inputValue, medias, onLoginRequired, router, lng, t, createTask, clearMedias])

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {/* 标题区域 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 mb-3">
          <Image
            src={logo}
            alt="AiToEarn"
            width={56}
            height={56}
            className="w-14 h-14 object-contain"
          />
          <span className="text-foreground font-bold text-3xl">AiToEarn</span>
        </div>
        <p className="text-base text-muted-foreground">
          {tHome('agentGenerator.subtitle' as any) || t('home.subtitle' as any)}
        </p>
      </div>

      {/* 聊天输入框 */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        medias={medias}
        onMediasChange={handleMediasChange}
        onMediaRemove={handleMediaRemove}
        isGenerating={isSubmitting}
        isUploading={isUploading}
        placeholder={t('input.placeholder' as any)}
        mode="large"
      />

      {/* 提示标签 */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-medium">
          <Sparkles className="w-3 h-3" />
          {t('home.aiCreation' as any)}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs">
          {t('home.supportUpload' as any)}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs">
          {t('home.enterToSend' as any)}
        </span>
      </div>
    </div>
  )
}

export default HomeChat
