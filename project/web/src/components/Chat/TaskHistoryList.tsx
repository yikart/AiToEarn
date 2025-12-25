/**
 * TaskHistoryList - 可复用的任务卡片列表组件
 * 用于在不同页面展示任务网格，支持 loading skeleton、删除、评分回调和可选链接包裹
 */
"use client";

import React, { useState } from "react";
import { TaskCard, TaskCardSkeleton } from "@/components/Chat";
import RatingModal from "@/components/Chat/Rating";
import { agentApi, type TaskListItem } from "@/api/agent";
import { toast } from "@/lib/toast";
import { useTransClient } from "@/app/i18n/client";
import { cn } from "@/lib/utils";

export interface ITaskHistoryListProps {
  tasks: TaskListItem[];
  isLoading?: boolean;
  skeletonCount?: number;
  /** 刷新列表回调，由父组件提供 */
  onRefresh?: () => void | Promise<void>;
  className?: string;
  /** 可选：为每条记录生成链接的前缀（例如 '/en/chat'），若传入则会用 <a> 包裹 TaskCard */
  linkBasePath?: string;
}

export const TaskHistoryList = ({
  tasks,
  isLoading = false,
  skeletonCount = 4,
  onRefresh,
  className,
  linkBasePath = '/chat',
}: ITaskHistoryListProps) => {
  const { t } = useTransClient("chat");
  const [ratingModalFor, setRatingModalFor] = useState<string | null>(null);

  const handleRateClick = (taskId: string) => {
    setRatingModalFor(taskId);
  };

  /** 处理删除任务 */
  const handleDelete = async (id: string) => {
    try {
      const result = await agentApi.deleteTask(id);
      if (result && result.code === 0) {
        toast.success(t("task.deleteSuccess" as any));
        // 调用父组件的刷新回调
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        toast.error((result as any)?.message || t("task.deleteFailed" as any));
      }
    } catch (error) {
      toast.error(t("task.deleteFailed" as any));
    }
  };

  /** 处理评分更新 */
  const handleRatingUpdate = async (
    taskId: string,
    data: { rating?: number | null; comment?: string | null }
  ) => {
    // 这里可以更新本地状态，或者让父组件处理
    // 由于父组件有自己的状态管理，我们通过 onRefresh 来更新
    if (onRefresh) {
      await onRefresh();
    }
    toast.success(t("rating.saveSuccess" as any) || "Saved");
  };
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <TaskCardSkeleton key={index} />
          ))
        : tasks.map((task) => {
            const card = (
              <TaskCard
                id={String(task.id)}
                title={task.title ?? ""}
                status={task.status}
                createdAt={task.createdAt}
                updatedAt={task.updatedAt}
                rating={task.rating}
                onDelete={() => handleDelete(String(task.id))}
                onRateClick={() => handleRateClick(task.id)}
              />
            );

            if (linkBasePath) {
              const href = `${linkBasePath}/${task.id}` as string;
              return (
                <a key={task.id} href={href} className="block">
                  {card}
                </a>
              );
            }

            return <React.Fragment key={task.id}>{card}</React.Fragment>;
          })}

      <RatingModal
        taskId={ratingModalFor ?? ""}
        open={!!ratingModalFor}
        onClose={() => setRatingModalFor(null)}
        onSaved={(data) => {
          if (ratingModalFor) {
            handleRatingUpdate(ratingModalFor, data);
          }
          setRatingModalFor(null);
        }}
      />
    </div>
  );
};

export default TaskHistoryList;
