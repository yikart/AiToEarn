/**
 * LoginContent - 登录页面内容组件
 * 手机号/邮箱账号密码登录
 */

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useTransClient } from '@/app/i18n/client'
import { BrandWordmark } from '@/components/Brand/BrandWordmark'
import { useUserStore } from '@/store/user'

import { PasswordLoginForm } from './PasswordLoginForm'

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export default function LoginContent() {
  const router = useRouter()
  const { token, _hasHydrated } = useUserStore()
  const { t } = useTransClient('login')

  // 已登录用户重定向
  useEffect(() => {
    if (_hasHydrated && token) {
      router.replace('/')
    }
  }, [_hasHydrated, token, router])

  // 在 hydration 完成前或已登录时显示空白（避免闪烁）
  if (!_hasHydrated || token) {
    return null
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-muted">
      {/* 点状网格背景 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, var(--border) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* 左上角 Logo */}
      <div className="absolute left-6 top-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground no-underline hover:opacity-80 transition-opacity"
        >
          <BrandWordmark markSize={30} showTagline size="md" />
        </Link>
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.2 }}
          className="w-full max-w-[400px]"
        >
          {/* 中心 Logo */}
          <div className="mb-8 flex flex-col items-center">
            <Link
              href="/"
              className="mb-6 flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <BrandWordmark direction="stack" markSize={72} showTagline size="lg" />
            </Link>
            <h1 className="text-2xl font-semibold text-foreground">{t('welcomeBack')}</h1>
            <p className="mt-2 text-muted-foreground">{t('loginSubtitle')}</p>
          </div>

          {/* 登录表单 */}
          <PasswordLoginForm />
        </motion.div>

        {/* 底部条款 */}
        <p className="mt-10 text-center text-xs text-muted-foreground/70">
          {t('termsText')}
          {' '}
          <Link
            href="/websit/terms-of-service"
            className="text-muted-foreground underline hover:text-foreground"
          >
            {t('termsOfService')}
          </Link>
          {' '}
          {t('and')}
          {' '}
          <Link
            href="/websit/privacy-policy"
            className="text-muted-foreground underline hover:text-foreground"
          >
            {t('privacyPolicy')}
          </Link>
        </p>
      </div>
    </div>
  )
}
