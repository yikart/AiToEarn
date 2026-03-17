/**
 * TaskCard - 任务卡片组件
 * 功能：显示任务简要信息，支持点击跳转到对话详情
 */

'use client'

import type React from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Loader2,
  MessageSquare,
  Share2,
  Star,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatRelativeTime } from '@/lib/utils'

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
  /** 任务评分（1-5） */
  rating?: number | null
  /** 是否已收藏 */
  isFavorited?: boolean
  /** 收藏加载中 */
  isFavoriteLoading?: boolean
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
  /** 分享回调（由父组件触发 ShareModal） */
  onShare?: (id: string) => void
  /** 收藏切换回调 */
  onFavoriteToggle?: (id: string, isFavorited: boolean) => void | Promise<void>
}

/** 获取状态显示配置 */
function getStatusConfig(status: string | undefined, t: (key: string) => string) {
  const normalizedStatus = status?.toLowerCase()

  switch (normalizedStatus) {
    case 'requires_action':
      return {
        label: t('task.status.requiresAction') || 'Requires Action',
        className:
          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        icon: AlertCircle,
      }
    case 'completed':
      return {
        label: t('task.status.completed') || 'Completed',
        className:
          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
        icon: CheckCircle2,
      }
    case 'running':
      return {
        label: t('task.status.running') || 'Running',
        className:
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        icon: Loader2,
      }
    case 'error':
    case 'failed':
      return {
        label: t('task.status.failed') || 'Failed',
        className:
          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
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
  rating,
  isFavorited = false,
  isFavoriteLoading = false,
  onDelete,
  className,
  onSelect,
  onRateClick,
  onShare,
  onFavoriteToggle,
}: ITaskCardProps) {
  const router = useRouter()
  const { t } = useTransClient('chat')
  const [isDeleting, setIsDeleting] = useState(false)

  const statusConfig = getStatusConfig(status, t as (key: string) => string)

  /** 跳转到对话详情页 */
  const handleClick = () => {
    if (isDeleting)
      return
    if (onSelect) {
      onSelect(id)
      return
    }
    router.push(`/chat/${id}`)
  }

  /** 处理删除 */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!onDelete || isDeleting)
      return

    try {
      setIsDeleting(true)
      await onDelete(id)
    }
    finally {
      setIsDeleting(false)
    }
  }

  /** 触发评分回调（由历史列表等外部组件使用） */
  const handleRateClick = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    if (!onRateClick)
      return
    onRateClick(id)
  }

  const handleShareClick = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    if (typeof onShare === 'function')
      onShare(id)
  }

  /** 处理收藏切换 */
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (isFavoriteLoading)
      return
    onFavoriteToggle?.(id, !isFavorited)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex flex-col p-4 rounded-xl border border-border bg-card cursor-pointer transition-all',
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
        <h4 title={title} className="text-sm font-medium text-foreground truncate flex-1 pt-1">
          {title || 'New Chat'}
        </h4>
      </div>

      {/* 时间 & 状态 */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(updatedAt || createdAt))}
        </span>
        {status && statusConfig.label && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-1.5 sm:px-2 py-0.5 text-[11px] font-medium shrink-0',
              statusConfig.className,
            )}
            title={statusConfig.label}
          >
            {statusConfig.icon && (
              <statusConfig.icon
                className={cn('w-3 h-3', status?.toLowerCase() === 'running' && 'animate-spin')}
              />
            )}
            {/* 移动端只显示图标，桌面端显示文字 */}
            <span className="hidden sm:inline">{statusConfig.label}</span>
          </span>
        )}
      </div>

      {/* Action buttons: 收藏 + 评分 + 分享 + 删除 - 只显示图标 + Tooltip */}
      <TooltipProvider delayDuration={300}>
        <div className="mt-3 flex items-center justify-end gap-1">
          {/* 收藏按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleFavoriteToggle}
                disabled={isFavoriteLoading}
                className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                aria-label={isFavorited ? t('task.unfavorite') : t('task.favorite')}
              >
                {isFavoriteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isFavorited && 'text-red-500 fill-red-500',
                    )}
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isFavorited ? t('task.unfavorite') : t('task.favorite')}
            </TooltipContent>
          </Tooltip>

          {/* 评分按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRateClick}
                className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                aria-label={t('task.rate')}
              >
                <Star
                  className={cn(
                    'w-4 h-4 transition-colors',
                    rating && 'text-amber-400 fill-amber-400',
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('task.rate')}</TooltipContent>
          </Tooltip>

          {/* 分享按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleShareClick}
                className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                aria-label={t('task.share')}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('task.share')}</TooltipContent>
          </Tooltip>

          {/* 删除按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                aria-label={t('task.delete')}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('task.delete')}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}

export default TaskCard
