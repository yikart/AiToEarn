/**
 * TaskHistoryList - 可复用的任务卡片列表组件
 * 用于在不同页面展示任务网格，支持 loading skeleton、删除、评分回调和可选链接包裹
 */
 'use client'

import React from "react"
import { TaskCard, TaskCardSkeleton } from "@/components/Chat"
import { type TaskListItem } from "@/api/agent"
import { cn } from "@/lib/utils"

export interface ITaskHistoryListProps {
  tasks: TaskListItem[]
  isLoading?: boolean
  skeletonCount?: number
  onDelete?: (id: string) => void | Promise<void>
  onRateClick?: (taskId: string) => void
  className?: string
  /** 可选：为每条记录生成链接的前缀（例如 '/en/chat'），若传入则会用 <a> 包裹 TaskCard */
  linkBasePath?: string
}

export const TaskHistoryList = ({
  tasks,
  isLoading = false,
  skeletonCount = 4,
  onDelete,
  onRateClick,
  className,
  linkBasePath,
}: ITaskHistoryListProps) => {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <TaskCardSkeleton key={index} />
          ))
        : tasks.map((task) => {
            const card = (
              <TaskCard
                id={String(task.id)}
                title={task.title ?? ''}
                status={task.status}
                createdAt={task.createdAt}
                updatedAt={task.updatedAt}
                onDelete={onDelete}
                onRateClick={onRateClick}
              />
            )

            if (linkBasePath) {
              const href = (`${linkBasePath}/${task.id}`) as string
              return (
                <a key={task.id} href={href} className="block">
                  {card}
                </a>
              )
            }

            return <React.Fragment key={task.id}>{card}</React.Fragment>
          })}
    </div>
  )
}

export default TaskHistoryList


