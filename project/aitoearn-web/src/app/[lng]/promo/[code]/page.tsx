/**
 * 推广码发布页面
 * 用于推广者通过推广码进入后发布内容
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import PromoPageCore from './promoPageCore'

// 生成 SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string, code: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng, 'promo')

  return getMetadata(
    {
      title: t('meta.title'),
      description: t('meta.description'),
      keywords: 'promotion, publish, social media, AiToEarn',
    },
    lng,
    `/promo`,
  )
}

// 页面组件
export default async function PromoPage({
  params,
}: {
  params: Promise<{ lng: string, code: string }>
}) {
  const { lng, code } = await params

  return <PromoPageCore lng={lng} code={code} />
}
