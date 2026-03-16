/**
 * TaskHistoryList - 可复用的任务卡片列表组件
 * 用于在不同页面展示任务网格，支持 loading skeleton、删除、评分回调和可选链接包裹
 */
'use client'

import type { TaskListItem } from '@/api/agent'
import Link from 'next/link'
import React, { useCallback, useState } from 'react'
import { agentApi } from '@/api/agent'
import { useTransClient } from '@/app/i18n/client'
import { TaskCard, TaskCardSkeleton } from '@/components/Chat'
import RatingModal from '@/components/Chat/Rating'
import ShareModal from '@/components/Share/ShareModal'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export interface ITaskHistoryListProps {
  tasks: TaskListItem[]
  isLoading?: boolean
  skeletonCount?: number
  /** 刷新列表回调，由父组件提供 */
  onRefresh?: () => void | Promise<void>
  className?: string
  /** 可选：为每条记录生成链接的前缀（例如 '/en/chat'），若传入则会用 <a> 包裹 TaskCard */
  linkBasePath?: string
}

export function TaskHistoryList({
  tasks,
  isLoading = false,
  skeletonCount = 4,
  onRefresh,
  className,
  linkBasePath = '/chat',
}: ITaskHistoryListProps) {
  const { t } = useTransClient('chat')
  const [ratingModalFor, setRatingModalFor] = useState<string | null>(null)
  const [shareTaskId, setShareTaskId] = useState<string | null>(null)
  // 本地任务状态（用于乐观更新），初始值使用 props.tasks 避免首次渲染时空页面闪烁
  const [localTasks, setLocalTasks] = useState<TaskListItem[]>(tasks)

  // 同步外部 tasks 到 localTasks
  React.useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const handleRateClick = (taskId: string) => {
    setRatingModalFor(taskId)
  }

  /** 处理删除任务 */
  const handleDelete = async (id: string) => {
    try {
      const result = await agentApi.deleteTask(id)
      if (result && result.code === 0) {
        toast.success(t('task.deleteSuccess' as any))
        // 调用父组件的刷新回调
        if (onRefresh) {
          await onRefresh()
        }
      }
      else {
        toast.error((result as any)?.message || t('task.deleteFailed' as any))
      }
    }
    catch (error) {
      toast.error(t('task.deleteFailed' as any))
    }
  }

  /** 处理评分更新 */
  const handleRatingUpdate = async (
    taskId: string,
    data: { rating?: number | null, comment?: string | null },
  ) => {
    // 这里可以更新本地状态，或者让父组件处理
    // 由于父组件有自己的状态管理，我们通过 onRefresh 来更新
    if (onRefresh) {
      await onRefresh()
    }
    toast.success(t('rating.saveSuccess' as any) || 'Saved')
  }

  /** 处理收藏切换 - 乐观更新 */
  const handleFavoriteToggle = useCallback(
    async (taskId: string, shouldFavorite: boolean) => {
      // 乐观更新：先改本地 tasks 状态
      setLocalTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, favoritedAt: shouldFavorite ? new Date().toISOString() : null }
            : t,
        ),
      )

      try {
        const result = shouldFavorite
          ? await agentApi.favoriteTask(taskId)
          : await agentApi.unfavoriteTask(taskId)

        if (!result || result.code !== 0) {
          // 失败回滚
          setLocalTasks(prev =>
            prev.map(t =>
              t.id === taskId
                ? { ...t, favoritedAt: shouldFavorite ? null : new Date().toISOString() }
                : t,
            ),
          )
          toast.error((result as any)?.message || t('message.error'))
        }
      }
      catch {
        // 失败回滚
        setLocalTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? { ...t, favoritedAt: shouldFavorite ? null : new Date().toISOString() }
              : t,
          ),
        )
        toast.error(t('message.error'))
      }
    },
    [t],
  )

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => <TaskCardSkeleton key={index} />)
        : localTasks.map((task) => {
            const card = (
              <TaskCard
                key={task.id}
                id={String(task.id)}
                title={task.title ?? ''}
                status={task.status}
                createdAt={task.createdAt}
                updatedAt={task.updatedAt}
                rating={task.rating}
                isFavorited={!!task.favoritedAt}
                onDelete={() => handleDelete(String(task.id))}
                onRateClick={() => handleRateClick(task.id)}
                onShare={() => setShareTaskId(String(task.id))}
                onFavoriteToggle={handleFavoriteToggle}
              />
            )

            if (linkBasePath) {
              const href = `${linkBasePath}/${task.id}` as string
              return (
                <Link key={task.id} href={href} className="block">
                  {/* 传递 onSelect 来阻止 TaskCard 内部的 router.push，由 Link 处理导航 */}
                  {React.cloneElement(card, { onSelect: () => {} })}
                </Link>
              )
            }

            return <React.Fragment key={task.id}>{card}</React.Fragment>
          })}

      <RatingModal
        taskId={ratingModalFor ?? ''}
        open={!!ratingModalFor}
        onClose={() => setRatingModalFor(null)}
        onSaved={(data) => {
          if (ratingModalFor) {
            handleRatingUpdate(ratingModalFor, data)
          }
          setRatingModalFor(null)
        }}
      />
      {/* ShareModal centralized here to avoid overlay click propagation issues */}
      <ShareModal
        taskId={shareTaskId ?? ''}
        open={!!shareTaskId}
        onOpenChange={(v) => {
          if (!v)
            setShareTaskId(null)
        }}
      />
    </div>
  )
}

export default TaskHistoryList
