/**
 * TikTok OAuth 回调页面
 * 处理 TikTok 授权后的重定向
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/server-general'
import PromoCallbackCore from './promoCallbackCore'

// 生成 SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng, 'promo')

  return getMetadata(
    {
      title: t('meta.title'),
      description: t('meta.description'),
      keywords: t('meta.keywords'),
    },
    lng,
    `/promo`,
  )
}

// 页面组件
export default async function PromoCallbackPage({
  params,
}: {
  params: Promise<{ lng: string }>
}) {
  const { lng } = await params

  return <PromoCallbackCore lng={lng} />
}
