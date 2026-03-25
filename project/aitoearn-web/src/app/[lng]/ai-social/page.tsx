/**
 * AI 社媒页面 - AI Agent 内容生成
 * 功能：AI 驱动的内容创作、任务预览
 */

import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import { AiSocialPageContent } from './AiSocialPageContent'

// SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}) {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng, 'home')

  return getMetadata(
    {
      title: t('seo.title'),
      description: t('seo.description'),
      keywords: `${t('seo.keywords')}, aitoearn, AiToEarn`,
      referrer: 'no-referrer',
    },
    lng,
    '/ai-social',
  )
}

// 服务端组件 - 默认导出
export default function AiSocialPage() {
  return <AiSocialPageContent />
}
