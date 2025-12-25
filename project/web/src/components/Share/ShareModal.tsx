"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { agentApi, type TaskDetail, type TaskMessage } from "@/api/agent";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateImageFromNode } from "./generateShareImages";
import ChatMessage from "@/components/Chat/ChatMessage";
import { ChatMessageList } from "@/app/[lng]/chat/[taskId]/components";
import { useUserStore } from "@/store/user";
import logo from "@/assets/images/logo.png";
import { toast } from "@/lib/toast";
import type { IDisplayMessage, IUploadedMedia } from "@/store/agent";
import { convertMessages } from "@/app/[lng]/chat/[taskId]/utils";

interface ShareModalProps {
  taskId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CHUNK_SIZE = 6; // 每张图片包含的消息数量（简单分页策略）
const PAGE_WIDTH = 1080;
const PAGE_HEIGHT = 1080;
const MAX_CONCURRENT_GENERATION = 3; // 限制并发图片生成数量

export const ShareModal = ({ taskId, open = false, onOpenChange }: ShareModalProps) => {
  const [visible, setVisible] = useState(open);
  const [loading, setLoading] = useState(false);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const hiddenContainerRef = useRef<HTMLDivElement | null>(null);
  const user = useUserStore((s) => s.userInfo);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  useEffect(() => {
    if (!taskId) return;

    // 取消之前的请求
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        const res = await agentApi.getTaskDetail(taskId);

        // 检查请求是否被取消
        if (abortControllerRef.current?.signal.aborted) return;

        if (res?.data) {
          setTaskDetail(res.data);
          // default select all messages with proper type safety
          const msgIds = (res.data.messages || []).map((m: TaskMessage, idx: number) =>
            m.uuid || String(idx)
          );
          setSelectedIds(msgIds);
        } else {
          toast.error("Failed to load task detail: No data received");
        }
      } catch (err) {
        // 检查是否是取消请求导致的错误
        if (abortControllerRef.current?.signal.aborted) return;

        console.error('Failed to load task detail:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        toast.error(`Failed to load task detail: ${errorMessage}`);
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    // 清理函数
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [taskId]);

  const messages = useMemo((): IDisplayMessage[] => {
    return taskDetail?.messages ? convertMessages(taskDetail.messages) : [];
  }, [taskDetail]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const chunkMessages = (list: any[]) => {
    const chunked: any[][] = [];
    for (let i = 0; i < list.length; i += CHUNK_SIZE) {
      chunked.push(list.slice(i, i + CHUNK_SIZE));
    }
    return chunked;
  };

  const handleGenerateAndDownload = useCallback(async () => {
    if (!messages || messages.length === 0) {
      toast.error("No messages available");
      return;
    }

    const selectedMessages = messages.filter((m) =>
      selectedIds.includes(m.id)
    );

    if (selectedMessages.length === 0) {
      toast.error("Please select at least one message to share");
      return;
    }

    setLoading(true);
    let node: HTMLDivElement | null = null;

    try {
      // 预加载图片以确保它们能被正确渲染
      const logoUrl = logo.src;
      await preloadImage(logoUrl);

      // 创建分享容器，使用与聊天页面相同的样式
      node = document.createElement("div");
      node.style.width = `${PAGE_WIDTH}px`;
      node.style.minHeight = `${PAGE_HEIGHT}px`;
      node.style.background = "white";
      node.style.fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial";
      node.style.position = "fixed";
      node.style.left = "-9999px";
      node.style.top = "0";
      node.setAttribute("data-aitoearn-share", "true");

      // 创建头部
      const header = createHeader(logoUrl);
      node.appendChild(header);

      // 创建消息容器，使用 ChatMessageList 组件的样式
      const messagesContainer = document.createElement("div");
      messagesContainer.style.padding = "16px";
      messagesContainer.style.maxHeight = `${PAGE_HEIGHT - 120}px`; // 减去头部和底部空间
      messagesContainer.style.overflow = "hidden";

      // 创建消息列表，使用现有的 ChatMessageList 组件样式
      const messagesList = document.createElement("div");
      messagesList.style.display = "flex";
      messagesList.style.flexDirection = "column";
      messagesList.style.gap = "16px";

      // 渲染选中的消息，使用与 ChatMessage 组件相同的样式
      for (const message of selectedMessages) {
        const messageElement = document.createElement("div");
        messageElement.style.display = "flex";
        messageElement.style.gap = "12px";
        messageElement.style.alignItems = "flex-start";

        // 头像
        const avatarContainer = document.createElement("div");
        avatarContainer.style.width = "32px";
        avatarContainer.style.height = "32px";
        avatarContainer.style.borderRadius = "50%";
        avatarContainer.style.overflow = "hidden";
        avatarContainer.style.flexShrink = "0";

        const avatar = document.createElement("img");
        avatar.style.width = "32px";
        avatar.style.height = "32px";
        avatar.style.objectFit = "cover";

        if (message.role === "user") {
          // 用户头像（暂时使用logo）
          avatar.src = logoUrl;
        } else {
          // AI头像
          avatar.src = logoUrl;
        }
        avatarContainer.appendChild(avatar);
        messageElement.appendChild(avatarContainer);

        // 消息内容
        const contentContainer = document.createElement("div");
        contentContainer.style.flex = "1";
        contentContainer.style.maxWidth = "calc(100% - 44px)";

        // 消息气泡
        const messageBubble = document.createElement("div");
        messageBubble.style.padding = "12px 16px";
        messageBubble.style.borderRadius = "16px";
        messageBubble.style.borderBottomLeftRadius = message.role === "user" ? "4px" : "16px";
        messageBubble.style.borderBottomRightRadius = message.role === "assistant" ? "4px" : "16px";
        messageBubble.style.background = message.role === "user" ? "#f0f9ff" : "#f8fafc";
        messageBubble.style.border = "1px solid";
        messageBubble.style.borderColor = message.role === "user" ? "#e0f2fe" : "#f1f5f9";
        messageBubble.style.color = "#0f172a";
        messageBubble.style.fontSize = "14px";
        messageBubble.style.lineHeight = "1.5";
        messageBubble.style.wordBreak = "break-word";

        messageBubble.textContent = message.content || "[No content]";
        contentContainer.appendChild(messageBubble);
        messageElement.appendChild(contentContainer);

        messagesList.appendChild(messageElement);
      }

      messagesContainer.appendChild(messagesList);
      node.appendChild(messagesContainer);

      // 创建底部信息
      const footer = createFooter("", user?.name as string || "AiToEarn User");
      node.appendChild(footer);

      // 添加到DOM并生成图片
      document.body.appendChild(node);

      try {
        // 计算分页 - 简化版，每个页面固定高度
        const messagesHeight = messagesList.scrollHeight;
        const pageHeight = PAGE_HEIGHT - 120; // 减去头部和底部
        const pages = Math.max(1, Math.ceil(messagesHeight / pageHeight));

        const blobs: Blob[] = [];
        const promises: Promise<void>[] = [];

        for (let p = 0; p < pages; p++) {
          const pageIndex = p;
          const promise = (async () => {
            try {
              // 滚动到对应位置
              messagesContainer.scrollTop = pageIndex * pageHeight;

              // 等待布局稳定
              await new Promise(resolve => setTimeout(resolve, 200));

              const blob = await generateImageFromNode(node!, window.devicePixelRatio || 1);
              if (blob) {
                blobs.push(blob);
              }
            } catch (err) {
              console.error(`Failed to generate page ${pageIndex + 1}:`, err);
            }
          })();

          promises.push(promise);

          // 限制并发数量
          if (promises.length >= MAX_CONCURRENT_GENERATION) {
            await Promise.all(promises.splice(0, MAX_CONCURRENT_GENERATION));
          }
        }

        // 等待剩余的promise完成
        await Promise.all(promises);

        if (blobs.length === 0) {
          throw new Error("No images were generated successfully");
        }

        // 下载生成的图片
        await downloadImages(blobs, taskId);

        toast.success(`${blobs.length} image${blobs.length > 1 ? 's' : ''} generated and downloaded successfully`);
      } finally {
        // 确保节点被移除
        if (node && node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }

    } catch (err) {
      console.error('Failed to generate images:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Failed to generate images: ${errorMessage}`);
    } finally {
      setLoading(false);
      onOpenChange?.(false);
      setVisible(false);
    }
  }, [messages, selectedIds, taskId, user, onOpenChange]);

  // 辅助函数：预加载图片
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  // 辅助函数：创建头部
  const createHeader = (logoUrl: string): HTMLDivElement => {
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "12px";
    header.style.marginBottom = "12px";

    const imgWrap = document.createElement("div");
    imgWrap.style.width = "56px";
    imgWrap.style.height = "56px";
    imgWrap.style.overflow = "hidden";
    imgWrap.style.borderRadius = "10px";

    const img = document.createElement("img");
    img.src = logoUrl;
    img.width = 56;
    img.height = 56;
    img.style.width = "56px";
    img.style.height = "56px";
    imgWrap.appendChild(img);
    header.appendChild(imgWrap);

    const titleEl = document.createElement("div");
    titleEl.style.fontSize = "22px";
    titleEl.style.fontWeight = "700";
    titleEl.textContent = "AiToEarn";
    header.appendChild(titleEl);

    return header;
  };


  // 辅助函数：创建底部
  const createFooter = (userAvatarUrl: string, userName: string): HTMLDivElement => {
    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.alignItems = "center";
    footer.style.gap = "12px";
    footer.style.marginTop = "12px";

    const userAvatarWrap = document.createElement("div");
    userAvatarWrap.style.width = "44px";
    userAvatarWrap.style.height = "44px";
    userAvatarWrap.style.borderRadius = "50%";
    userAvatarWrap.style.overflow = "hidden";

    const uimg = document.createElement("img");
    uimg.src = userAvatarUrl || "";
    uimg.width = 44;
    uimg.height = 44;
    uimg.style.width = "44px";
    uimg.style.height = "44px";
    userAvatarWrap.appendChild(uimg);

    const uname = document.createElement("div");
    uname.style.fontWeight = "600";
    uname.style.fontSize = "14px";
    uname.textContent = userName || "Anonymous User";
    footer.appendChild(userAvatarWrap);
    footer.appendChild(uname);

    return footer;
  };

  // 辅助函数：下载图片
  const downloadImages = async (blobs: Blob[], taskId: string): Promise<void> => {
    const downloadPromises = blobs.map((blob, index) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const a = document.createElement("a");
          const url = URL.createObjectURL(blob);
          a.href = url;
          a.download = `aitoearn_${taskId}_${index + 1}.png`;
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
    <Dialog open={visible} onOpenChange={(v) => { setVisible(v); onOpenChange?.(v); }}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Share Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">选择要包含在图片中的消息</div>
          <div className="max-h-80 overflow-auto border rounded-md p-3 bg-card border-border space-y-2">
            {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
            {!loading && messages.length === 0 && <div className="text-sm text-muted-foreground">No messages</div>}
            {!loading && messages.map((m: IDisplayMessage, idx: number) => {
              const id = m.id;
              return (
                <div key={id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(id)}
                    onChange={() => toggleSelect(id)}
                    className="h-4 w-4"
                    aria-label={`select-${id}`}
                  />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                    <div className="text-sm text-foreground wrap-break-word">
                      <ChatMessage
                        role={m.role === 'system' ? 'assistant' : m.role}
                        content={m.content}
                        medias={m.medias}
                        className="max-w-full"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => { setVisible(false); onOpenChange?.(false); }}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateAndDownload}
              disabled={loading || selectedIds.length === 0}
              className="bg-primary text-white"
            >
              {loading ? "Generating..." : `Generate & Download (${selectedIds.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;


