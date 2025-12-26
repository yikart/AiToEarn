"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { agentApi, type TaskDetail, type TaskMessage } from "@/api/agent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { generateImageFromMessages } from "./generateShareImages";
import ChatMessage from "@/components/Chat/ChatMessage";
import { useUserStore } from "@/store/user";
import { toast } from "@/lib/toast";
import type { IDisplayMessage } from "@/store/agent";
import { convertMessages } from "@/app/[lng]/chat/[taskId]/utils";
import { useTransClient } from "@/app/i18n/client";

interface ShareModalProps {
  taskId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const ShareModal = ({
  taskId,
  open = false,
  onOpenChange,
  trigger,
}: ShareModalProps) => {
  const { t } = useTransClient('share');
  const [visible, setVisible] = useState(open);
  const [loading, setLoading] = useState(false);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const user = useUserStore((s) => s.userInfo);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  useEffect(() => {
    if (!taskId || !visible) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await agentApi.getTaskDetail(taskId);

        if (res?.data) {
          setTaskDetail(res.data);
          // 使用转换后的 display messages 的 id 作为默认选中（避免后端原始消息 id 与前端展示 id 不一致）
          const converted = convertMessages(res.data.messages || []);
          const displayIds = converted.map((m) => m.id);
          setSelectedIds(displayIds);
          // 默认全部折叠
          setCollapsedIds(new Set(displayIds));
        } else {
          toast.error("Failed to load task detail: No data received");
        }
      } catch (err) {
        console.error("Failed to load task detail:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        toast.error(`Failed to load task detail: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [taskId, visible]);

  const messages = useMemo(() => {
    if (!taskDetail?.messages) return [];
    return convertMessages(taskDetail.messages);
  }, [taskDetail?.messages]);

  // 在列表中始终显示所有消息（复选框仅用于高亮与导出选择）
  const displayMessages = useMemo(() => {
    return messages;
  }, [messages]);

  // 折叠状态：记录被折叠的 message id 集合
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // refs for measuring rendered message height
  const messageRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const [longIds, setLongIds] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const measure = () => {
      const next = new Set<string>();
      messageRefs.current.forEach((el, id) => {
        try {
          // threshold changed to 60
          if (el && el.scrollHeight > 60) next.add(id);
        } catch (e) {
          // ignore
        }
      });
      setLongIds(next);
    };

    // initial measure after a tick to allow children render
    const t = setTimeout(measure, 150);
    const ro = new ResizeObserver(measure);
    messageRefs.current.forEach((el) => {
      if (el) ro.observe(el);
    });
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [displayMessages]);
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      return [...prev, id];
    });
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setVisible(open);
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  const handleGenerateAndDownload = useCallback(async () => {
    if (!messages || messages.length === 0) {
      toast.error("No messages available");
      return;
    }

    const selectedMessages = messages.filter((m) => selectedIds.includes(m.id));

    if (selectedMessages.length === 0) {
      toast.error("Please select at least one message to share");
      return;
    }

    setLoading(true);

    try {
      // 生成包含所有选中消息的长图
      const blobs = await generateImageFromMessages(
        selectedMessages,
        user?.name,
        { appTitle: t('appName'), appUrl: t('appUrl') }
      );

      if (blobs.length === 0) {
        throw new Error("No images were generated successfully");
      }

      // 下载生成的图片
      await downloadImages(blobs, taskId);

      toast.success(`Conversation image generated and downloaded successfully`);
    } catch (err) {
      console.error("Failed to generate images:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(`Failed to generate images: ${errorMessage}`);
    } finally {
      setLoading(false);
      onOpenChange?.(false);
      setVisible(false);
    }
  }, [messages, selectedIds, taskId, user?.name, onOpenChange]);

  // 辅助函数：下载图片
  const downloadImages = async (
    blobs: Blob[],
    taskId: string
  ): Promise<void> => {
    const downloadPromises = blobs.map((blob, index) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const a = document.createElement("a");
          const url = URL.createObjectURL(blob);
          a.href = url;
          // 为长图使用不同的命名
          const fileName =
            blobs.length === 1
              ? `aitoearn_conversation_${taskId}.png`
              : `aitoearn_${taskId}_${index + 1}.png`;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    await Promise.all(downloadPromises);
  };

  const messageListContent = loading ? (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  ) : (
    displayMessages.map((message) => {
      const isUser = message.role === 'user';
      const isSelected = selectedIds.includes(message.id);
      const isCollapsed = collapsedIds.has(message.id);
      const isLong = longIds.has(message.id) || !!(message.content && message.content.length > 60) || (message.medias && message.medias.length > 0);

      const checkbox = (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => Array.from(new Set([...prev, message.id])));
            } else {
              setSelectedIds((prev) => prev.filter((id) => id !== message.id));
            }
          }}
          className="mt-1"
        />
      );

      // click handler for message area: toggle selection unless inner interactive element clicked
      const onMessageClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        // if clicked inside an interactive element, ignore
        if (target.closest('a,button,input,textarea,select,video')) return;
        toggleSelect(message.id);
      };

      // role-based base and highlight colors (now unified; use grayish highlight)
      const ROLE_BASE: Record<string, string> = {
        user: '#ffffff',
        assistant: '#ffffff',
      };
      // make highlight very subtle (lighter)
      const ROLE_HIGHLIGHT: Record<string, string> = {
        user: '#fbfbfd',
        assistant: '#fbfbfd',
      };
      const baseMessageStyle: React.CSSProperties = {
        padding: 12,
        borderRadius: 8,
      };
      const roleBg = isUser ? ROLE_BASE.user : ROLE_BASE.assistant;
      const selectedBg = isUser ? ROLE_HIGHLIGHT.user : ROLE_HIGHLIGHT.assistant;
      const selectedStyle: React.CSSProperties = {
        ...baseMessageStyle,
        background: selectedBg,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)'
      };
      const defaultStyle: React.CSSProperties = {
        ...baseMessageStyle,
        background: roleBg
      };

      return (
        <div
          key={message.id}
          className="relative"
        >
          <div
            onClick={onMessageClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSelect(message.id); }}
            className={`flex items-start gap-3`}
            style={isSelected ? selectedStyle : defaultStyle}
            ref={(el) => {
              if (el) messageRefs.current.set(message.id, el as HTMLDivElement);
              else messageRefs.current.delete(message.id);
            }}
          >
            {!isUser && (
              <div className="mt-1">
                {checkbox}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div style={isLong && isCollapsed ? { maxHeight: 40, overflow: 'hidden', position: 'relative' } : undefined}>
                <ChatMessage
                  role={message.role === 'system' ? 'assistant' : message.role}
                  content={message.content}
                  medias={message.medias}
                  status={message.status}
                  errorMessage={message.errorMessage}
                  createdAt={message.createdAt}
                  steps={message.steps}
                  actions={message.actions}
                  className="max-w-full"
                />
                {isLong && isCollapsed && (
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40, background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.95))' }} />
                )}
              </div>
              {/* fold button moved to top-right for better visibility */}
            </div>

            {isUser && (
              <div className="mt-1">
                {checkbox}
              </div>
            )}
          </div>

          {/* top-right collapse button */}
          {isLong && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleCollapse(message.id); }}
                      title={isCollapsed ? t('showMore') : t('collapse')}
              className={`absolute top-3 w-9 h-9 flex items-center justify-center bg-white border border-border rounded-full shadow-sm hover:bg-muted/80`}
              style={{ zIndex: 20, left: isUser ? '12px' : undefined, right: isUser ? undefined : '12px' } as React.CSSProperties}
            >
              <span style={{ fontSize: 12 }}>{isCollapsed ? '▾' : '▴'}</span>
            </button>
          )}
        </div>
      );
    })
  );

  return (
    <Dialog open={visible} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full max-h-[calc(90vh-120px)]">
          {/* 操作按钮区域 */}
          <div className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allIds = displayMessages.map(m => m.id);
                  setSelectedIds(allIds);
                }}
                className="cursor-pointer"
              >
                {t('selectAll')}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    {t('selectRecent')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      const recentCount = Math.min(5, displayMessages.length);
                      const recentIds = displayMessages.slice(-recentCount).map(m => m.id);
                      setSelectedIds(recentIds);
                    }}
                  >
                    {t('recent5')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const recentCount = Math.min(10, displayMessages.length);
                      const recentIds = displayMessages.slice(-recentCount).map(m => m.id);
                      setSelectedIds(recentIds);
                    }}
                  >
                    {t('recent10')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const recentCount = Math.min(20, displayMessages.length);
                      const recentIds = displayMessages.slice(-recentCount).map(m => m.id);
                      setSelectedIds(recentIds);
                    }}
                  >
                    {t('recent20')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="cursor-pointer"
              >
                {t('clearSelection')}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {t('selectedCount', { count: selectedIds.length })}
            </div>
          </div>

          {/* 消息选择区域 */}
            <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-4">
            {messageListContent}
          </div>

            <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setVisible(false);
                onOpenChange?.(false);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleGenerateAndDownload}
              disabled={loading || selectedIds.length === 0}
              className="bg-primary text-white"
            >
              {loading
                ? t('generating')
                : t('generateAndDownload', { count: selectedIds.length })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
