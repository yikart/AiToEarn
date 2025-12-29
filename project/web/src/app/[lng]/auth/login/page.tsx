/**
 * LoginPage - 登录页面
 * 支持 Google 登录和邮箱登录/注册
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/general'
import LoginContent from './components/LoginContent'

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
      title: t('seo.loginTitle'),
      description: t('seo.loginDescription'),
      keywords: 'login, sign in, register, sign up, AiToEarn, account, authentication',
    },
    lng,
  )
}

interface LoginPageProps {
  params: Promise<{ lng: string }>
}

async function LoginPage({ params }: LoginPageProps) {
  const { lng } = await params

  return <LoginContent />
}

export default LoginPage
