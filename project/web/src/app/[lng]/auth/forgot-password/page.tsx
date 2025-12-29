/**
 * ForgotPasswordPage - 忘记密码页面
 * 发送重置密码邮件和重置密码功能
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import ForgotPasswordContent from './components/ForgotPasswordContent'

// SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng))
    lng = fallbackLng
  const { t } = await useTranslation(lng, 'login')

  return getMetadata(
    {
      title: t('seo.forgotPasswordTitle'),
      description: t('seo.forgotPasswordDescription'),
      keywords: 'forgot password, reset password, password recovery, AiToEarn, account',
    },
    lng,
  )
}

interface ForgotPasswordPageProps {
  params: Promise<{ lng: string }>
}

async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { lng } = await params

  return <ForgotPasswordContent />
}

export default ForgotPasswordPage
