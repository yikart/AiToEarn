/**
 * WelcomePage - 欢迎页面
 * 品牌展示落地页，用于吸引新用户
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/server-general'
import WelcomePageContent from './WelcomePageContent'

// SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng

  const { t } = await useTranslation(lng, 'welcome')

  return getMetadata(
    {
      title: t('seo.title'),
      description: t('seo.description'),
      keywords: t('seo.keywords'),
      openGraph: {
        type: 'website',
        images: [
          {
            url: 'https://cdn.prod.website-files.com/66643a14df53b71d1ed72d08/6664485e59f0f7d9a9e54e5e_owner_og-p-1600.jpg',
            width: 1600,
            height: 838,
            alt: 'AiToEarn - AI Content Creation Platform',
          },
        ],
      },
    },
    lng,
    '/welcome',
  )
}

interface WelcomePageProps {
  params: Promise<{ lng: string }>
}

export default async function WelcomePage({ params }: WelcomePageProps) {
  const { lng } = await params

  return <WelcomePageContent lng={lng} />
}
