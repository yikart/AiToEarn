import type { PageParams } from '@/app/globals'
import { useTranslation } from '@/app/i18n'
import { getMetadata } from '@/utils/general'
import InteractiveNewCore from './InteractiveNewCore'

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params
  const { t } = await useTranslation(lng, 'interactiveNew')
  return await getMetadata(
    {
      title: t('title'),
      description: t('describe'),
    },
    lng,
  )
}

export default function Page() {
  return <InteractiveNewCore />
}
