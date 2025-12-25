/**
 * TaskPreview - 任务预览组件
 * 功能：显示最近的任务卡片列表，支持"浏览全部"跳转
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowRight, History } from 'lucide-react'
import { TaskCard, TaskCardSkeleton } from '@/components/Chat'
import { agentApi, type TaskListItem } from '@/api/agent'
import { useTransClient } from '@/app/i18n/client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export interface ITaskPreviewProps {
  /** 显示数量 */
  limit?: number
  /** 自定义类名 */
  className?: string
}

/**
 * TaskPreview - 任务预览组件
 */
export function TaskPreview({ limit = 4, className }: ITaskPreviewProps) {
  const { t } = useTransClient('chat')
  const router = useRouter()
  const { lng } = useParams()

  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /** 加载任务列表（始终保证尽量填满 limit 条） */
  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await agentApi.getTaskList(1, limit)
      if (result && result.code === 0 && result.data) {
        setTasks(result.data.list || [])
      }
    } catch (error) {
      console.error('Load task list failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  /** 处理删除任务 */
  const handleDelete = async (id: string) => {
    try {
      const result = await agentApi.deleteTask(id)
      if (result && result.code === 0) {
        // 先本地移除，提升交互速度
        setTasks((prev) => prev.filter((task) => task.id !== id))
        // 再重新拉取列表，确保数量重新补足到 limit（如果后端还有数据）
        void loadTasks()
        toast.success(t('task.deleteSuccess' as any))
      } else {
        const msg = (result as any)?.msg as string | undefined
        toast.error(msg || t('task.deleteFailed' as any))
      }
    } catch (error) {
      toast.error(t('task.deleteFailed' as any))
    }
  }

  /** 跳转到任务记录页 */
  const handleViewAll = () => {
    router.push(`/${lng}/tasks-history`)
  }


  // 如果没有任务且非加载中，不显示该区域
  if (!isLoading && tasks.length === 0) {
    return null
  }

  return (
    <section className={className}>
      <div className="w-full max-w-5xl mx-auto">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">
            {t('home.recentTasks' as any)}
          </h3>
        </div>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {t('home.viewAll' as any)}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 任务卡片列表 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: limit }).map((_, index) => (
              <TaskCardSkeleton key={index} />
            ))
          : tasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title || t('task.newChat' as any)}
                status={task.status}
                createdAt={task.createdAt}
                updatedAt={task.updatedAt}
                onDelete={handleDelete}
              />
            ))}
      </div>
      </div>
    </section>
  )
}

export default TaskPreview

