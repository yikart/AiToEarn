/**
 * ChatMessage - 聊天消息气泡组件
 * 功能：显示用户消息或AI回复，支持媒体附件、Markdown渲染、多步骤工作流展示
 * 每个步骤都有独立的工作流展示区域，支持自动展开/收起当前活跃步骤
 */

'use client'

import type { Components } from 'react-markdown'
import type { IUploadedMedia } from '../MediaUpload'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import type { IActionCard, IMessageStep, IPublishFlowData, IWorkflowStep } from '@/store/agent'
import { AlertCircle, Loader2, Play } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { useTransClient } from '@/app/i18n/client'
import MediaGallery from '@/components/Chat/ChatMessage/MediaGallery'
import WorkflowSection from '@/components/Chat/ChatMessage/WorkflowComponents'
import MediaPreview from '@/components/common/MediaPreview'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import { ActionCard } from '../ActionCard'
import styles from './ChatMessage.module.scss'
import PluginPublishCard from './PluginPublishCard'
import PublishDetailCard from './PublishDetailCard'

/** 过滤用户消息中的系统追加信息（推广计划等） */
function filterSystemPromoInfo(content: string): string {
  return content.replace(/<<<SYSTEM_PROMO>>>[\s\S]*?<<<END_PROMO>>>/g, '').trim()
}

/** 判断 URL 是否为视频链接 */
function isVideoUrl(url: string): boolean {
  if (!url)
    return false
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.wmv', '.flv', '.ogv']
  const lowerUrl = url.toLowerCase().split('?')[0] // 移除查询参数
  return videoExtensions.some(ext => lowerUrl.endsWith(ext))
}

/** 判断 URL 是否为图片链接 */
function isImageUrl(url: string): boolean {
  if (!url)
    return false
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.bmp',
    '.svg',
    '.ico',
    '.avif',
  ]
  const lowerUrl = url.toLowerCase().split('?')[0] // 移除查询参数
  return imageExtensions.some(ext => lowerUrl.endsWith(ext))
}

/** 根据 URL 获取媒体类型 */
function getMediaTypeFromUrl(url: string): 'video' | 'image' {
  return isVideoUrl(url) ? 'video' : 'image'
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
  /** 发布流程数据列表（用于显示 PublishDetailCard） */
  publishFlows?: IPublishFlowData[]
  /** 是否正在生成（用于最后一条AI消息显示思考状态） */
  isGenerating?: boolean
  /** 自定义类名 */
  className?: string
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

function MessageStepContent({
  step,
  isLast,
  isStreaming,
  onOpenPreview,
}: IMessageStepContentProps & { onOpenPreview?: (url: string) => void }) {
  const hasWorkflow = step.workflowSteps && step.workflowSteps.length > 0
  // 当前步骤是否活跃：是最后一个步骤且消息正在流式输出
  const isActiveStep = isLast && isStreaming
  // 自定义 Markdown 组件 - 处理视频/图片链接渲染为预览模式

  const markdownComponents: Components = useMemo(
    () => ({
      a: ({ href, children }) => {
        // 处理视频链接
        if (href && isVideoUrl(href)) {
          const videoUrl = getOssUrl(href)
          return (
            <span className="block my-3">
              <button
                type="button"
                onClick={() => onOpenPreview?.(href)}
                className="relative w-56 h-40 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
              >
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                />
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Play className="w-6 h-6 text-white/90" />
                </span>
              </button>
            </span>
          )
        }
        // 处理图片链接
        if (href && isImageUrl(href)) {
          const imageUrl = getOssUrl(href)
          return (
            <span className="block my-3">
              <button
                type="button"
                onClick={() => onOpenPreview?.(href)}
                className="relative w-56 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
              >
                <img
                  src={imageUrl}
                  alt={typeof children === 'string' ? children : 'image'}
                  className="w-full h-auto max-h-40 object-contain"
                />
              </button>
            </span>
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
      // 处理 HTML video 标签（AI 返回的 <video src="..." controls></video>）
      video: ({ src }) => {
        if (!src)
          return null
        const videoUrl = getOssUrl(src)
        return (
          <span className="block my-3">
            <button
              type="button"
              onClick={() => onOpenPreview?.(src)}
              className="relative w-56 h-40 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
            >
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
              />
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play className="w-6 h-6 text-white/90" />
              </span>
            </button>
          </span>
        )
      },
      // 处理 Markdown 原生图片语法 ![alt](url)
      img: ({ src, alt }) => {
        if (!src)
          return null

        // 判断是否为视频 URL
        if (isVideoUrl(src)) {
          // 渲染视频（复用 video 组件处理器的逻辑）
          const videoUrl = getOssUrl(src)
          return (
            <span className="block my-3">
              <button
                type="button"
                onClick={() => onOpenPreview?.(src)}
                className="relative w-56 h-40 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
              >
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                />
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Play className="w-6 h-6 text-white/90" />
                </span>
              </button>
            </span>
          )
        }

        // 渲染图片（保持原有逻辑）
        const imageUrl = getOssUrl(src)
        return (
          <span className="block my-3">
            <button
              type="button"
              onClick={() => onOpenPreview?.(src)}
              className="relative w-56 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
            >
              <img
                src={imageUrl}
                alt={alt || 'image'}
                className="w-full h-auto max-h-40 object-contain"
              />
            </button>
          </span>
        )
      },
      p: ({ children }) => {
        const content = String(children)
        // 匹配视频和图片 URL
        const mediaUrlRegex
          = /(https?:\/\/\S+(?:\.mp4|\.webm|\.mov|\.jpg|\.jpeg|\.png|\.gif|\.webp)\S*)/gi
        const matches = content.match(mediaUrlRegex)

        if (matches && matches.length > 0) {
          const parts = content.split(mediaUrlRegex)
          return (
            <span className="block">
              {parts.map((part, index) => {
                if (matches.includes(part)) {
                  const mediaUrl = getOssUrl(part)
                  const isVideo = isVideoUrl(part)
                  return (
                    <span key={index} className="block my-3">
                      <button
                        type="button"
                        onClick={() => onOpenPreview?.(part)}
                        className={cn(
                          'relative rounded-lg overflow-hidden border border-border bg-muted cursor-pointer',
                          isVideo ? 'w-56 h-40' : 'w-56',
                        )}
                      >
                        {isVideo ? (
                          <>
                            <video
                              src={mediaUrl}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              muted
                            />
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Play className="w-6 h-6 text-white/90" />
                            </span>
                          </>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt="media"
                            className="w-full h-auto max-h-40 object-contain"
                          />
                        )}
                      </button>
                    </span>
                  )
                }
                return part ? (
                  <span key={index} className="block mb-2 last:mb-0">
                    {part}
                  </span>
                ) : null
              })}
            </span>
          )
        }

        return <p className="mb-2 last:mb-0">{children}</p>
      },
    }),
    [onOpenPreview],
  )

  return (
    <div
      className={cn(
        styles.messageStep,
        // 非最后一个步骤时，在底部添加分隔线
        !isLast && 'border-b border-border/60 pb-3 mb-3',
      )}
    >
      {/* 步骤文本内容 */}
      {step.content && (
        <div className={cn('text-sm leading-relaxed text-foreground', styles.markdownContent)}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {step.content}
          </ReactMarkdown>
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
        <WorkflowSection workflowSteps={step.workflowSteps!} isActive={isActiveStep} />
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
  publishFlows = [],
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
        type: m.type === 'video' ? ('video' as const) : ('image' as const),
        src: getOssUrl(m.url),
        title: m.name || m.file?.name,
      })),
    [previewableMedias],
  )

  const openPreviewWithUrl = useCallback((url: string) => {
    if (!url)
      return
    setExternalPreviewItems([
      {
        type: getMediaTypeFromUrl(url),
        src: getOssUrl(url),
        title: undefined,
      },
    ])
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
    return [
      {
        id: 'single-step',
        content,
        workflowSteps,
        isActive: isStreaming,
        timestamp: Date.now(),
      },
    ]
  }, [steps, content, workflowSteps, isStreaming])

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start', className)}>
      {/* 消息内容 */}
      <div className={cn('flex flex-col gap-2 min-w-0', isUser ? 'items-end' : 'items-start')}>
        {/* 媒体附件（统一使用 MediaGallery） */}
        {medias.length > 0 && (
          <MediaGallery
            medias={medias}
            size={isUser && medias.length === 1 ? 'large' : 'default'}
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
        {!isUser
          && displaySteps.length > 0
          && displaySteps.some(s => s.content?.trim() || s.workflowSteps?.length) && (
          <div className="w-full min-w-0">
            {displaySteps.map((step, index) => (
              <MessageStepContent
                key={step.id}
                step={step}
                isLast={index === displaySteps.length - 1}
                isStreaming={isStreaming}
                onOpenPreview={openPreviewWithUrl}
              />
            ))}

            {/* 发布详情卡片 - 放在消息框内部 */}
            {publishFlows && publishFlows.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                {publishFlows.map(flow => (
                  <PublishDetailCard
                    key={flow.flowId}
                    flowId={flow.flowId}
                    platform={flow.platform}
                    initialData={flow.initialData}
                  />
                ))}
              </div>
            )}

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

        {/* 用户消息：简单渲染（过滤系统追加的隐藏信息） */}
        {isUser && content && (
          <div
            className={cn(
              'px-4 py-3 rounded-2xl text-sm leading-relaxed',
              'bg-muted text-foreground rounded-br-md whitespace-pre-wrap break-words',
            )}
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          >
            {filterSystemPromoInfo(content)}
          </div>
        )}

        {/* 加载状态（无步骤内容时显示默认 loading） */}
        {!isUser && status === 'pending' && displaySteps.every(s => !s.content) && (
          <div className="flex items-center gap-2 rounded-2xl bg-card rounded-bl-md">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        )}

        {/* 流式输出状态（无内容时显示） */}
        {!isUser && status === 'streaming' && displaySteps.every(s => !s.content) && (
          <div className="flex items-center gap-2 rounded-2xl bg-card rounded-bl-md">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
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
            {actions.map((action, index) => {
              // 插件平台（小红书/抖音）使用自动发布倒计时卡片
              const isPluginPublish
                = action.type === 'navigateToPublish'
                  && (action.platform === 'xhs' || action.platform === 'douyin')

              if (isPluginPublish) {
                return (
                  <PluginPublishCard
                    key={`plugin-publish-${index}-${action.platform || ''}`}
                    action={action}
                  />
                )
              }

              return (
                <ActionCard
                  key={`action-${index}-${action.type}-${action.platform || ''}`}
                  action={action}
                />
              )
            })}
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
