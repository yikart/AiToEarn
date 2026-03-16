/**
 * WelcomeLayout - Welcome 页面专用布局
 * 预加载关键资源，优化首屏加载
 */

import type { Viewport } from 'next'

// 视口配置
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* 关键：立即添加样式类，防止 FOUC（样式闪烁） */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.documentElement.classList.add('welcome-page-active');
            document.body.classList.add('welcome-page-body');
          `,
        }}
      />
      {/* 预连接到关键域名 */}
      <link rel="preconnect" href="https://cdn.prod.website-files.com" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {children}
    </>
  )
}
