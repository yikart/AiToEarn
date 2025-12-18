/**
 * TaskCard - 任务卡片组件
 * 功能：显示任务简要信息，支持点击跳转到对话详情
 */

'use client'

import type React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useGetClientLng } from '@/hooks/useSystem'
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
  /** 创建时间 */
  createdAt: string | number
  /** 更新时间 */
  updatedAt?: string | number
  /** 删除回调 */
  onDelete?: (id: string) => void | Promise<void>
  /** 自定义类名 */
  className?: string
}

/**
 * TaskCard - 任务卡片组件
 */
export function TaskCard({
  id,
  title,
  createdAt,
  updatedAt,
  onDelete,
  className,
}: ITaskCardProps) {
  const router = useRouter()
  const lng = useGetClientLng()
  const [isDeleting, setIsDeleting] = useState(false)

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

      {/* 时间 */}
      <span className="text-xs text-muted-foreground">
        {formatRelativeTime(new Date(updatedAt || createdAt))}
      </span>

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

