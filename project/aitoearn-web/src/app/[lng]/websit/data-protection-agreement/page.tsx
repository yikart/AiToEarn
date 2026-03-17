/**
 * DataProtectionAgreementPage - 数据保护协议页面
 * 展示 AiToEarn 平台的数据保护协议和 GDPR 合规信息
 */
import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import DataProtectionContent from './DataProtectionContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng

  const { t } = await useTranslation(lng, 'websit')

  return getMetadata(
    {
      title: t('dataProtection.title'),
      description: t('dataProtection.description'),
      keywords: t('dataProtection.keywords'),
    },
    lng,
    '/websit/data-protection-agreement',
  )
}

export default function DataProtectionAgreementPage() {
  return <DataProtectionContent />
}
