/**
 * LoginPage - 登录页面
 * 支持 Google 登录、邮箱验证码登录、手机验证码登录
 */

import type { Metadata } from 'next'
import { useTranslation } from '@/app/i18n'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { getMetadata } from '@/utils/server-general'
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
      keywords: t('seo.loginKeywords'),
    },
    lng,
    '/auth/login',
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
