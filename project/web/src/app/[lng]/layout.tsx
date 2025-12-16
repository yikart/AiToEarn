import { dir } from 'i18next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import ConditionalHeader from '../layout/ConditionalHeader'
import { Providers } from '../layout/Providers'
import '@/app/var.css'
import '../globals.css'
import LyaoutHeader from "@/app/layout/LyaoutHeader";

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
    <html lang={lng} dir={dir(lng)}>
      <body>
        <Providers lng={lng}>
          <div
            style={{
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '0',
            }}
          >
            <LyaoutHeader />;
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
