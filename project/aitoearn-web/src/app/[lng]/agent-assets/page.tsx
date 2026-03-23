/**
 * Agent 素材详情页
 * 展示 Agent 生成的所有图片和视频素材（只读模式）
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import { AgentAssetsPageCore } from './agentAssetsPageCore'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng, 'material')

  return getMetadata(
    {
      title: t('agentAssets.title'),
      description: t('agentAssets.description'),
      keywords: t('agentAssets.keywords'),
    },
    lng,
  )
}

export default function AgentAssetsPage() {
  return <AgentAssetsPageCore />
}
