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
import { generateImageFromMessages } from "./generateShareImages";
import ChatMessage from "@/components/Chat/ChatMessage";
import { useUserStore } from "@/store/user";
import { toast } from "@/lib/toast";
import type { IDisplayMessage } from "@/store/agent";
import { convertMessages } from "@/app/[lng]/chat/[taskId]/utils";

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
          // 默认选中所有消息
          const msgIds = (res.data.messages || []).map(
            (m: TaskMessage, idx: number) => m.uuid || (m.type === 'user' ? `user-${idx}` : String(idx))
          );
          setSelectedIds(msgIds);
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

  const displayMessages = useMemo(() => {
    return messages.filter((m) => selectedIds.includes(m.id));
  }, [messages, selectedIds]);

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
        user?.name
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

  return (
    <Dialog open={visible} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Share Conversation</DialogTitle>
          <DialogDescription>
            Select messages to share as an image
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full max-h-[calc(90vh-120px)]">
          {/* 消息选择区域 */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-4">
            {displayMessages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(message.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds((prev) => [...prev, message.id]);
                    } else {
                      setSelectedIds((prev) =>
                        prev.filter((id) => id !== message.id)
                      );
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <ChatMessage
                    role={
                      message.role === "system" ? "assistant" : message.role
                    }
                    content={message.content}
                    medias={message.medias}
                    status={message.status}
                    errorMessage={message.errorMessage}
                    createdAt={message.createdAt}
                    steps={message.steps}
                    actions={message.actions}
                    className="max-w-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setVisible(false);
                onOpenChange?.(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateAndDownload}
              disabled={loading || selectedIds.length === 0}
              className="bg-primary text-white"
            >
              {loading
                ? "Generating..."
                : `Generate & Download (${displayMessages.length} messages)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
