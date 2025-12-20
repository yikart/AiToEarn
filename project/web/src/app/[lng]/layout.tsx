import { dir } from 'i18next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import LayoutSidebar from '@/app/layout/LayoutSidebar'
import MobileNav from '@/app/layout/MobileNav'
import { Providers } from '../layout/Providers'
import '@/app/var.css'
import '../globals.css'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}) {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng)
  return {
    title: t('title'),
    description: t('content'),
    keywords: 'aitoearn, AiToEarn, ai, earn, aitoearn.com',
  }
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lng: string }>
}>) {
  const { lng } = await params
  return (
    <html lang={lng} dir={dir(lng)} suppressHydrationWarning>
      <body>
        {/* Rewardful 脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`,
          }}
        />
        <script async src="https://r.wdfl.co/rw.js" data-rewardful="ded70f" />
        <Providers lng={lng}>
          {/* 移动端顶部导航 - fixed 定位，独立于 flex 布局 */}
          <MobileNav />
          <div className="flex h-screen w-full">
            {/* 桌面端侧边栏 */}
            <LayoutSidebar />
            {/* 主内容区域 */}
            <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-14 md:pt-0">
              {children}
            </main>
            <script src="/js/xhs_web_sign.js" />
            <script src="/js/xhs_sign_init.js" />
            <script src="/js/xhs_sign_core.js" />
            <script src="/js/xhs_sign_inject.js" />
          </div>
        </Providers>
      </body>
    </html>
  )
}
