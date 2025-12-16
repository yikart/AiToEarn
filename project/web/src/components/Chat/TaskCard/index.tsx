/**
 * TaskCard - 任务卡片组件
 * 功能：显示任务简要信息，支持点击跳转到对话详情
 */

'use client'

import { useRouter } from 'next/navigation'
import { MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react'
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
  onDelete?: (id: string) => void
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

  /** 跳转到对话详情页 */
  const handleClick = () => {
    router.push(`/${lng}/chat/${id}`)
  }

  /** 处理删除 */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(id)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col p-4 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all',
        'hover:border-purple-300 hover:shadow-md hover:shadow-purple-50',
        className,
      )}
    >
      {/* 图标 */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
        <MessageSquare className="w-5 h-5 text-white" />
      </div>

      {/* 标题 */}
      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[40px]">
        {title || 'New Chat'}
      </h4>

      {/* 时间 */}
      <span className="text-xs text-gray-400">
        {formatRelativeTime(new Date(updatedAt || createdAt))}
      </span>

      {/* 更多操作按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-gray-100 text-gray-400 hover:text-gray-600',
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
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

