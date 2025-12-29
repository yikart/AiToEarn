/**
 * PricingPage - 定价页面
 * 展示不同订阅方案的定价信息，包含创作者、专业版、商业版和企业版
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import { PricingContent } from './components/PricingContent'

// SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng, 'vip')

  return getMetadata(
    {
      title: t('pricing.pageTitle'),
      description: t('pricing.pageDescription'),
      keywords: 'pricing, subscription, membership, AiToEarn, creator, professional, business, enterprise',
    },
    lng,
  )
}

interface PricingPageProps {
  params: Promise<{ lng: string }>
}

async function PricingPage({ params }: PricingPageProps) {
  const { lng } = await params

  return <PricingContent lng={lng} />
}

export default PricingPage
