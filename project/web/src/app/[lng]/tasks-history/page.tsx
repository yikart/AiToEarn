/**
 * 任务记录页 - Tasks History
 * 功能：显示所有任务记录，支持分页加载和删除
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, History, RefreshCw } from 'lucide-react'
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
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // 每页 16 条
  const pageSize = 16

  const totalPages = Math.max(1, Math.ceil(total / pageSize || 1))

  /** 加载任务列表（分页） */
  const loadTasks = useCallback(
    async (pageNum: number) => {
      setIsLoading(true)
      try {
        const result = await agentApi.getTaskList(pageNum, pageSize)
        if (result && result.code === 0 && result.data) {
          const newTasks = result.data.list || []
          setTasks(newTasks)
          setTotal(result.data.total || 0)
          setPage(pageNum)
        }
      } catch (error) {
        console.error('Load task list failed:', error)
        toast.error(t('message.error' as any))
      } finally {
        setIsLoading(false)
      }
    },
    [pageSize, t]
  )

  /** 初始加载 */
  useEffect(() => {
    loadTasks(1)
  }, [loadTasks])

  /** 刷新列表，回到第一页 */
  const handleRefresh = () => {
    loadTasks(1)
  }

  /** 分页切换 */
  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    loadTasks(nextPage)
  }

  /** 处理删除任务：删除后刷新当前页 */
  const handleDelete = async (id: string) => {
    try {
      const result = await agentApi.deleteTask(id)
      if (result && result.code === 0) {
        toast.success(t('task.deleteSuccess' as any))
        // 删除成功后，重新加载当前页，避免页码错乱
        loadTasks(page)
      } else {
        toast.error(result?.message || t('task.deleteFailed' as any))
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
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
            <History className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">
              {t('history.title' as any)}
            </h1>
          </div>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">({total})</span>
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

      {/* 任务列表，整体垂直 & 水平居中 */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-6xl">
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
              <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">{t('history.empty' as any)}</p>
              <Button onClick={handleBack}>
                {t('home.startChat' as any)}
              </Button>
            </div>
          ) : (
            // 任务卡片网格 + 分页器
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tasks.map((task) => (
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

              {/* 分页器 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isLoading}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      {t('history.prevPage' as any) || 'Prev'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || isLoading}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {t('history.nextPage' as any) || 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
