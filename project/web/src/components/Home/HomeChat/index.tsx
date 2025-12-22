/**
 * HomeChat - 首页Chat组件
 * 功能：大尺寸聊天输入框，使用全局 AgentStore 发起 SSE 任务，获取 taskId 后跳转到对话详情页
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { ChatInput } from '@/components/Chat/ChatInput'
import { useTransClient } from '@/app/i18n/client'
import { useAgentStore } from '@/store/agent'
import { useUserStore } from '@/store/user'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { AccountPlatInfoArr } from '@/app/config/platConfig'
import AddAccountModal from '@/app/[lng]/accounts/components/AddAccountModal'
import { openLoginModal } from '@/store/loginModal'

export interface IHomeChatProps {
  /** 登录检查回调 */
  onLoginRequired?: () => void
  /** 自定义类名 */
  className?: string
  /** 外部设置的提示词 */
  externalPrompt?: string
  /** 清除外部提示词的回调 */
  onClearExternalPrompt?: () => void
  /** 从任务页面跳转带来的任务ID，优先显示在输入框 */
  agentTaskId?: string
}

/**
 * HomeChat - 首页Chat组件
 */
export function HomeChat({
  onLoginRequired,
  className,
  externalPrompt,
  onClearExternalPrompt,
}: IHomeChatProps) {
  const { t } = useTransClient('chat')
  const { t: tHome } = useTransClient('home')
  const router = useRouter()
  const { lng } = useParams()
  const token = useUserStore(state => state.token)

  // 获取默认提示文本
  const defaultPrompt = t('input.placeholder' as any) || 'Help me create a cat dancing video and post it directly on YouTube'

  // 状态 - 默认显示提示文本
  const [inputValue, setInputValue] = useState(defaultPrompt)

  // 当外部提示词或 agentTaskId 变化时更新输入框
  useEffect(() => {
    if (agentTaskId) {
      setInputValue(agentTaskId)
      return
    }
    if (externalPrompt) {
      setInputValue(externalPrompt)
      onClearExternalPrompt?.()
    }
  }, [externalPrompt, onClearExternalPrompt, agentTaskId])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addAccountVisible, setAddAccountVisible] = useState(false)

  // 处理添加账号点击 - 未登录时弹出登录弹窗
  const handleAddChannelClick = useCallback(() => {
    if (!token) {
      openLoginModal(() => setAddAccountVisible(true))
      return
    }
    setAddAccountVisible(true)
  }, [token])

  // 使用媒体上传 Hook
  const {
    medias,
    isUploading,
    handleMediasChange,
    handleMediaRemove,
    clearMedias,
  } = useMediaUpload({
    onError: () => toast.error(t('media.uploadFailed' as any)),
  })

  // 全局 Store
  const { setPendingTask, setActionContext } = useAgentStore()

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

  /** 实际执行发送的函数 */
  const doSend = useCallback(() => {
    if (!inputValue.trim()) return

    // 保存当前输入
    const currentPrompt = inputValue
    const currentMedias = [...medias]

    // 清空输入
    setInputValue('')
    clearMedias()

    // 将任务存入 store，立即跳转
    setPendingTask({
      prompt: currentPrompt,
      medias: currentMedias,
    })

    // 立即跳转到聊天页面（使用 "new" 作为临时 taskId）
    router.push(`/${lng}/chat/new`)
  }, [inputValue, medias, router, lng, setPendingTask, clearMedias])

  /** 处理发送消息 */
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return

    // 检查登录状态 - 未登录时显示登录弹窗
    if (!token) {
      openLoginModal(doSend)
      return
    }

    // 执行发送逻辑
    doSend()
  }, [inputValue, token, doSend])

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {/* 标题区域 */}
      <div className="text-center mb-6 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl text-foreground font-semibold leading-relaxed">
          {tHome('agentGenerator.subtitle' as any) || t('home.subtitle' as any)}
        </h1>
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
        placeholder=""
        mode="large"
      />

        {/* 平台工具链接提示 */}
        <div
          className="flex items-center gap-3 mb-2 cursor-pointer"
          style={{
            backgroundColor: '#F2F2F1',
            borderBottomLeftRadius: '10px',
            borderBottomRightRadius: '10px',
            paddingTop: '16px',
            paddingBottom: '12px',
            paddingLeft: '16px',
            paddingRight: '16px',
            marginTop: '-12px',
            position: 'relative',
          }}
          onClick={handleAddChannelClick}
        >
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t('home.connectTools' as any)}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {AccountPlatInfoArr.map(([key, value]) => (
              <Image
                key={key}
                src={value.icon}
                alt={value.name}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-contain hover:scale-110 hover:opacity-80 transition-all"
                title={value.name}
              />
            ))}
          </div>
        </div>

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

      {/* 添加账号弹窗 */}
      <AddAccountModal
        open={addAccountVisible}
        onClose={() => setAddAccountVisible(false)}
        onAddSuccess={() => setAddAccountVisible(false)}
        showSpaceSelector={true}
      />
    </div>
  )
}

export default HomeChat
