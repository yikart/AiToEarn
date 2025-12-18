/**
 * ForgotPasswordContent - 忘记密码页面内容组件
 * 发送重置密码邮件和重置密码功能
 * 使用 react-hook-form + zod 进行表单校验
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { resetPasswordApi, sendResetPasswordMailApi } from '@/api/apiReq'
import { useTransClient } from '@/app/i18n/client'
import logo from '@/assets/images/logo.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

// 页面步骤类型
type Step = 'email' | 'reset'

// 动画配置
const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

// 表单数据类型
interface EmailFormData {
  email: string
}

interface ResetFormData {
  code: string
  password: string
  confirmPassword: string
}

export default function ForgotPasswordContent() {
  const router = useRouter()
  const { t } = useTransClient('login')

  // 步骤状态
  const [step, setStep] = useState<Step>('email')
  const [userEmail, setUserEmail] = useState('')

  // 邮箱表单 Schema（国际化）
  const emailSchema = useMemo(() => z.object({
    email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
  }), [t])

  // 重置密码表单 Schema（国际化）
  const resetSchema = useMemo(() => z.object({
    code: z.string().min(1, t('verificationCodeRequired')),
    password: z.string().min(6, t('newPasswordMinLength')),
    confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
  }).refine(data => data.password === data.confirmPassword, {
    message: t('confirmPasswordMismatch'),
    path: ['confirmPassword'],
  }), [t])

  // 邮箱表单
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  })

  // 重置密码表单
  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      code: '',
      password: '',
      confirmPassword: '',
    },
  })

  // 发送重置邮件
  const handleSendEmail = async (data: EmailFormData) => {
    try {
      const response: any = await sendResetPasswordMailApi({ mail: data.email })

      if (response.code === 0) {
        toast.success(t('resetEmailSent'))
        setUserEmail(data.email)
        setStep('reset')
      } else {
        toast.error(response.message || t('sendEmailFailed'))
      }
    } catch (error) {
      toast.error(t('sendEmailFailed'))
    }
  }

  // 重置密码
  const handleResetPassword = async (data: ResetFormData) => {
    try {
      const response: any = await resetPasswordApi({
        code: data.code,
        mail: userEmail,
        password: data.password,
      })

      if (response.code === 0) {
        toast.success(t('resetSuccess'))
        router.push('/auth/login')
      } else {
        toast.error(response.message || t('resetFailed'))
      }
    } catch (error) {
      toast.error(t('resetFailed'))
    }
  }

  // 返回邮箱步骤
  const handleBackToEmail = () => {
    setStep('email')
    resetForm.reset()
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f8f8f7]">
      {/* 点状网格背景 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, #d1d1d1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* 左上角 Logo */}
      <div className="absolute left-6 top-6 z-20">
        <Link href="/" className="flex items-center gap-2 text-gray-800 no-underline hover:opacity-80 transition-opacity">
          <Image src={logo} alt="AiToEarn" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">AiToEarn</span>
        </Link>
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.div
              key="email"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="w-full max-w-[400px]"
            >
              {/* 中心 Logo */}
              <div className="mb-8 flex flex-col items-center">
                <Link href="/" className="mb-6 flex h-20 w-20 items-center justify-center hover:opacity-80 transition-opacity">
                  <Image src={logo} alt="AiToEarn" width={72} height={72} className="drop-shadow-md" />
                </Link>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {t('resetPassword')}
                </h1>
                <p className="mt-2 text-center text-gray-500">
                  {t('clickEmailLinkToReset')}
                </p>
              </div>

              {/* 邮箱表单 */}
              <form onSubmit={emailForm.handleSubmit(handleSendEmail)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">
                    {t('emailLabel')}
                  </label>
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    {...emailForm.register('email')}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                  />
                  {emailForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={emailForm.formState.isSubmitting}
                  className="h-12 w-full rounded-xl text-base font-medium"
                >
                  {emailForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('sendResetLink')}
                    </>
                  ) : (
                    t('sendResetLink')
                  )}
                </Button>
              </form>

              {/* 返回登录链接 */}
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
                >
                  {t('backToLogin')}
                </Link>
              </div>
            </motion.div>
          )}

          {step === 'reset' && (
            <motion.div
              key="reset"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="w-full max-w-[400px]"
            >
              {/* 返回按钮 */}
              <button
                type="button"
                onClick={handleBackToEmail}
                className="mb-6 flex cursor-pointer items-center gap-1.5 border-none bg-transparent text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">{t('backToLogin')}</span>
              </button>

              {/* 标题 */}
              <div className="mb-8 flex flex-col items-center">
                <Link href="/" className="mb-6 flex h-16 w-16 items-center justify-center hover:opacity-80 transition-opacity">
                  <Image src={logo} alt="AiToEarn" width={56} height={56} />
                </Link>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {t('resetPassword')}
                </h1>
                <p className="mt-2 text-gray-500">
                  {t('verificationCodePlaceholder')}
                </p>
              </div>

              {/* 邮箱提示 */}
              <div className="mb-6 rounded-xl bg-gray-100 p-4">
                <p className="text-sm text-gray-600">
                  {t('resetEmailSent')}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">{userEmail}</p>
              </div>

              {/* 重置密码表单 */}
              <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">
                    {t('verificationCode')}
                  </label>
                  <Input
                    type="text"
                    placeholder={t('verificationCodePlaceholder')}
                    {...resetForm.register('code')}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                  />
                  {resetForm.formState.errors.code && (
                    <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.code.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">
                    {t('newPassword')}
                  </label>
                  <Input
                    type="password"
                    placeholder={t('newPasswordPlaceholder')}
                    {...resetForm.register('password')}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                  />
                  {resetForm.formState.errors.password ? (
                    <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.password.message}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">{t('newPasswordMinLength')}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">
                    {t('confirmPassword')}
                  </label>
                  <Input
                    type="password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    {...resetForm.register('confirmPassword')}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={resetForm.formState.isSubmitting}
                  className="h-12 w-full rounded-xl text-base font-medium"
                >
                  {resetForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('confirmReset')}
                    </>
                  ) : (
                    t('confirmReset')
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

