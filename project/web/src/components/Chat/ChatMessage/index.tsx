/**
 * ChatMessage - 聊天消息气泡组件
 * 功能：显示用户消息或AI回复，支持媒体附件、Markdown渲染、多步骤工作流展示
 * 每个步骤都有独立的工作流展示区域，支持自动展开/收起当前活跃步骤
 */

'use client'

import type { Components } from 'react-markdown'
import type { IUploadedMedia } from '../MediaUpload'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import type { IActionCard, IMessageStep, IWorkflowStep } from '@/store/agent'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, FileText, Loader2, Play, User, Wrench } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTransClient } from '@/app/i18n/client'
import logo from '@/assets/images/logo.png'
import MediaGallery from '@/components/Chat/ChatMessage/MediaGallery'
import WorkflowSection from '@/components/Chat/ChatMessage/WorkflowComponents'
import MediaPreview from '@/components/common/MediaPreview'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import { ActionCard } from '../ActionCard'
import styles from './ChatMessage.module.scss'

/** 判断 URL 是否为视频链接 */
function isVideoUrl(url: string): boolean {
  if (!url)
    return false
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv']
  const lowerUrl = url.toLowerCase()
  return videoExtensions.some(ext => lowerUrl.includes(ext))
    || lowerUrl.includes('video')
    || (lowerUrl.includes('s3') && lowerUrl.includes('.mp4'))
}

export type { IWorkflowStep }

export interface IChatMessageProps {
  /** 消息角色 */
  role: 'user' | 'assistant'
  /** 消息内容 */
  content: string
  /** 媒体附件 */
  medias?: IUploadedMedia[]
  /** 消息状态 */
  status?: 'pending' | 'streaming' | 'done' | 'error'
  /** 错误信息 */
  errorMessage?: string
  /** 创建时间 */
  createdAt?: number
  /** 消息步骤列表（仅 assistant 消息使用） */
  steps?: IMessageStep[]
  /** 工作流步骤列表（兼容旧接口，用于无steps时的显示） */
  workflowSteps?: IWorkflowStep[]
  /** Action 卡片列表（用于显示可交互的 action） */
  actions?: IActionCard[]
  /** 是否正在生成（用于最后一条AI消息显示思考状态） */
  isGenerating?: boolean
  /** 自定义类名 */
  className?: string
}

/** 格式化工具名称（移除 mcp__ 前缀） */
function formatToolName(name: string) {
  return name.replace(/^mcp__\w+__/, '')
}

// Workflow 子组件已拆分到 `WorkflowComponents`，这里直接使用导出的组件

/**
 * MessageStepContent - 单个消息步骤的内容
 * 每个步骤都有自己的工作流展示区域
 */
interface IMessageStepContentProps {
  /** 步骤数据 */
  step: IMessageStep
  /** 是否为最后一个步骤 */
  isLast: boolean
  /** 消息是否正在流式输出 */
  isStreaming: boolean
}

function MessageStepContent({ step, isLast, isStreaming, onOpenPreview }: IMessageStepContentProps & { onOpenPreview?: (url: string) => void }) {
  const hasWorkflow = step.workflowSteps && step.workflowSteps.length > 0
  // 当前步骤是否活跃：是最后一个步骤且消息正在流式输出
  const isActiveStep = isLast && isStreaming
  // 自定义 Markdown 组件 - 处理视频链接渲染为“首帧封面 + 点击打开预览”
  const markdownComponents: Components = useMemo(() => ({
    a: ({ href, children }) => {
      if (href && isVideoUrl(href)) {
        const videoUrl = getOssUrl(href)
        return (
          <div className="my-3">
            <button
              type="button"
              onClick={() => onOpenPreview?.(href)}
              className="relative w-full rounded-lg overflow-hidden border border-border bg-muted"
            >
              <video
                src={videoUrl}
                className="w-full h-60 object-cover"
                preload="metadata"
                muted
              />
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play className="w-8 h-8 text-white/90" />
              </span>
            </button>
          </div>
        )
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {children}
        </a>
      )
    },
    p: ({ children }) => {
      const content = String(children)
      const urlRegex = /(https?:\/\/\S+(?:\.mp4|\.webm|\.mov)\S*)/gi
      const matches = content.match(urlRegex)

      if (matches && matches.length > 0) {
        const parts = content.split(urlRegex)
        return (
          <div>
            {parts.map((part, index) => {
              if (matches.includes(part)) {
                const videoUrl = getOssUrl(part)
                return (
                  <div key={index} className="my-3">
                    <button
                      type="button"
                      onClick={() => onOpenPreview?.(part)}
                      className="relative w-full rounded-lg overflow-hidden border border-border bg-muted"
                    >
                      <video
                        src={videoUrl}
                        className="w-full h-60 object-cover"
                        preload="metadata"
                        muted
                      />
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Play className="w-8 h-8 text-white/90" />
                      </span>
                    </button>
                  </div>
                )
              }
              return part ? <p key={index} className="mb-2 last:mb-0">{part}</p> : null
            })}
          </div>
        )
      }

      return <p className="mb-2 last:mb-0">{children}</p>
    },
  }), [onOpenPreview])

  return (
    <div className={cn(
      styles.messageStep,
      // 非最后一个步骤时，在底部添加分隔线
      !isLast && 'border-b border-border/60 pb-3 mb-3',
    )}
    >
      {/* 步骤文本内容 */}
      {step.content && (
        <div className={cn(
          'text-sm leading-relaxed text-foreground',
          styles.markdownContent,
        )}
        >
          <ReactMarkdown components={markdownComponents}>{step.content}</ReactMarkdown>
        </div>
      )}

      {/* 如果该步骤包含媒体（image/video），在步骤内容下方渲染 MediaGallery */}
      {step.medias && step.medias.length > 0 && (
        <div className="mt-3">
          <MediaGallery
            medias={step.medias as any}
            onPreviewByUrl={url => onOpenPreview?.(url)}
          />
        </div>
      )}

      {/* 该步骤的工作流展示 */}
      {hasWorkflow && (
        <WorkflowSection
          workflowSteps={step.workflowSteps!}
          isActive={isActiveStep}
        />
      )}
    </div>
  )
}

/**
 * ChatMessage - 聊天消息气泡组件
 */
export function ChatMessage({
  role,
  content,
  medias = [],
  status = 'done',
  errorMessage,
  steps = [],
  workflowSteps = [],
  actions = [],
  isGenerating = false,
  className,
}: IChatMessageProps) {
  const { t } = useTransClient('chat')
  const isUser = role === 'user'
  const isStreaming = status === 'streaming' || status === 'pending'

  // 媒体预览状态（统一使用全局 MediaPreview 组件）
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  // 来自文本/链接的外部预览（例如 Markdown 中的视频链接）——优先级高于附件数组预览
  const [externalPreviewItems, setExternalPreviewItems] = useState<MediaPreviewItem[] | null>(null)

  const previewableMedias = useMemo(
    () => medias.filter(m => m.type === 'image' || m.type === 'video'),
    [medias],
  )

  const previewItems = useMemo(
    () =>
      previewableMedias.map(m => ({
        type: m.type === 'video' ? 'video' as const : 'image' as const,
        src: getOssUrl(m.url),
        title: m.name || m.file?.name,
      })),
    [previewableMedias],
  )

  const openPreviewWithUrl = useCallback((url: string) => {
    if (!url)
      return
    setExternalPreviewItems([{
      type: 'video',
      src: getOssUrl(url),
      title: undefined,
    }])
  }, [])

  // 处理消息步骤：如果有 steps 则使用 steps，否则从 content 生成单个步骤
  const displaySteps = useMemo(() => {
    if (steps && steps.length > 0) {
      return steps
    }
    // 没有 steps 时，尝试从 content 解析多个段落作为步骤
    // 使用双换行分割内容为多个步骤
    if (content) {
      const paragraphs = content.split(/\n{2,}/).filter(p => p.trim())
      if (paragraphs.length > 1) {
        return paragraphs.map((p, i) => ({
          id: `legacy-step-${i}`,
          content: p.trim(),
          workflowSteps: i === paragraphs.length - 1 ? workflowSteps : [],
          isActive: i === paragraphs.length - 1 && isStreaming,
          timestamp: Date.now(),
        }))
      }
    }
    // 单个步骤
    return [{
      id: 'single-step',
      content,
      workflowSteps,
      isActive: isStreaming,
      timestamp: Date.now(),
    }]
  }, [steps, content, workflowSteps, isStreaming])

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden',
          isUser && 'bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40',
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Image
            src={logo}
            alt="AiToEarn"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 消息内容 */}
      <div className={cn('flex flex-col gap-2 max-w-[80%] min-w-0', isUser ? 'items-end' : 'items-start')}>
        {/* 媒体附件（统一使用 MediaGallery） */}
        {medias.length > 0 && (
          <MediaGallery
            medias={medias}
            onPreviewByIndex={(originalIndex) => {
              // 将原始 medias 索引映射到 previewableMedias 的索引
              const target = medias[originalIndex]
              const mapped = previewableMedias.findIndex(m => m === target)
              if (mapped >= 0)
                setPreviewIndex(mapped)
            }}
            onPreviewByUrl={(url) => {
              openPreviewWithUrl(url)
            }}
          />
        )}

        {/* AI 消息：多步骤渲染 - 只有有实际内容或工作流时才显示 */}
        {!isUser && displaySteps.length > 0 && displaySteps.some(s => s.content?.trim() || s.workflowSteps?.length) && (
          <div className="w-full bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 min-w-0">
            {displaySteps.map((step, index) => (
              <MessageStepContent
                key={step.id}
                step={step}
                isLast={index === displaySteps.length - 1}
                isStreaming={isStreaming}
                onOpenPreview={openPreviewWithUrl}
              />
            ))}

            {/* 思考中状态 - 在最后一条AI消息底部显示 */}
            {isGenerating && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3 px-1">
                  {/* 优雅的波点动画 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      style={{
                        animation: 'bounceDots 1.4s ease-in-out infinite both',
                        animationDelay: '0s',
                      }}
                    >
                    </div>
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-purple-500"
                      style={{
                        animation: 'bounceDots 1.4s ease-in-out infinite both',
                        animationDelay: '0.2s',
                      }}
                    >
                    </div>
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-pink-500"
                      style={{
                        animation: 'bounceDots 1.4s ease-in-out infinite both',
                        animationDelay: '0.4s',
                      }}
                    >
                    </div>
                  </div>

                  {/* 思考文字 */}
                  <span
                    className="text-sm font-medium bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                    style={{
                      animation: 'thinkingGlow 1.8s ease-in-out infinite',
                      display: 'inline-block',
                    }}
                  >
                    {t('message.thinking')}
                  </span>
                </div>
                <style>
                  {`
                  @keyframes thinkingGlow {
                    0%, 100% {
                      opacity: 0.7;
                      filter: hue-rotate(0deg) brightness(1);
                    }
                    50% {
                      opacity: 1;
                      filter: hue-rotate(180deg) brightness(1.2);
                    }
                  }
                  @keyframes bounceDots {
                    0%, 80%, 100% {
                      transform: scale(0.8);
                      opacity: 0.5;
                    }
                    40% {
                      transform: scale(1.2);
                      opacity: 1;
                    }
                  }
                `}
                </style>
              </div>
            )}
          </div>
        )}

        {/* 用户消息：简单渲染 */}
        {isUser && content && (
          <div
            className={cn(
              'px-4 py-3 rounded-2xl text-sm leading-relaxed',
              'bg-card border border-border text-foreground rounded-br-md whitespace-pre-wrap break-words',
            )}
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          >
            {content}
          </div>
        )}

        {/* 加载状态（无步骤内容时显示默认 loading） */}
        {!isUser && status === 'pending' && displaySteps.every(s => !s.content) && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card border border-border rounded-bl-md">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        )}

        {/* 流式输出状态（无内容时显示） */}
        {!isUser && status === 'streaming' && displaySteps.every(s => !s.content) && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card border border-border rounded-bl-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {status === 'error' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-destructive/10 text-destructive rounded-bl-md">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errorMessage || 'Generation failed, please retry'}</span>
          </div>
        )}

        {/* Action 卡片 */}
        {!isUser && actions && actions.length > 0 && (
          <div className="w-full space-y-3 mt-2">
            {actions.map((action, index) => (
              <ActionCard
                key={`action-${index}-${action.type}-${action.platform || ''}`}
                action={action}
              />
            ))}
          </div>
        )}
      </div>

      {/* 全局媒体预览（图片 / 视频） */}
      {(previewItems.length > 0 || externalPreviewItems) && (
        <MediaPreview
          open={previewIndex !== null || externalPreviewItems !== null}
          items={externalPreviewItems ?? previewItems}
          initialIndex={externalPreviewItems ? 0 : (previewIndex ?? 0)}
          onClose={() => {
            setPreviewIndex(null)
            setExternalPreviewItems(null)
          }}
        />
      )}
    </div>
  )
}

export default ChatMessage
