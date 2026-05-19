/**
 * PluginUpdateDocsPage - 浏览器插件更新图文教学页面
 * 用于指导用户手动升级 AiToEarn 浏览器插件到最新版本
 */
import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import PluginUpdateDocsContent from './PluginUpdateDocsContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng

  const { t } = await useTranslation(lng, 'pluginUpdateDocs')

  return getMetadata(
    {
      title: t('seo.title'),
      description: t('seo.description'),
      keywords: t('seo.keywords'),
    },
    lng,
    '/websit/plugin-update-docs',
  )
}

export default function PluginUpdateDocsPage() {
  return <PluginUpdateDocsContent />
}
