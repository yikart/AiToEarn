import type { Metadata } from 'next'
import { getMetadata } from '@/utils/general'
import { CustomerRadarPageContent } from './CustomerRadarPageContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  const { lng } = await params

  return getMetadata(
    {
      title: '客户雷达 - AI主动获客',
      description: '配置客户画像，扫描社媒平台客户信号，并用 AI 生成低风险触达建议。',
      keywords: '客户雷达, AI获客, 主动获客, 线索扫描, 社媒获客',
    },
    lng,
    '/customer-radar',
  )
}

export default function CustomerRadarPage() {
  return <CustomerRadarPageContent />
}
