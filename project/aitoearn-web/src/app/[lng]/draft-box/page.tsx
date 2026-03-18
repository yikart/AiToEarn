/**
 * 草稿箱页面
 * 独立页面展示 AI 批量生成 + 草稿列表 + 相关弹窗
 */

import dynamic from 'next/dynamic'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/lib/i18n/languageConfig'
import { getMetadata } from '@/utils/server-general'

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
    '/draft-box',
  )
}

const DraftBoxCore = dynamic(() => import('./DraftBoxCore'), {
  ssr: false,
})

export default function DraftBoxPage() {
  return <DraftBoxCore />
}
