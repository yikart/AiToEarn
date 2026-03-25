/**
 * generateShareImages - 分享图片生成工具
 * 将聊天消息渲染为可分享的图片
 */
import type { IDisplayMessage } from '@/store/agent'
import html2canvas from 'html2canvas-pro'
import QRCode from 'qrcode'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { setDisableLanguageSwitch } from '@/app/i18n/client'
import logo from '@/assets/images/logo.png'
import ChatMessage from '@/components/Chat/ChatMessage'
import { getOssUrl } from '@/utils/oss'

/** 图片生成选项 */
export interface GenerateImageOptions {
  /** 应用标题 */
  appTitle?: string
  /** 应用URL */
  appUrl?: string
  /** 分享链接（用于生成二维码） */
  shareUrl?: string
  /** 链接过期时间 */
  expiresAt?: string
}

export async function generateImageFromMessages(
  messages: IDisplayMessage[],
  userName?: string,
  options?: GenerateImageOptions,
): Promise<Blob[]> {
  // 禁用语言自动切换，防止 ChatMessage 中的 useTransClient 改变全局语言
  setDisableLanguageSwitch(true)

  try {
    const blob = await generateImageFromAllMessages(messages, userName, options)
    if (!blob) {
      throw new Error('Failed to generate combined image')
    }
    return [blob]
  }
  finally {
    // 恢复语言切换功能
    setDisableLanguageSwitch(false)
  }
}

async function generateImageFromAllMessages(
  messages: IDisplayMessage[],
  userName?: string,
  options?: GenerateImageOptions,
): Promise<Blob | null> {
  // 处理消息中的媒体URL
  const processedMessages = messages.map(message => ({
    ...message,
    medias:
      message.medias?.map(media => ({
        ...media,
        url: getOssUrl(media.url),
      })) || [],
  }))

  // 创建临时容器
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 600px;
    background: #ffffff;
    padding: 20px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial;
  `

  // 设置 CSS 变量（浅色主题值）
  const cssVars: Record<string, string> = {
    '--background': '#ffffff',
    '--foreground': '#0f172a',
    '--card': '#ffffff',
    '--card-foreground': '#0f172a',
    '--muted': '#f4f4f5',
    '--muted-foreground': '#71717a',
    '--border': '#e4e4e7',
    '--primary': '#18181b',
    '--primary-foreground': '#fafafa',
    '--secondary': '#f4f4f5',
    '--secondary-foreground': '#18181b',
    '--accent': '#f4f4f5',
    '--accent-foreground': '#18181b',
    '--destructive': '#ef4444',
    '--destructive-foreground': '#fafafa',
    '--ring': '#a1a1aa',
    '--radius': '0.625rem',
    '--success': '#22c55e',
    '--success-foreground': '#fafafa',
    '--warning': '#f59e0b',
    '--warning-foreground': '#18181b',
    '--info': '#3b82f6',
    '--info-foreground': '#fafafa',
    // Tailwind v4 使用 --color-* 变量
    '--color-background': '#ffffff',
    '--color-foreground': '#0f172a',
    '--color-card': '#ffffff',
    '--color-card-foreground': '#0f172a',
    '--color-muted': '#f4f4f5',
    '--color-muted-foreground': '#71717a',
    '--color-border': '#e4e4e7',
    '--color-primary': '#18181b',
    '--color-primary-foreground': '#fafafa',
    '--color-success': '#22c55e',
    '--color-destructive': '#ef4444',
    '--color-warning': '#f59e0b',
    '--color-info': '#3b82f6',
  }

  Object.entries(cssVars).forEach(([key, value]) => {
    container.style.setProperty(key, value)
  })

  // 使用 React 渲染
  const root = createRoot(container)

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
        className: 'max-w-full',
      }),
    )

    const appTitle = options?.appTitle || 'AiToEarn'
    const appUrl = options?.appUrl || 'https://aitoearn.ai'
    const shareUrl = options?.shareUrl
    const expiresAt = options?.expiresAt

    const headerEl = React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' } },
      React.createElement('img', {
        src: typeof logo === 'string' ? logo : logo.src,
        style: { width: '40px', height: '40px', borderRadius: '8px' },
      }),
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        React.createElement(
          'div',
          { style: { fontSize: '18px', fontWeight: 700, color: '#0f172a' } },
          appTitle,
        ),
        React.createElement('div', { style: { fontSize: '12px', color: '#6b7280' } }, appUrl),
      ),
    )

    root.render(
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
        headerEl,
        ...messageElements,
        userName
        && React.createElement(
          'div',
          {
            style: {
              fontSize: '12px',
              color: '#71717a',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #e4e4e7',
            },
          },
          `Shared by ${userName}`,
        ),
        // 底部信息区域（包含二维码）
        React.createElement(
          'div',
          {
            id: 'share-footer',
            style: {
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #e4e4e7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            },
          },
          // 左侧：应用信息和日期
          React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 } },
            // 应用标题和 Logo
            React.createElement(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              React.createElement('img', {
                src: typeof logo === 'string' ? logo : logo.src,
                style: { width: '24px', height: '24px', borderRadius: '4px' },
              }),
              React.createElement(
                'span',
                { style: { fontSize: '14px', fontWeight: 600, color: '#0f172a' } },
                appTitle,
              ),
            ),
            // 生成日期
            React.createElement(
              'div',
              { style: { fontSize: '12px', color: '#71717a' } },
              `Generated: ${new Date().toLocaleDateString()}`,
            ),
            // 有效期
            expiresAt
            && React.createElement(
              'div',
              { style: { fontSize: '12px', color: '#71717a' } },
              `Expires: ${new Date(expiresAt).toLocaleDateString()}`,
            ),
            // 分享链接（简短显示）
            shareUrl
            && React.createElement(
              'div',
              {
                style: {
                  fontSize: '11px',
                  color: '#94a3b8',
                  wordBreak: 'break-all',
                  maxWidth: '300px',
                },
              },
              shareUrl.length > 50 ? `${shareUrl.substring(0, 50)}...` : shareUrl,
            ),
          ),
          // 右侧：二维码占位（将在 DOM 渲染后替换为实际二维码）
          shareUrl
          && React.createElement(
            'div',
            {
              id: 'qr-code-container',
              style: {
                width: '100px',
                height: '100px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0',
              },
            },
            React.createElement(
              'span',
              { style: { fontSize: '12px', color: '#94a3b8' } },
              'QR Code',
            ),
          ),
        ),
      ),
    )

    // 等待组件渲染完成
    setTimeout(async () => {
      // 等待视频首帧
      await ensureVideoThumbnails(container)
      // 强制设置所有元素的样式（修复透明度问题）
      forceOpaqueStyles(container)

      // 生成并插入二维码
      if (shareUrl) {
        await generateAndInsertQRCode(container, shareUrl)
      }

      resolve()
    }, 1000)
  })

  document.body.appendChild(container)

  try {
    await waitForImagesToLoad(container)
    await (document as any).fonts?.ready

    // 在截图前再次强制设置样式，确保所有样式都已正确应用
    forceOpaqueStyles(container)

    container.style.height = `${container.scrollHeight}px`

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: process.env.NODE_ENV === 'development',
      imageTimeout: 15000,
      removeContainer: false,
      height: container.scrollHeight,
      windowHeight: container.scrollHeight,
    })

    const resultBlob: Blob | null = await new Promise<Blob | null>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Image generation timeout'))
      }, 45000)

      canvas.toBlob(
        (blob) => {
          clearTimeout(timeout)
          resolve(blob)
        },
        'image/png',
        0.95,
      )
    })

    return resultBlob
  }
  finally {
    root.unmount()
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }
}

/**
 * 生成二维码并插入到容器中
 */
async function generateAndInsertQRCode(container: HTMLElement, shareUrl: string): Promise<void> {
  try {
    const qrContainer = container.querySelector('#qr-code-container')
    if (!qrContainer)
      return

    // 生成二维码 DataURL
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#0f172a', // 二维码颜色
        light: '#ffffff', // 背景色
      },
      errorCorrectionLevel: 'M',
    })

    // 创建二维码图片元素
    const qrImg = document.createElement('img')
    qrImg.src = qrDataUrl
    qrImg.style.cssText = 'width: 100%; height: 100%; border-radius: 4px;'
    qrImg.alt = 'Share QR Code'

    // 清空占位内容并插入二维码
    qrContainer.innerHTML = ''
    qrContainer.appendChild(qrImg)
  }
  catch (error) {
    console.error('Failed to generate QR code:', error)
    // 保留占位符，不影响截图
  }
}

/**
 * 特殊颜色类到 Hex 值的映射（浅色主题）
 * 用于解决 oklch 颜色在 html2canvas 中无法渲染的问题
 */
const TEXT_COLOR_MAP: Record<string, string> = {
  'text-success': '#22c55e',
  'text-destructive': '#ef4444',
  'text-warning': '#f59e0b',
  'text-info': '#3b82f6',
  'text-primary': '#18181b',
  'text-muted': '#71717a',
  'text-muted-foreground': '#71717a',
  'text-foreground': '#0f172a',
}

const BG_COLOR_MAP: Record<string, string> = {
  'bg-success': '#22c55e',
  'bg-destructive': '#ef4444',
  'bg-warning': '#f59e0b',
  'bg-info': '#3b82f6',
  'bg-primary': '#18181b',
  'bg-muted': '#f4f4f5',
  'bg-card': '#ffffff',
  'bg-background': '#ffffff',
}

/**
 * 强制设置所有元素为不透明样式
 * 解决 CSS 变量和 oklch 颜色在 html2canvas 中无法正确渲染的问题
 */
function forceOpaqueStyles(container: HTMLElement): void {
  // 首先处理所有消息气泡（bg-card 类）- 这些是最重要的
  container.querySelectorAll('[class*="bg-card"]').forEach((el) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.setProperty('background-color', '#ffffff', 'important')
    htmlEl.style.setProperty('background', '#ffffff', 'important')
    htmlEl.style.setProperty('opacity', '1', 'important')
  })

  // 处理 bg-background 类
  container.querySelectorAll('[class*="bg-background"]').forEach((el) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.setProperty('background-color', '#ffffff', 'important')
    htmlEl.style.setProperty('opacity', '1', 'important')
  })

  // 处理 bg-muted 类
  container.querySelectorAll('[class*="bg-muted"]').forEach((el) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.setProperty('background-color', '#f4f4f5', 'important')
    htmlEl.style.setProperty('opacity', '1', 'important')
  })

  // 处理圆角消息框
  container.querySelectorAll('[class*="rounded-2xl"], [class*="rounded-lg"]').forEach((el) => {
    const htmlEl = el as HTMLElement
    const className = htmlEl.className?.toString() || ''
    if (className.includes('border') || className.includes('bg-')) {
      // 检查是否有背景色设置，如果是透明的就设置为白色
      const computed = window.getComputedStyle(htmlEl)
      const bgColor = computed.backgroundColor
      if (
        !bgColor
        || bgColor === 'rgba(0, 0, 0, 0)'
        || bgColor === 'transparent'
        || bgColor.includes('oklch')
      ) {
        htmlEl.style.setProperty('background-color', '#ffffff', 'important')
      }
      htmlEl.style.setProperty('opacity', '1', 'important')
    }
  })

  // 处理边框颜色
  container.querySelectorAll('[class*="border"]').forEach((el) => {
    const htmlEl = el as HTMLElement
    const computed = window.getComputedStyle(htmlEl)
    if (computed.borderColor?.includes('oklch') || computed.borderTopColor?.includes('oklch')) {
      htmlEl.style.setProperty('border-color', '#e4e4e7', 'important')
    }
  })

  // 遍历所有元素，确保没有透明度问题，并处理特殊颜色类
  container.querySelectorAll('*').forEach((el) => {
    const htmlEl = el as HTMLElement
    const computed = window.getComputedStyle(htmlEl)
    const className = htmlEl.className?.toString() || ''

    // 强制 opacity 为 1
    if (Number.parseFloat(computed.opacity) < 1) {
      htmlEl.style.setProperty('opacity', '1', 'important')
    }

    // 处理特殊文字颜色类
    let textColorSet = false
    for (const [colorClass, hexColor] of Object.entries(TEXT_COLOR_MAP)) {
      if (className.includes(colorClass)) {
        htmlEl.style.setProperty('color', hexColor, 'important')
        textColorSet = true
        break
      }
    }

    // 如果没有匹配到特殊颜色类，且颜色包含 oklch，则设置默认颜色
    if (!textColorSet && computed.color?.includes('oklch')) {
      htmlEl.style.setProperty('color', '#0f172a', 'important')
    }

    // 处理特殊背景颜色类
    for (const [colorClass, hexColor] of Object.entries(BG_COLOR_MAP)) {
      if (className.includes(colorClass)) {
        htmlEl.style.setProperty('background-color', hexColor, 'important')
        break
      }
    }
  })
}

/**
 * 等待容器内所有图片加载完成
 */
function waitForImagesToLoad(container: HTMLElement, timeoutMs = 15000): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'))
  if (imgs.length === 0)
    return Promise.resolve()

  return new Promise<void>((resolve) => {
    let settled = 0
    const total = imgs.length
    const onSettled = () => {
      settled++
      if (settled >= total)
        resolve()
    }

    setTimeout(() => resolve(), timeoutMs)

    imgs.forEach((img) => {
      try {
        const tester = new Image()
        tester.crossOrigin = 'anonymous'
        tester.onload = onSettled
        tester.onerror = onSettled
        tester.src = img.src
      }
      catch {
        onSettled()
      }
    })
  })
}

/**
 * 确保视频显示首帧
 */
async function ensureVideoThumbnails(container: HTMLElement): Promise<void> {
  const videos = Array.from(container.querySelectorAll('video'))
  if (videos.length === 0)
    return

  await Promise.all(
    videos.map(async (video) => {
      try {
        video.preload = 'metadata'
        video.muted = true
        video.playsInline = true

        if (video.poster)
          return

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('timeout')), 10000)
          video.onloadedmetadata = () => {
            clearTimeout(timeout)
            resolve()
          }
          video.onerror = () => {
            clearTimeout(timeout)
            reject(new Error('error'))
          }
          if (video.readyState >= 1) {
            clearTimeout(timeout)
            resolve()
          }
        })

        video.currentTime = 0
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked)
            setTimeout(resolve, 100)
          }
          video.addEventListener('seeked', onSeeked)
        })
      }
      catch {
        // 视频加载失败，用占位符替换
        const placeholder = document.createElement('div')
        placeholder.style.cssText = `
        width: ${video.offsetWidth || 200}px;
        height: ${video.offsetHeight || 150}px;
        background: #f3f4f6;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        font-size: 14px;
      `
        placeholder.innerHTML = '🎥 <span>Video</span>'
        video.parentNode?.replaceChild(placeholder, video)
      }
    }),
  )
}

/**
 * 从 DOM 节点生成图片
 */
export async function generateImageFromNode(node: HTMLElement, scale = 1): Promise<Blob | null> {
  if (!node?.isConnected) {
    throw new Error('Node is not connected to DOM')
  }

  const originalStyles = {
    position: node.style.position,
    left: node.style.left,
    top: node.style.top,
    visibility: node.style.visibility,
  }

  node.style.position = 'fixed'
  node.style.left = '0'
  node.style.top = '0'
  node.style.visibility = 'visible'

  try {
    const canvas = await html2canvas(node, {
      scale: Math.max(scale, 1),
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: process.env.NODE_ENV === 'development',
      scrollY: 0,
      scrollX: 0,
      width: node.offsetWidth,
      height: node.offsetHeight,
      windowWidth: node.offsetWidth,
      windowHeight: node.offsetHeight,
      imageTimeout: 10000,
      removeContainer: false,
    })

    Object.assign(node.style, originalStyles)

    return new Promise<Blob | null>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 30000)
      canvas.toBlob(
        (blob) => {
          clearTimeout(timeout)
          if (!blob)
            reject(new Error('Failed to generate blob'))
          else resolve(blob)
        },
        'image/png',
        0.95,
      )
    })
  }
  catch (error) {
    Object.assign(node.style, originalStyles)
    throw error
  }
}
