import { WechatBrowserOverlay } from '@/components/common/WechatBrowserOverlay'

export const metadata = {
  title: 'AiToEarn',
  description: 'AiToEarn',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WechatBrowserOverlay variant="standalone" />
        {children}
      </body>
    </html>
  )
}
