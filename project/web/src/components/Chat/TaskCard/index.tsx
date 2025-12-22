/**
 * TaskCard - 任务卡片组件
 * 功能：显示任务简要信息，支持点击跳转到对话详情
 */

'use client'

import type React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquare, MoreHorizontal, Trash2, AlertCircle, CheckCircle2, Star } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useGetClientLng } from '@/hooks/useSystem'
import { useTransClient } from '@/app/i18n/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import RatingModal from '@/components/Chat/Rating'

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
  /** 自定义类名 */
  className?: string
  /** 任务评分（1-5） */
  rating?: number | null
  /** 任务评价文本 */
  ratingComment?: string | null
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
  rating: initialRating,
  ratingComment: initialRatingComment,
}: ITaskCardProps) {
  const router = useRouter()
  const lng = useGetClientLng()
  const { t } = useTransClient('chat')
  const [isDeleting, setIsDeleting] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(initialRating ?? null)
  const [ratingComment, setRatingComment] = useState<string | null>(initialRatingComment ?? null)
  
  const statusConfig = getStatusConfig(status, t as (key: string) => string)

  /** 跳转到对话详情页 */
  const handleClick = () => {
    if (isDeleting) return
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

      {/* 时间 & 状态 & 评分 */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(updatedAt || createdAt))}
        </span>
        <div className="flex items-center gap-2">
          {rating ? (
            <span className="inline-flex items-center gap-1 text-sm text-foreground mr-2">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
              </svg>
              <span className="font-medium">{rating}</span>
            </span>
          ) : null}
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
      </div>

      {/* 更多操作按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            disabled={isDeleting}
            className={cn(
              'absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-muted text-muted-foreground hover:text-foreground',
              isDeleting && 'opacity-100 cursor-wait',
            )}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MoreHorizontal className="w-4 h-4" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setRatingOpen(true)
            }}
          >
            <Star className="w-4 h-4 mr-2 text-amber-400" />
            {t('task.rate' as any) || 'Rate'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive focus:bg-destructive/10 mt-2"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Rating Modal */}
      <RatingModal
        taskId={id}
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSaved={(data: { rating?: number | null; comment?: string | null }) => {
          setRating(data.rating ?? null)
          setRatingComment(data.comment ?? null)
        }}
      />
    </div>
  )
}

export default TaskCard

