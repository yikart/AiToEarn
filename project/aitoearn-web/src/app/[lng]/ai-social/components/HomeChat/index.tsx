/**
 * HomeChat - 首页Chat组件
 * 功能：大尺寸聊天输入框，使用全局 AgentStore 发起 SSE 任务，获取 taskId 后跳转到对话详情页
 */

'use client'

import Image from 'next/image'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoArr } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { useChannelManagerStore } from '@/components/ChannelManager'
import { ChatInput } from '@/components/Chat/ChatInput'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

import { useAgentStore } from '@/store/agent'
import { useUserStore } from '@/store/user'
import { navigateToLogin } from '@/utils/auth'
import './style.css'

export interface IHomeChatProps {
  /** 登录检查回调 */
  onLoginRequired?: () => void
  /** 自定义类名 */
  className?: string
  /** 外部设置的提示词 */
  externalPrompt?: string
  /** 外部设置的素材图片列表 */
  externalMaterials?: string[]
  /** 清除外部提示词的回调 */
  onClearExternalPrompt?: () => void
  /** 从任务页面跳转带来的任务ID，优先显示在输入框 */
  agentTaskId?: string
}

/** HomeChat 组件的 ref 接口 */
export interface IHomeChatRef {
  /** 处理文件拖拽上传 */
  handleFileDrop: (files: FileList) => void
}

/**
 * HomeChat - 首页Chat组件
 */
export const HomeChat = forwardRef<IHomeChatRef, IHomeChatProps>(
  ({ onLoginRequired, className, externalPrompt, externalMaterials, onClearExternalPrompt, agentTaskId }, ref) => {
    const { t } = useTransClient('chat')
    const { t: tHome } = useTransClient('home')
    const router = useRouter()
    const { lng } = useParams()
    const token = useUserStore(state => state.token)

    // 获取默认提示文本
    const defaultPrompt
      = t('input.placeholder') || 'Help me create a cat dancing video and post it directly on YouTube'

    // 状态 - 初始为空，使用 placeholder 显示提示文本
    const [inputValue, setInputValue] = useState('')

    // 当外部提示词或 agentTaskId 变化时更新输入框
    useEffect(() => {
      if (agentTaskId) {
        // 优先从 localStorage 读取 agentExternalPrompt（任务页可能在跳转前写入）
        let desc = ''
        try {
          const stored = localStorage.getItem('agentExternalPrompt')
          if (stored) {
            desc = stored
            localStorage.removeItem('agentExternalPrompt')
          }
        }
        catch (e) {
          // ignore
        }

        desc = externalPrompt || defaultPrompt

        setInputValue(`${desc} TaskId: ${agentTaskId}`)
        onClearExternalPrompt?.()
        return
      }

      if (externalPrompt) {
        setInputValue(externalPrompt)
      }

      // 处理外部 materials - 覆盖现有素材，并添加完整域名
      if (externalMaterials && externalMaterials.length > 0) {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const newMedias = externalMaterials.map((url, idx) => ({
          id: `external-${Date.now()}-${idx}`,
          url: url.startsWith('http') ? url : `${origin}${url}`,
          type: 'image' as const,
        }))
        setMedias(newMedias) // 覆盖而非追加
      }

      if (externalPrompt || (externalMaterials && externalMaterials.length > 0)) {
        onClearExternalPrompt?.()
      }
    }, [externalPrompt, externalMaterials, onClearExternalPrompt, agentTaskId])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 频道管理器
    const { openConnectList } = useChannelManagerStore(
      useShallow(state => ({
        openConnectList: state.openConnectList,
      })),
    )

    // 处理添加账号点击 - 未登录时跳转登录页
    const handleAddChannelClick = useCallback(() => {
      if (!token) {
        navigateToLogin()
        return
      }
      openConnectList()
    }, [token, openConnectList])

    // 使用媒体上传 Hook
    const {
      medias,
      setMedias,
      isUploading,
      handleMediasChange,
      handleMediaRemove,
      handleMediaUpdate,
      clearMedias,
    } = useMediaUpload({
      onError: () => toast.error(t('media.uploadFailed')),
    })

    // 暴露方法给父组件（用于全屏拖拽上传）
    useImperativeHandle(
      ref,
      () => ({
        handleFileDrop: (files: FileList) => {
          handleMediasChange(files)
        },
      }),
      [handleMediasChange],
    )

    const searchParams = useSearchParams()

    useEffect(() => {
      try {
        if (!searchParams)
          return

        // 处理从品牌推广页跳转来的参数
        const promptParam = searchParams.get('prompt')

        if (promptParam) {
          setInputValue(decodeURIComponent(promptParam))
          // 清理 URL 参数
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('prompt')
            window.history.replaceState({}, '', url.toString())
          }
        }

        // 处理 AI 生成分享的参数
        const aiGenerated = searchParams.get('aiGenerated')
        if (aiGenerated === 'true') {
          const mediasParam = searchParams.get('medias')
          const descriptionParam = searchParams.get('description')
          if (descriptionParam) {
            setInputValue(decodeURIComponent(descriptionParam) || defaultPrompt)
          }
          if (mediasParam) {
            try {
              const medias = JSON.parse(decodeURIComponent(mediasParam))
              if (Array.isArray(medias) && medias.length > 0) {
                setMedias(prev => [
                  {
                    id: `shared-${Date.now()}`,
                    url: medias[0].url,
                    type: 'image',
                    file: undefined,
                  },
                  ...prev,
                ])
              }
            }
            catch (e) {
              // ignore parse errors
            }
          }
          // remove params to avoid re-processing (replaceState)
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('aiGenerated')
            url.searchParams.delete('medias')
            url.searchParams.delete('description')
            window.history.replaceState({}, '', url.toString())
          }
        }
      }
      catch (e) {
        // ignore
      }
    }, [searchParams])

    // 全局 Store
    const { setPendingTask, setActionContext } = useAgentStore()

    /**
     * 设置 Action 上下文（用于处理任务结果的 action）
     */
    useEffect(() => {
      setActionContext({
        router,
        lng: lng as string,
        t: tHome,
      })
    }, [router, lng, tHome, setActionContext])

    /** 实际执行发送的函数 */
    const doSend = useCallback(() => {
      // 如果用户没有输入，使用占位符文案
      const actualPrompt = inputValue.trim() || defaultPrompt

      // 保存当前输入
      const currentPrompt = actualPrompt
      const currentMedias = [...medias]

      // 设置 loading 状态，保留输入内容让用户知道正在处理
      setIsSubmitting(true)

      // 将任务存入 store，立即跳转
      setPendingTask({
        prompt: currentPrompt,
        medias: currentMedias,
      })

      // 立即跳转到聊天页面（使用 "new" 作为临时 taskId）
      router.push(`/chat/new`)
    }, [inputValue, medias, router, lng, setPendingTask])

    /** 处理发送消息 */
    const handleSend = useCallback(async () => {
      // 检查登录状态 - 未登录时存储 pendingTask 后跳转登录页
      if (!token) {
        // 如果用户没有输入，使用占位符文案
        const actualPrompt = inputValue.trim() || defaultPrompt
        sessionStorage.setItem('pendingTask', JSON.stringify({ prompt: actualPrompt, medias }))
        navigateToLogin(`/chat/new`)
        return
      }

      // 执行发送逻辑
      doSend()
    }, [token, doSend, inputValue, defaultPrompt, medias, lng])

    return (
      <div className={cn('w-full max-w-3xl mx-auto', className)}>
        {/* 标题区域 */}
        <div className="text-center mb-6 px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl text-foreground font-semibold leading-relaxed">
            {tHome('agentGenerator.subtitle')}
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
          onMediaUpdate={handleMediaUpdate}
          isGenerating={isSubmitting}
          isUploading={isUploading}
          placeholder={defaultPrompt}
          mode="large"
          allowEmptySubmit
        />

        {/* 平台工具链接提示 */}
        <div
          className="flex items-center gap-3 mb-2 cursor-pointer bg-muted rounded-b-xl pt-4 pb-3 px-4 -mt-3 relative"
          onClick={handleAddChannelClick}
        >
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t('home.connectTools')}
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

      </div>
    )
  },
)

export default HomeChat
