/**
 * HomeChat - 首页Chat组件
 * 功能：大尺寸聊天输入框，提交后跳转到对话详情页
 */

'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { ChatInput } from '@/components/Chat/ChatInput'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import { useTransClient } from '@/app/i18n/client'
import { uploadToOss } from '@/api/oss'
import { agentApi } from '@/api/agent'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import logo from '@/assets/images/logo.png'

export interface IHomeChatProps {
  /** 登录检查回调 */
  onLoginRequired?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * HomeChat - 首页Chat组件
 */
export function HomeChat({ onLoginRequired, className }: IHomeChatProps) {
  const { t } = useTransClient('chat')
  const { t: tHome } = useTransClient('home')
  const router = useRouter()
  const { lng } = useParams()

  // 状态
  const [inputValue, setInputValue] = useState('')
  const [medias, setMedias] = useState<IUploadedMedia[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // AbortController 用于取消上传
  const uploadAbortRef = useRef<AbortController | null>(null)

  /** 处理媒体文件上传 */
  const handleMediasChange = useCallback(async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    uploadAbortRef.current = new AbortController()

    try {
      const newMedias: IUploadedMedia[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isVideo = file.type.startsWith('video/')

        // 添加到列表，显示上传进度
        const mediaIndex = medias.length + newMedias.length
        const tempMedia: IUploadedMedia = {
          url: '',
          type: isVideo ? 'video' : 'image',
          progress: 0,
          file,
        }
        newMedias.push(tempMedia)
        setMedias((prev) => [...prev, tempMedia])

        // 上传文件
        const key = await uploadToOss(file, {
          onProgress: (progress) => {
            setMedias((prev) =>
              prev.map((m, idx) =>
                idx === mediaIndex ? { ...m, progress } : m,
              ),
            )
          },
          signal: uploadAbortRef.current?.signal,
        })

        // 上传完成，更新URL并移除进度
        setMedias((prev) =>
          prev.map((m, idx) =>
            idx === mediaIndex
              ? { ...m, url: key as string, progress: undefined }
              : m,
          ),
        )
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Upload cancelled')
      } else {
        toast.error(t('media.uploadFailed' as any))
        console.error('Upload failed:', error)
      }
    } finally {
      setIsUploading(false)
      uploadAbortRef.current = null
    }
  }, [medias.length])

  /** 处理移除媒体 */
  const handleMediaRemove = useCallback((index: number) => {
    setMedias((prev) => prev.filter((_, i) => i !== index))
  }, [])

  /** 处理发送消息 */
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return

    // 检查登录状态
    if (onLoginRequired) {
      onLoginRequired()
      return
    }

    setIsSubmitting(true)

    try {
      // 准备媒体附件
      const mediaUrls = medias
        .filter((m) => m.url && !m.progress)
        .map((m) => m.url)

      // 调用创建任务接口
      const result = await agentApi.createTask({
        prompt: inputValue,
      })

      if (result.code === 0 && result.data?.id) {
        // 跳转到对话详情页
        router.push(`/${lng}/chat/${result.data.id}`)
      } else {
        toast.error(result.msg || t('message.error' as any))
      }
    } catch (error: any) {
      toast.error(error.message || t('message.error' as any))
      console.error('Create task failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [inputValue, medias, onLoginRequired, router, lng])

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {/* 标题区域 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-200 mb-4">
          <Image
            src={logo}
            alt="AiToEarn"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {tHome('agentGenerator.title' as any) || t('home.title' as any)}
        </h1>
        <p className="text-sm text-gray-500">
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
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
          <Sparkles className="w-3 h-3" />
          {t('home.aiCreation' as any)}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs">
          {t('home.supportUpload' as any)}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs">
          {t('home.enterToSend' as any)}
        </span>
      </div>
    </div>
  )
}

export default HomeChat

