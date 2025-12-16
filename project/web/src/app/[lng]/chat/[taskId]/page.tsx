/**
 * 对话详情页 - Chat Detail
 * 功能：显示对话历史，支持继续对话
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ChatInput } from '@/components/Chat/ChatInput'
import { ChatMessage } from '@/components/Chat/ChatMessage'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { agentApi, type TaskDetail, type TaskMessage } from '@/api/agent'
import { uploadToOss } from '@/api/oss'
import { useTransClient } from '@/app/i18n/client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import logo from '@/assets/images/logo.png'

/** 转换后端消息为前端消息格式 */
interface IDisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  medias?: IUploadedMedia[]
  status?: 'pending' | 'streaming' | 'done' | 'error'
  errorMessage?: string
  createdAt?: number
}

/**
 * 将后端消息转换为显示格式
 */
function convertMessages(messages: TaskMessage[]): IDisplayMessage[] {
  const displayMessages: IDisplayMessage[] = []

  messages.forEach((msg, index) => {
    if (msg.type === 'user') {
      // 用户消息
      let content = ''
      const medias: IUploadedMedia[] = []

      if (Array.isArray(msg.content)) {
        msg.content.forEach((item: any) => {
          if (item.type === 'text') {
            content = item.text || ''
          } else if (item.type === 'image') {
            medias.push({
              url: item.source?.url || '',
              type: 'image',
            })
          }
        })
      } else if (typeof msg.content === 'string') {
        content = msg.content
      }

      displayMessages.push({
        id: msg.uuid || `user-${index}`,
        role: 'user',
        content,
        medias: medias.length > 0 ? medias : undefined,
        status: 'done',
      })
    } else if (msg.type === 'assistant' || msg.type === 'result') {
      // AI 回复
      let content = ''

      if (Array.isArray(msg.content)) {
        msg.content.forEach((item: any) => {
          if (item.type === 'text') {
            content += item.text || ''
          }
        })
      } else if (typeof msg.content === 'string') {
        content = msg.content
      }

      if (content) {
        displayMessages.push({
          id: msg.uuid || `assistant-${index}`,
          role: 'assistant',
          content,
          status: 'done',
        })
      }
    }
  })

  return displayMessages
}

export default function ChatDetailPage() {
  const { t } = useTransClient('chat')
  const router = useRouter()
  const params = useParams()
  const taskId = params.taskId as string
  const lng = params.lng as string

  // 状态
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [messages, setMessages] = useState<IDisplayMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [medias, setMedias] = useState<IUploadedMedia[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamContent, setStreamContent] = useState('')

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  /** 滚动到底部 */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  /** 加载任务详情 */
  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) return

      setIsLoading(true)
      try {
        const result = await agentApi.getTaskDetail(taskId)
        if (result.code === 0 && result.data) {
          setTask(result.data)
          // 转换消息格式
          if (result.data.messages) {
            setMessages(convertMessages(result.data.messages))
          }
        } else {
          toast.error(result.msg || t('message.error' as any))
        }
      } catch (error) {
        console.error('Load task detail failed:', error)
        toast.error(t('message.error' as any))
      } finally {
        setIsLoading(false)
      }
    }

    loadTask()
  }, [taskId])

  /** 滚动到底部 */
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamContent, scrollToBottom])

  /** 处理媒体文件上传 */
  const handleMediasChange = useCallback(async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    uploadAbortRef.current = new AbortController()

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isVideo = file.type.startsWith('video/')

        const mediaIndex = medias.length + i
        const tempMedia: IUploadedMedia = {
          url: '',
          type: isVideo ? 'video' : 'image',
          progress: 0,
          file,
        }
        setMedias((prev) => [...prev, tempMedia])

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

        setMedias((prev) =>
          prev.map((m, idx) =>
            idx === mediaIndex
              ? { ...m, url: key as string, progress: undefined }
              : m,
          ),
        )
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error(t('media.uploadFailed' as any))
      }
    } finally {
      setIsUploading(false)
    }
  }, [medias.length])

  /** 处理移除媒体 */
  const handleMediaRemove = useCallback((index: number) => {
    setMedias((prev) => prev.filter((_, i) => i !== index))
  }, [])

  /** 处理发送消息（继续对话） */
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage: IDisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      medias: medias.filter((m) => m.url && !m.progress),
      status: 'done',
      createdAt: Date.now(),
    }

    // 添加用户消息
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setMedias([])
    setIsGenerating(true)
    setStreamContent('')

    // 添加 AI 待回复消息
    const assistantMessage: IDisplayMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      status: 'pending',
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      // 调用 SSE 接口继续对话
      const mediaUrls = userMessage.medias?.map((m) => m.url) || []
      
      // 使用 EventSource 连接 SSE
      const sseUrl = `/api/agent/tasks?prompt=${encodeURIComponent(inputValue)}&taskId=${taskId}${mediaUrls.length ? `&medias=${encodeURIComponent(JSON.stringify(mediaUrls))}` : ''}`
      
      const eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      let fullContent = ''

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'text' || data.type === 'content_block_delta') {
            const text = data.text || data.delta?.text || ''
            fullContent += text
            setStreamContent(fullContent)
            
            // 更新消息
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: fullContent, status: 'streaming' }
                  : m,
              ),
            )
          } else if (data.type === 'message_stop' || data.type === 'done') {
            // 完成
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: fullContent, status: 'done' }
                  : m,
              ),
            )
            eventSource.close()
            setIsGenerating(false)
          } else if (data.type === 'error') {
            throw new Error(data.error || 'Generation failed')
          }
        } catch (e) {
          // 非 JSON 数据，可能是纯文本
          fullContent += event.data
          setStreamContent(fullContent)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: fullContent, status: 'streaming' }
                : m,
            ),
          )
        }
      }

      eventSource.onerror = () => {
        if (fullContent) {
          // 如果已经有内容，标记为完成
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: fullContent, status: 'done' }
                : m,
            ),
          )
        } else {
          // 标记为错误
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, status: 'error', errorMessage: 'Connection interrupted' }
                : m,
            ),
          )
        }
        eventSource.close()
        setIsGenerating(false)
      }
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, status: 'error', errorMessage: error.message }
            : m,
        ),
      )
      setIsGenerating(false)
    }
  }, [inputValue, medias, isGenerating, taskId])

  /** 停止生成 */
  const handleStop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsGenerating(false)
  }, [])

  /** 返回 */
  const handleBack = () => {
    router.push(`/${lng}`)
  }

  // 加载骨架屏
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* 顶部导航 */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-32 h-5" />
        </header>

        {/* 消息区域骨架 */}
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'flex-row-reverse' : '')}>
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="w-48 h-16 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>

        {/* 底部输入区域骨架 */}
        <div className="p-4 bg-white border-t border-gray-200">
          <Skeleton className="w-full h-14 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="w-8 h-8"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
            <Image
              src={logo}
              alt="AiToEarn"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-base font-medium text-gray-900 line-clamp-1">
            {task?.title || t('task.newChat' as any)}
          </h1>
        </div>
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1 text-sm text-purple-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('message.thinking' as any)}</span>
          </div>
        )}
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            medias={message.medias}
            status={message.status}
            errorMessage={message.errorMessage}
            createdAt={message.createdAt}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区域 */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onStop={handleStop}
          medias={medias}
          onMediasChange={handleMediasChange}
          onMediaRemove={handleMediaRemove}
          isGenerating={isGenerating}
          isUploading={isUploading}
          placeholder={t('detail.continuePlaceholder' as any)}
          mode="compact"
        />
      </div>
    </div>
  )
}

