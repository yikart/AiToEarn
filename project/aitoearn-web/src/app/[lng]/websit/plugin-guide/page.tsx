/**
 * PluginGuidePage - 浏览器插件图文教学页面
 * 用于指导用户安装和使用 AiToEarn 浏览器插件
 */
import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import PluginGuideContent from './PluginGuideContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng, 'pluginGuide')

  return getMetadata(
    {
      title: t('seo.title'),
      description: t('seo.description'),
      keywords: t('seo.keywords'),
    },
    lng,
    '/websit/plugin-guide',
  )
}

export default function PluginGuidePage() {
  return <PluginGuideContent />
}
