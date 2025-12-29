/**
 * TaskCard - 任务卡片组件
 * 功能：显示任务简要信息，支持点击跳转到对话详情
 */

"use client";

import type React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTransClient } from "@/app/i18n/client";
import { useGetClientLng } from "@/hooks/useSystem";
import { cn, formatRelativeTime } from "@/lib/utils";

export interface ITaskCardProps {
  /** 任务ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务状态（英文原始状态字符串） */
  status?: string;
  /** 创建时间 */
  createdAt: string | number;
  /** 更新时间 */
  updatedAt?: string | number;
  /** 任务评分（1-5） */
  rating?: number | null;
  /** 删除回调 */
  onDelete?: (id: string) => void | Promise<void>;
  /** 评分回调（用于历史列表触发外部评分弹窗） */
  onRateClick?: (taskId: string) => void;
  /** 选择回调（如果提供，点击卡片将触发选择而不是跳转） */
  onSelect?: (id: string) => void;
  /** 在主页展示内联评分控件 */
  showInlineRating?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 分享回调（由父组件触发 ShareModal） */
  onShare?: (id: string) => void;
}

/** 获取状态显示配置 */
function getStatusConfig(
  status: string | undefined,
  t: (key: string) => string
) {
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case "requires_action":
      return {
        label: t("task.status.requiresAction") || "Requires Action",
        className:
          "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        icon: AlertCircle,
      };
    case "completed":
      return {
        label: t("task.status.completed") || "Completed",
        className:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
        icon: CheckCircle2,
      };
    case "running":
      return {
        label: t("task.status.running") || "Running",
        className:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        icon: Loader2,
      };
    case "error":
    case "failed":
      return {
        label: t("task.status.failed") || "Failed",
        className:
          "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
        icon: AlertCircle,
      };
    default:
      return {
        label: status || "",
        className: "bg-muted text-muted-foreground border-border",
        icon: null,
      };
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
  rating,
  onDelete,
  className,
  onSelect,
  onRateClick,
  onShare,
}: ITaskCardProps) {
  const router = useRouter();
  const lng = useGetClientLng();
  const { t } = useTransClient("chat");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { t: cgmaterialT } = useTransClient("cgmaterial");

  const statusConfig = getStatusConfig(status, t as (key: string) => string);

  /** 跳转到对话详情页 */
  const handleClick = () => {
    if (isDeleting) return;
    if (onSelect) {
      onSelect(id);
      return;
    }
    router.push(`/${lng}/chat/${id}`);
  };

  /** 处理删除 */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await onDelete(id);
    } finally {
      setIsDeleting(false);
    }
  };

  /** 触发评分回调（由历史列表等外部组件使用） */
  const handleRateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onRateClick) return;
    onRateClick(id);
  };

  const handleShareClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (typeof onShare === "function") onShare(id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex flex-col p-4 rounded-xl border border-border bg-card cursor-pointer transition-all",
        "hover:border-border hover:shadow-md",
        isDeleting && "opacity-60 cursor-wait",
        className
      )}
    >
      {/* 图标 + 标题 */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </div>
        <h4
          title={title}
          className="text-sm font-medium text-foreground truncate flex-1 pt-1"
        >
          {title || "New Chat"}
        </h4>
      </div>

      {/* 时间 & 状态 */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(updatedAt || createdAt))}
        </span>
        {status && statusConfig.label && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              statusConfig.className
            )}
          >
            {statusConfig.icon && (
              <statusConfig.icon
                className={cn(
                  "w-3 h-3",
                  status?.toLowerCase() === "running" && "animate-spin"
                )}
              />
            )}
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* Action buttons: rating and delete */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={handleRateClick}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs opacity-60 hover:opacity-100"
          aria-label="rate"
        >
          <Star
            className={`w-3 h-3 ${rating ? "text-amber-400" : ""}`}
            {...(rating ? { fill: "currentColor" } : {})}
          />
          <span className="hidden sm:inline">{t("task.rate") || "Rate"}</span>
        </button>
        <button
          onClick={handleShareClick}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs opacity-60 hover:opacity-100"
          aria-label="rate"
        >
          <Share2 className={`w-3 h-3`} />
          <span className="hidden sm:inline">
            {cgmaterialT("import.shares")}
          </span>
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-xs opacity-60 hover:opacity-100"
          aria-label="delete"
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          <span className="hidden sm:inline">
            {t("task.delete") || "Delete"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
