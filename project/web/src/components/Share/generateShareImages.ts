import html2canvas from "html2canvas-pro";
import React from "react";
import { createRoot } from "react-dom/client";
import type { IDisplayMessage } from "@/store/agent";
import ChatMessage from "@/components/Chat/ChatMessage";
import { getOssUrl } from "@/utils/oss";
import logo from "@/assets/images/logo.png";
// upload handled by caller (SharePreviewModal)

export async function generateImageFromMessages(
  messages: IDisplayMessage[],
  userName?: string,
  options?: { appTitle?: string; appUrl?: string }
): Promise<Blob[]> {
  // 将所有消息渲染到一张长图中
  const blob = await generateImageFromAllMessages(messages, userName, options);
  if (!blob) {
    throw new Error('Failed to generate combined image');
  }
  return [blob];
}

async function generateImageFromAllMessages(
  messages: IDisplayMessage[],
  userName?: string,
  options?: { appTitle?: string; appUrl?: string; upload?: boolean }
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

    // header 包含 logo 和标题
    const appTitle = options?.appTitle || 'AiToEarn';
    const appUrl = options?.appUrl || 'https://aitoearn.ai';
    const headerEl = React.createElement(
      'div',
      { className: 'flex items-center gap-3 mb-4' },
      React.createElement('img', {
        src: logo.src || logo,
        style: { width: '40px', height: '40px', borderRadius: '8px' },
      }),
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        React.createElement('div', { style: { fontSize: '18px', fontWeight: 700 } }, appTitle),
        React.createElement('div', { style: { fontSize: '12px', color: '#6b7280' } }, appUrl)
      )
    );

    root.render(
      React.createElement(
        'div',
        { className: 'flex flex-col gap-4' },
        headerEl,
        // 所有消息内容
        ...messageElements,
        // 用户信息
        userName &&
          React.createElement(
            'div',
            {
              className: 'text-xs text-muted-foreground mt-4 pt-4 border-t border-gray-200',
              style: { marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eef2f7' },
            },
            `Shared by ${userName}`
          )
      )
    );
    // 等待组件渲染完成
    setTimeout(async () => {
      // 替换所有img和video元素的URL为代理地址
      replaceMediaUrlsWithProxy(container);
      // 等待视频首帧加载完成
      await ensureVideoThumbnails(container);
    // 规范化媒体容器样式（截图时避免因 bg-muted 等类导致气泡看起来变淡）
    // 调暗/强化 AI 气泡对比，避免在消息较少时 AI 气泡过淡
    dimAssistantBubbles(container);
    normalizeMediaWrapperStyles(container);
      resolve();
    }, 1000); // 增加等待时间确保所有消息和视频都渲染完成
  });

  document.body.appendChild(container);

  try {
    // 确保所有图片已加载并且字体就绪，避免因未加载资源导致导出不全
    await waitForImagesToLoad(container);
    await (document as any).fonts?.ready;
    // 确保容器高度被正确计算
    container.style.height = `${container.scrollHeight}px`;

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

    const resultBlob: Blob | null = await new Promise<Blob | null>((resolve, reject) => {
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
    // return generated blob; caller is responsible for uploading if needed
    return resultBlob;
  } finally {
    // 清理
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * 等待容器内所有图片通过 proxy 加载完成
 */
function waitForImagesToLoad(container: HTMLElement, timeoutMs = 15000): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img')).map((img) => img as HTMLImageElement);
  if (imgs.length === 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let settled = 0;
    const total = imgs.length;
    const onSettled = () => {
      settled++;
      if (settled >= total) resolve();
    };

    const timer = setTimeout(() => {
      resolve(); // 超时仍然继续，避免阻塞太久
    }, timeoutMs);

    imgs.forEach((img) => {
      // 使用单独的 Image 对象预加载，确保跨域资源也能尝试加载
      try {
        const tester = new Image();
        tester.crossOrigin = 'anonymous';
        tester.onload = () => {
          onSettled();
        };
        tester.onerror = () => {
          onSettled();
        };
        tester.src = img.src;
      } catch (e) {
        onSettled();
      }
    });
  });
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

/**
 * 规范化媒体容器样式，避免在截图时出现气泡颜色变淡的问题
 */
function normalizeMediaWrapperStyles(container: HTMLElement): void {
  // 将使用 bg-muted 的按钮背景替换为与消息气泡一致的背景（bg-card）
  const mediaButtons = container.querySelectorAll('button');
  mediaButtons.forEach(btn => {
    // 仅处理包含 video 或 img 的按钮
    if (btn.querySelector('video') || btn.querySelector('img')) {
      // 强制设置背景与边框，覆盖 Tailwind 的语义化类带来的颜色差异
      (btn as HTMLElement).style.background = '#ffffff';
      (btn as HTMLElement).style.borderColor = '#e6e9ef';
      (btn as HTMLElement).style.boxShadow = 'none';
      (btn as HTMLElement).style.opacity = '1';
    }
  });

  // 对直接包含媒体的容器也做同样处理（例如 markdown 渲染出来的 video 包裹）
  const mediaWrappers = container.querySelectorAll('.bg-muted, .media-wrapper');
  mediaWrappers.forEach(w => {
    (w as HTMLElement).style.background = '#ffffff';
    (w as HTMLElement).style.opacity = '1';
  });
}

/**
 * 将 AI 消息气泡调暗一些，截图时视觉更贴合设计要求
 */
function dimAssistantBubbles(container: HTMLElement): void {
  try {
    // Find avatar images that are the assistant logo (AiToEarn)
    const imgs = Array.from(container.querySelectorAll('img'));
    imgs.forEach((img) => {
      try {
        const src = img.src || '';
        // heuristic: logo file name contains 'logo' or 'aitoearn'
        if (!/logo|aitoearn/i.test(src)) return;

        // find the message root (the flex container that holds avatar + message)
        let root = img.closest('.flex');
        if (!root) {
          // fallback: go up a few levels to find a container with two children (avatar + content)
          let el: HTMLElement | null = img.parentElement;
          for (let i = 0; i < 4 && el; i++) {
            if (el.classList && el.classList.contains('flex')) {
              root = el;
              break;
            }
            el = el.parentElement;
          }
        }
        if (!root) return;

        // within the root, find descendant that looks like the message bubble (bg-card)
        const bubble = root.querySelector('.bg-card') as HTMLElement | null;
        if (!bubble) return;

        // Apply stronger background and text color to increase contrast for exported image
        bubble.style.background = '#ffffff'; // keep white base
        bubble.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.03)';
        bubble.style.color = '#0f172a';
        bubble.style.opacity = '1';
        // Also ensure any muted-text inside becomes more visible
        const mutedEls = bubble.querySelectorAll('.text-muted-foreground, .text-muted');
        mutedEls.forEach((el) => {
          (el as HTMLElement).style.color = '#4b5563'; // slate-600
          (el as HTMLElement).style.opacity = '1';
        });
      } catch (e) {
        // ignore per-element errors
      }
    });
  } catch (e) {
    // silent
  }
}


