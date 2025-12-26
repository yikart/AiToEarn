import html2canvas from "html2canvas-pro";
import React from "react";
import { createRoot } from "react-dom/client";
import type { IDisplayMessage } from "@/store/agent";
import ChatMessage from "@/components/Chat/ChatMessage";
import { getOssUrl } from "@/utils/oss";

export async function generateImageFromMessages(
  messages: IDisplayMessage[],
  userName?: string
): Promise<Blob[]> {
  // 将所有消息渲染到一张长图中
  const blob = await generateImageFromAllMessages(messages, userName);
  if (!blob) {
    throw new Error('Failed to generate combined image');
  }
  return [blob];
}

async function generateImageFromAllMessages(
  messages: IDisplayMessage[],
  userName?: string
): Promise<Blob | null> {
  // 处理消息中的媒体URL，确保使用代理URL
  const processedMessages = messages.map(message => ({
    ...message,
    medias: message.medias?.map(media => ({
      ...media,
      url: getOssUrl(media.url)
    })) || []
  }));

  // 创建临时容器
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "600px";
  container.style.background = "white";
  container.style.padding = "20px";
  container.style.fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial";

  // 使用 React 渲染所有消息组件
  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    const messageElements = processedMessages.map((message, index) =>
      React.createElement(ChatMessage, {
        key: message.id || index,
        role: message.role === 'system' ? 'assistant' : message.role,
        content: message.content,
        medias: message.medias,
        status: message.status,
        errorMessage: message.errorMessage,
        createdAt: message.createdAt,
        steps: message.steps,
        actions: [], // 不渲染 actions，避免路由相关错误
        className: 'max-w-full'
      })
    );

    root.render(
      React.createElement('div', { className: 'flex flex-col gap-4' },
        // 所有消息内容
        ...messageElements,
        // 用户信息
        userName && React.createElement('div', {
          className: 'text-xs text-muted-foreground mt-4 pt-4 border-t border-gray-200'
        }, `Shared by ${userName}`)
      )
    );
    // 等待组件渲染完成
    setTimeout(async () => {
      // 替换所有img和video元素的URL为代理地址
      replaceMediaUrlsWithProxy(container);
      // 等待视频首帧加载完成
      await ensureVideoThumbnails(container);
      resolve();
    }, 1000); // 增加等待时间确保所有消息和视频都渲染完成
  });

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // 高分辨率
      useCORS: true, // 【重要】开启跨域配置
      allowTaint: true, // 允许跨域图片
      backgroundColor: "#ffffff",
      logging: process.env.NODE_ENV === "development",
      imageTimeout: 15000, // 增加超时时间处理更多内容
      removeContainer: false,
      // 确保捕获完整的高度
      height: container.scrollHeight,
      windowHeight: container.scrollHeight,
    });

    return new Promise<Blob | null>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Image generation timeout"));
      }, 45000); // 增加超时时间

      canvas.toBlob(
        (blob) => {
          clearTimeout(timeout);
          resolve(blob);
        },
        "image/png",
        0.95
      );
    });
  } finally {
    // 清理
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

export async function generateImageFromNode(node: HTMLElement, scale = 1): Promise<Blob | null> {
  try {
    // 确保节点在DOM中并且可见
    if (!node || !node.isConnected) {
      throw new Error("Node is not connected to DOM");
    }

    // 临时设置节点可见性用于截图
    const originalStyles = {
      position: node.style.position,
      left: node.style.left,
      top: node.style.top,
      visibility: node.style.visibility,
    };

    node.style.position = "fixed";
    node.style.left = "0";
    node.style.top = "0";
    node.style.visibility = "visible";

    const canvas = await html2canvas(node, {
      scale: Math.max(scale, 1), // 确保最小scale为1
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: process.env.NODE_ENV === "development",
      scrollY: 0,
      scrollX: 0,
      width: node.offsetWidth,
      height: node.offsetHeight,
      windowWidth: node.offsetWidth,
      windowHeight: node.offsetHeight,
      // 提高图片质量
      imageTimeout: 10000, // 增加图片加载超时时间
      removeContainer: false,
    });

    // 恢复原始样式
    Object.assign(node.style, originalStyles);

    return new Promise<Blob | null>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Image generation timeout"));
      }, 30000); // 30秒超时

      canvas.toBlob(
        (blob) => {
          clearTimeout(timeout);
          if (!blob) {
            reject(new Error("Failed to generate blob from canvas"));
            return;
          }
          resolve(blob);
        },
        "image/png",
        0.95 // 设置图片质量为95%
      );
    });

  } catch (error) {
    console.error("Error generating image from node:", error);
    throw error; // 重新抛出错误，让调用方处理
  }
}

/**
 * 将容器中所有img和video元素的AWS URL替换为代理URL
 */
function replaceMediaUrlsWithProxy(container: HTMLElement): void {
  const awsUrl = process.env.NEXT_PUBLIC_S3_URL!;
  const proxyUrl = process.env.NEXT_PUBLIC_S3_PROXY!;

  // 处理图片元素
  const images = container.querySelectorAll('img');
  
  images.forEach(img => {
    if (img.src && img.src.startsWith(awsUrl)) {
      const path = img.src.substring(awsUrl.length);
      img.src = proxyUrl + path;
    }
  });

  // 处理视频元素
  const videos = container.querySelectorAll('video');
  videos.forEach(video => {
    if (video.src && video.src.startsWith(awsUrl)) {
      const path = video.src.substring(awsUrl.length);
      video.src = proxyUrl + path;
    }

    // 也处理poster属性（视频封面图）
    if (video.poster && video.poster.startsWith(awsUrl)) {
      const path = video.poster.substring(awsUrl.length);
      video.poster = proxyUrl + path;
    }
  });
}

/**
 * 确保容器中的视频元素显示首帧
 */
async function ensureVideoThumbnails(container: HTMLElement): Promise<void> {
  const videos = container.querySelectorAll('video');

  if (videos.length === 0) {
    return;
  }

  const videoPromises = Array.from(videos).map(async (video) => {
    const videoElement = video as HTMLVideoElement;

    try {
      // 设置视频属性以确保能显示首帧
      videoElement.preload = 'metadata';
      videoElement.muted = true;
      videoElement.playsInline = true;

      // 如果视频已经有 poster，使用 poster
      if (videoElement.poster) {
        return;
      }

      // 等待视频元数据加载
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video metadata timeout'));
        }, 10000);

        videoElement.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };

        videoElement.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Video load error'));
        };

        // 如果视频已经加载了元数据
        if (videoElement.readyState >= 1) {
          clearTimeout(timeout);
          resolve();
        }
      });

      // 设置当前时间为0（首帧）
      videoElement.currentTime = 0;

      // 等待一帧渲染
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          videoElement.removeEventListener('seeked', onSeeked);
          setTimeout(resolve, 100); // 等待渲染
        };
        videoElement.addEventListener('seeked', onSeeked);
      });

    } catch (error) {
      console.warn('Failed to load video thumbnail:', error);
      // 如果视频加载失败，至少显示一个占位符
      replaceVideoWithPlaceholder(videoElement);
    }
  });

  try {
    await Promise.all(videoPromises);
  } catch (error) {
    console.warn('Some videos failed to load thumbnails:', error);
  }
}

/**
 * 用占位符替换无法加载的视频
 */
function replaceVideoWithPlaceholder(videoElement: HTMLVideoElement): void {
  const placeholder = document.createElement('div');
  placeholder.style.width = videoElement.offsetWidth + 'px';
  placeholder.style.height = videoElement.offsetHeight + 'px';
  placeholder.style.backgroundColor = '#f3f4f6';
  placeholder.style.border = '2px dashed #d1d5db';
  placeholder.style.borderRadius = '8px';
  placeholder.style.display = 'flex';
  placeholder.style.alignItems = 'center';
  placeholder.style.justifyContent = 'center';
  placeholder.style.color = '#6b7280';
  placeholder.style.fontSize = '14px';
  placeholder.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial';

  const icon = document.createElement('div');
  icon.textContent = '🎥';
  icon.style.fontSize = '24px';
  icon.style.marginRight = '8px';

  const text = document.createElement('span');
  text.textContent = 'Video';

  placeholder.appendChild(icon);
  placeholder.appendChild(text);

  if (videoElement.parentNode) {
    videoElement.parentNode.replaceChild(placeholder, videoElement);
  }
}


