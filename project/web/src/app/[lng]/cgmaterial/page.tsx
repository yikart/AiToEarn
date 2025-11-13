import type { PageParams } from '@/app/globals'
import dynamic from 'next/dynamic'
import * as React from 'react'
import { useTranslation } from '@/app/i18n'
import { getMetadata } from '@/utils/general'

const CgMaterialPageCore = dynamic(
  // @ts-ignore
  () => import('./cgmaterialPageCore').then(mod => mod.default || mod.CgMaterialPageCore),
  { ssr: false },
)

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params
  return await getMetadata(
    {
      title: '草稿箱',
    },
    lng,
  )
}

export default function Page({ params }: PageParams) {
  return (
    <>
      <CgMaterialPageCore />
    </>
  )
}
