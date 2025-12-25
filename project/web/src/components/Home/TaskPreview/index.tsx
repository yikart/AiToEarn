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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [ratingValue, setRatingValue] = useState<number>(0)
  const [ratingComment, setRatingComment] = useState<string>('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)

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

  /** 处理评分提交（放到列表外部） */
  const handleSubmitRating = async () => {
    if (!selectedTaskId) {
      toast.error(t('task.selectTaskFirst' as any) || 'Please select a task first')
      return
    }
    if (ratingValue < 1 || ratingValue > 5) {
      toast.error(t('task.ratingInvalid' as any) || 'Invalid rating')
      return
    }

    try {
      setIsSubmittingRating(true)
      const res = await agentApi.createRating(selectedTaskId, ratingValue, ratingComment)
      if (res && (res as any).code === 0) {
        toast.success(t('task.ratingSuccess' as any) || 'Rating submitted')
        // clear local state
        setRatingValue(0)
        setRatingComment('')
        // reload tasks to reflect any change
        void loadTasks()
      } else {
        toast.error((res as any)?.msg || (t('task.ratingFailed' as any) || 'Submit failed'))
      }
    } catch (error) {
      console.error('Submit rating failed', error)
      toast.error(t('task.ratingFailed' as any) || 'Submit failed')
    } finally {
      setIsSubmittingRating(false)
    }
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
                onSelect={(id: string) => {
                  setSelectedTaskId(id)
                }}
              />
            ))}
      </div>
      {/* 外部评分区域（红框示意位置） */}
      <div className="w-full max-w-5xl mx-auto mt-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-foreground">
              {t('task.externalRating' as any) || 'Rate selected task'}
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedTaskId ? `Task: ${selectedTaskId}` : t('task.noTaskSelected' as any) || 'No task selected'}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => {
                const v = idx + 1
                return (
                  <button
                    key={v}
                    onClick={() => setRatingValue(v)}
                    className={cn(
                      'w-8 h-8 rounded-md border flex items-center justify-center',
                      ratingValue >= v ? 'bg-amber-100 border-amber-300' : 'bg-transparent'
                    )}
                    aria-label={`rate-${v}`}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder={t('task.ratingCommentPlaceholder' as any) || 'Optional comment'}
              className="flex-1 p-2 border rounded-md resize-none h-12"
            />
            <div className="flex items-center">
              <button
                onClick={handleSubmitRating}
                disabled={isSubmittingRating || !selectedTaskId}
                className="px-3 py-1 rounded-md bg-primary text-white disabled:opacity-50"
              >
                {isSubmittingRating ? t('task.submitting' as any) || 'Submitting' : t('task.submit' as any) || 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}

export default TaskPreview

