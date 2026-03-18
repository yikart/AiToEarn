import type { PageParams } from '@/app/globals'
import * as React from 'react'
import { MaterialPageCore } from '@/app/[lng]/material/materialPageCore'
import { useTranslation } from '@/app/i18n'
import { getMetadata } from '@/utils/server-general'

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params
  const { t } = await useTranslation(lng, 'material')
  return await getMetadata(
    {
      title: t('meta.title'),
      description: t('meta.description'),
      keywords: t('meta.keywords'),
    },
    lng,
    '/material',
  )
}

export default async function Page({ params }: PageParams) {
  const { lng } = await params
  const { t } = await useTranslation(lng, 'material')

  return (
    <>
      <MaterialPageCore />
    </>
  )
}
