import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { SystemAdminPageContent } from './SystemAdminPageContent'

export async function generateMetadata({ params }: { params: Promise<{ lng: string }> }): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng

  const { t } = await useTranslation(lng)
  return {
    title: `系统管理 | ${t('title')}`,
    description: '巨鲸网络私有化部署系统管理、模型配置和多客户运行状态。',
  }
}

export default function SystemAdminPage() {
  return <SystemAdminPageContent />
}
