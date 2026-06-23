/**
 * 首页 - 内容管理
 * 开源版首页直接展示草稿箱内容管理核心能力。
 */

import dynamic from 'next/dynamic'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/languageConfig'
import { getMetadata } from '@/utils/metadata'

interface PageParams {
  params: Promise<{ lng: string }>
}

export async function generateMetadata({ params }: PageParams) {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng

  const { t } = await useTranslation(lng, 'common')

  return getMetadata(
    {
      title: t('header.draftBoxSeoTitle'),
      description: t('header.draftBoxSeoDescription'),
      keywords: t('header.draftBoxSeoKeywords'),
    },
    lng,
    '/',
  )
}

const DraftBoxCore = dynamic(() => import('./draft-box/DraftBoxCore'), {
  ssr: false,
})

export default function HomePage() {
  return <DraftBoxCore />
}
