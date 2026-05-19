/**
 * LoginContent - 登录页面内容组件
 * 中国区支持手机号 / 邮箱验证码登录切换，海外默认邮箱登录
 */

'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useTransClient } from '@/app/i18n/client'
import logo from '@/assets/images/logo.png'
import { Button } from '@/components/ui/button'
import { isChina } from '@/constant'
import { useUserStore } from '@/store/user'

import { EmailLoginForm } from './EmailLoginForm'
import { PhoneLoginForm } from './PhoneLoginForm'

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export default function LoginContent() {
  const router = useRouter()
  const { token, _hasHydrated } = useUserStore()
  const { t } = useTransClient('login')
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>(isChina ? 'phone' : 'email')

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

  const isPhoneLogin = loginMethod === 'phone'

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
          <Image src={logo} alt="AiToEarn" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">AiToEarn</span>
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
              className="mb-6 flex h-20 w-20 items-center justify-center hover:opacity-80 transition-opacity"
            >
              <Image
                src={logo}
                alt="AiToEarn"
                width={72}
                height={72}
                className="drop-shadow-md"
              />
            </Link>
            <p className="mt-2 text-muted-foreground">{t('loginSubtitle')}</p>
          </div>

          {/* 根据环境切换表单 */}
          {isChina
            ? isPhoneLogin
              ? <PhoneLoginForm />
              : <EmailLoginForm showGoogleLogin={false} />
            : <EmailLoginForm />}

          {isChina && (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="link"
                onClick={() => setLoginMethod(isPhoneLogin ? 'email' : 'phone')}
                className="h-auto cursor-pointer px-0 text-sm text-muted-foreground hover:text-foreground"
              >
                {isPhoneLogin ? t('switchToEmailLogin') : t('switchToPhoneLogin')}
              </Button>
            </div>
          )}
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
