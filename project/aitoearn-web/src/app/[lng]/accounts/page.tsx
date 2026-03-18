import type { PageParams } from '@/app/globals'
import AccountPageCore from '@/app/[lng]/accounts/accountCore'
import { useTranslation } from '@/app/i18n'
import { getMetadata } from '@/utils/server-general'

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params
  const { t } = await useTranslation(lng, 'account')

  return await getMetadata(
    {
      title: t('seo.title'),
      description: t('seo.description'),
      keywords: t('seo.keywords'),
    },
    lng,
    '/accounts',
  )
}

interface AccountsPageProps {
  searchParams: {
    platform?: string
    spaceId?: string
  }
}

export default function Page({ searchParams }: AccountsPageProps) {
  return <AccountPageCore searchParams={searchParams} />
}
