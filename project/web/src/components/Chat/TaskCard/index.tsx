/**
 * TaskCard - 任务卡片组件
 * 功能：显示任务简要信息，支持点击跳转到对话详情
 */

'use client'

import type React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquare, MoreHorizontal, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { agentApi } from '@/api/agent'
import { toast } from '@/lib/toast'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useGetClientLng } from '@/hooks/useSystem'
import { useTransClient } from '@/app/i18n/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
}: ITaskCardProps) {
  const router = useRouter()
  const lng = useGetClientLng()
  const { t } = useTransClient('chat')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
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
  const handleForward = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isProcessing) return
    try {
      setIsProcessing(true)
      // 创建一个新的任务，传入 taskId 以复用会话（后端会在可用时复用 session）
      const res = await agentApi.createTask({ prompt: [], taskId: id })
      if (res && (res as any).code === 0 && (res as any).data) {
        const newTaskId = (res as any).data.id
        router.push(`/${lng}/chat/${newTaskId}`)
      } else {
        toast.error((res as any)?.msg || t('task.forwardFailed' as any) || 'Forward failed')
      }
    } catch (error) {
      console.error('Forward failed', error)
      toast.error(t('task.forwardFailed' as any) || 'Forward failed')
    } finally {
      setIsProcessing(false)
    }
  }

  /** 复制任务链接到剪贴板 */
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const url = `${window.location.origin}/${lng}/chat/${id}`
      await navigator.clipboard.writeText(url)
      toast.success(t('task.copyLinkSuccess' as any) || 'Link copied')
    } catch (error) {
      console.error('Copy link failed', error)
      toast.error(t('task.copyLinkFailed' as any) || 'Copy failed')
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
          <DropdownMenuItem onClick={handleRateClick} className="focus:bg-muted/5">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Rate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleForward} className="focus:bg-muted/5">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
            Forward
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="focus:bg-muted/5">
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default TaskCard

