/**
 * 任务记录页 - Tasks History
 * 功能：显示所有任务记录，支持分页加载和删除
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'

import { TasksHistoryPageContent } from './TasksHistoryPageContent'

// SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng, 'chat')

  return getMetadata(
    {
      title: t('history.meta.title'),
      description: t('history.meta.description'),
      keywords: t('history.meta.keywords'),
    },
    lng,
    '/tasks-history',
  )
}

// 默认导出
export default function TasksHistoryPage() {
  return <TasksHistoryPageContent />
}
