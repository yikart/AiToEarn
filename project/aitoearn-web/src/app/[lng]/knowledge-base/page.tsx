import type { Metadata } from 'next'
import { getMetadata } from '@/utils/general'
import { KnowledgeBasePageContent } from './KnowledgeBasePageContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  const { lng } = await params

  return getMetadata(
    {
      title: '全局知识库 - 巨鲸网络',
      description: '集中管理 AI 回复、客户雷达、自动互动和内容发布共用的业务知识。',
      keywords: '全局知识库, AI回复, 客户雷达, 自动获客, 巨鲸网络',
    },
    lng,
    '/knowledge-base',
  )
}

export default function KnowledgeBasePage() {
  return <KnowledgeBasePageContent />
}
