/**
 * TaskCard - 任务卡片组件
 * 功能：显示任务简要信息，支持点击跳转到对话详情
 */

'use client'

import type React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquare, Trash2, AlertCircle, CheckCircle2, Link2 } from 'lucide-react'
import { agentApi } from '@/api/agent'
import { toast } from '@/lib/toast'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useGetClientLng } from '@/hooks/useSystem'
import { useTransClient } from '@/app/i18n/client'
import { Modal } from '@/components/ui/modal'

export interface ITaskCardProps {
  /** 任务ID */
  id: string
  /** 任务标题 */
  title: string
  /** 任务状态（英文原始状态字符串） */
  status?: string
  /** 创建时间 */
  createdAt: string | number
  /** 更新时间 */
  updatedAt?: string | number
  /** 删除回调 */
  onDelete?: (id: string) => void | Promise<void>
  /** 评分回调（用于历史列表触发外部评分弹窗） */
  onRateClick?: (taskId: string) => void
  /** 选择回调（如果提供，点击卡片将触发选择而不是跳转） */
  onSelect?: (id: string) => void
  /** 在主页展示内联评分控件 */
  showInlineRating?: boolean
  /** 自定义类名 */
  className?: string
}

/** 获取状态显示配置 */
function getStatusConfig(status: string | undefined, t: (key: string) => string) {
  const normalizedStatus = status?.toLowerCase()
  
  switch (normalizedStatus) {
    case 'requires_action':
      return {
        label: t('task.status.requiresAction') || 'Requires Action',
        className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        icon: AlertCircle,
      }
    case 'completed':
      return {
        label: t('task.status.completed') || 'Completed',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
        icon: CheckCircle2,
      }
    case 'running':
      return {
        label: t('task.status.running') || 'Running',
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        icon: Loader2,
      }
    case 'error':
    case 'failed':
      return {
        label: t('task.status.failed') || 'Failed',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        icon: AlertCircle,
      }
    default:
      return {
        label: status || '',
        className: 'bg-muted text-muted-foreground border-border',
        icon: null,
      }
  }
}

/**
 * TaskCard - 任务卡片组件
 */
export function TaskCard({
  id,
  title,
  status,
  createdAt,
  updatedAt,
  onDelete,
  className,
  onSelect,
  onRateClick,
  showInlineRating = false,
}: ITaskCardProps) {
  const router = useRouter()
  const lng = useGetClientLng()
  const { t } = useTransClient('chat')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [inlineRating, setInlineRating] = useState<number>(0)
  const [ratingComment, setRatingComment] = useState<string>('')
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false)
  
  const statusConfig = getStatusConfig(status, t as (key: string) => string)

  /** 跳转到对话详情页 */
  const handleClick = () => {
    if (isDeleting) return
    if (onSelect) {
      onSelect(id)
      return
    }
    router.push(`/${lng}/chat/${id}`)
  }

  /** 处理删除 */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete || isDeleting) return

    try {
      setIsDeleting(true)
      await onDelete(id)
    } finally {
      setIsDeleting(false)
    }
  }

  /** 处理转发（复制会话为新任务并跳转） */
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isProcessing) return
    try {
      setIsProcessing(true)
      // 创建一个新的任务（复用会话），获取新 id
      const res = await agentApi.createTask({ prompt: [], taskId: id })
      if (res && (res as any).code === 0 && (res as any).data) {
        const newTaskId = (res as any).data.id
        const url = `${window.location.origin}/${lng}/chat/${newTaskId}`
        try {
          await navigator.clipboard.writeText(url)
          toast.success(t('task.copyLinkSuccess' as any) || 'Link copied')
        } catch {
          // ignore clipboard error, still navigate
        }
        router.push(`/${lng}/chat/${newTaskId}`)
      } else {
        toast.error((res as any)?.msg || t('task.forwardFailed' as any) || 'Share failed')
      }
    } catch (error) {
      console.error('Share failed', error)
      toast.error(t('task.forwardFailed' as any) || 'Share failed')
    } finally {
      setIsProcessing(false)
    }
  }

  /** 提交评分（内联） */
  const submitInlineRating = async () => {
    if (inlineRating < 1 || inlineRating > 5) {
      toast.error(t('task.ratingInvalid' as any) || 'Invalid rating')
      return
    }
    try {
      setIsRatingSubmitting(true)
      const res = await agentApi.createRating(id, inlineRating, ratingComment)
      if (res && (res as any).code === 0) {
        toast.success(t('task.ratingSuccess' as any) || 'Rating submitted')
        setRatingModalOpen(false)
      } else {
        toast.error((res as any)?.msg || (t('task.ratingFailed' as any) || 'Submit failed'))
      }
    } catch (error) {
      console.error('Submit rating failed', error)
      toast.error(t('task.ratingFailed' as any) || 'Submit failed')
    } finally {
      setIsRatingSubmitting(false)
    }
  }

  /** 触发评分回调（由历史列表等外部组件使用） */
  const handleRateClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onRateClick) return
    onRateClick(id)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col p-4 rounded-xl border border-border bg-card cursor-pointer transition-all',
        'hover:border-border hover:shadow-md',
        isDeleting && 'opacity-60 cursor-wait',
        className,
      )}
    >
      {/* 图标 + 标题 */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </div>
        <h4 className="text-sm font-medium text-foreground line-clamp-2 flex-1 pt-1">
          {title || 'New Chat'}
        </h4>
      </div>

      {/* 时间 & 状态 */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(updatedAt || createdAt))}
        </span>
        {status && statusConfig.label && (
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
            statusConfig.className,
          )}>
            {statusConfig.icon && (
              <statusConfig.icon className={cn(
                'w-3 h-3',
                status?.toLowerCase() === 'running' && 'animate-spin',
              )} />
            )}
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* Action buttons: Share (forward+copy) and Delete */}
      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleShare}
          disabled={isDeleting || isProcessing}
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label="share"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted text-destructive hover:text-destructive/90"
          aria-label="delete"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Inline rating UI for homepage usage */}
      {showInlineRating && (
        <>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, idx) => {
                const v = idx + 1
                return (
                  <button
                    key={v}
                    onClick={(e) => {
                      e.stopPropagation()
                      setInlineRating(v)
                      setRatingModalOpen(true)
                    }}
                    className={cn(
                      'w-7 h-7 rounded-md border flex items-center justify-center',
                      inlineRating >= v ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-transparent'
                    )}
                    aria-label={`rate-${v}`}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
          </div>

          <Modal
            open={ratingModalOpen}
            title={t('task.externalRating' as any) || 'Rate selected task'}
            onCancel={() => setRatingModalOpen(false)}
            onOk={submitInlineRating}
            okText={isRatingSubmitting ? t('task.submitting' as any) || 'Submitting' : t('task.submit' as any) || 'Submit'}
            confirmLoading={isRatingSubmitting}
          >
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">Task: {id}</div>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder={t('task.ratingCommentPlaceholder' as any) || 'Optional comment'}
                className="w-full p-2 border rounded-md resize-none h-24"
              />
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}

export default TaskCard

