/**
 * 任务记录页 - Tasks History
 * 功能：显示所有任务记录，支持分页加载和删除
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, History, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { TaskCard, TaskCardSkeleton } from '@/components/Chat'
import { Button } from '@/components/ui/button'
import { agentApi, type TaskListItem } from '@/api/agent'
import { useTransClient } from '@/app/i18n/client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function TasksHistoryPage() {
  const { t } = useTransClient('chat')
  const router = useRouter()
  const { lng } = useParams()

  // 状态
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const pageSize = 12

  /** 加载任务列表 */
  const loadTasks = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const result = await agentApi.getTaskList(pageNum, pageSize)
      if (result.code === 0 && result.data) {
        const newTasks = result.data.list || []
        setTasks((prev) => (append ? [...prev, ...newTasks] : newTasks))
        setTotal(result.data.total || 0)
        setHasMore(newTasks.length === pageSize && tasks.length + newTasks.length < (result.data.total || 0))
      }
    } catch (error) {
      console.error('Load task list failed:', error)
      toast.error(t('message.error' as any))
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [tasks.length])

  /** 初始加载 */
  useEffect(() => {
    loadTasks(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** 加载更多 */
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadTasks(nextPage, true)
    }
  }

  /** 刷新列表 */
  const handleRefresh = () => {
    setPage(1)
    loadTasks(1)
  }

  /** 处理删除任务 */
  const handleDelete = async (id: string) => {
    try {
      const result = await agentApi.deleteTask(id)
      if (result.code === 0) {
        setTasks((prev) => prev.filter((task) => task.id !== id))
        setTotal((prev) => prev - 1)
        toast.success(t('task.deleteSuccess' as any))
      } else {
        toast.error(result.msg || t('task.deleteFailed' as any))
      }
    } catch (error) {
      toast.error(t('task.deleteFailed' as any))
    }
  }

  /** 返回首页 */
  const handleBack = () => {
    router.push(`/${lng}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="w-8 h-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            <h1 className="text-lg font-semibold text-gray-900">
              {t('history.title' as any)}
            </h1>
          </div>
          {total > 0 && (
            <span className="text-sm text-gray-500">({total})</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="w-8 h-8"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </Button>
      </header>

      {/* 任务列表 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          // 加载骨架屏
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: pageSize }).map((_, index) => (
              <TaskCardSkeleton key={index} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          // 空状态
          <div className="flex flex-col items-center justify-center py-16">
            <History className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">{t('history.empty' as any)}</p>
            <Button onClick={handleBack}>
              {t('home.startChat' as any)}
            </Button>
          </div>
        ) : (
          // 任务卡片网格
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title || t('task.newChat' as any)}
                  createdAt={task.createdAt}
                  updatedAt={task.updatedAt}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* 加载更多 */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="min-w-[120px]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('history.loading' as any)}
                    </>
                  ) : (
                    t('history.loadMore' as any)
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

