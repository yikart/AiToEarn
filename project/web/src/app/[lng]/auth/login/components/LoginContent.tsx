/**
 * LoginContent - 登录页面内容组件
 * 支持 Google 登录和邮箱登录/注册
 * 使用 react-hook-form + zod 进行表单校验
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleLogin } from '@react-oauth/google'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  googleLoginApi,
  GoogleLoginParams,
  loginWithMailApi,
  mailRegistApi,
} from '@/api/apiReq'
import { useTransClient } from '@/app/i18n/client'
import logo from '@/assets/images/logo.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'

// 页面步骤类型
type Step = 'login' | 'register'

// 动画配置
const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

// 表单数据类型
interface LoginFormData {
  email: string
  password: string
}

interface RegisterFormData {
  verifyCode: string
  password: string
  inviteCode?: string
}

export default function LoginContent() {
  const router = useRouter()
  const { setToken, setUserInfo } = useUserStore()
  const { t } = useTransClient('login')

  // 步骤状态
  const [step, setStep] = useState<Step>('login')
  const [userEmail, setUserEmail] = useState('')

  // 登录表单 Schema（国际化）
  const loginSchema = useMemo(() => z.object({
    email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
    password: z.string().min(1, t('passwordRequired')),
  }), [t])

  // 注册表单 Schema（国际化）
  const registerSchema = useMemo(() => z.object({
    verifyCode: z.string().length(6, t('emailCodeLength')),
    password: z.string().min(6, t('passwordMinLength')),
    inviteCode: z.string().optional(),
  }), [t])

  // 登录表单
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // 注册表单
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      verifyCode: '',
      password: '',
      inviteCode: '',
    },
  })

  // 处理邮箱登录
  const handleEmailLogin = async (data: LoginFormData) => {
    try {
      const response = await loginWithMailApi({ mail: data.email, password: data.password })
      if (!response) {
        return
      }

      if (response.code === 0) {
        if (response.data.type === 'regist') {
          // 用户未注册，切换到注册步骤
          setUserEmail(data.email)
          registerForm.setValue('password', data.password)
          setStep('register')
        } else if (response.data.token) {
          // 登录成功
          setToken(response.data.token)
          if (response.data.userInfo) {
            setUserInfo(response.data.userInfo)
          }
          toast.success(t('loginSuccess'))
          router.push('/')
        }
      } else {
        toast.error(response.message || t('loginFailed'))
      }
    } catch (error) {
      toast.error(t('loginError'))
    }
  }

  // 处理注册提交
  const handleRegisterSubmit = async (data: RegisterFormData) => {
    try {
      const response = await mailRegistApi({
        mail: userEmail,
        code: data.verifyCode,
        password: data.password,
        inviteCode: data.inviteCode || '',
      })

      if (!response) {
        toast.error(t('registerError'))
        return
      }

      if (response.code === 0 && response.data.token) {
        // 注册成功
        setToken(response.data.token)
        if (response.data.userInfo) {
          setUserInfo(response.data.userInfo)
        }
        toast.success(t('registerSuccess'))
        router.push('/')
      } else {
        toast.error(response.message || t('registerError'))
      }
    } catch (error) {
      toast.error(t('registerError'))
    }
  }

  // 处理 Google 登录成功
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const params: GoogleLoginParams = {
        clientId: credentialResponse.clientId,
        credential: credentialResponse.credential,
      }

      const response = await googleLoginApi(params)
      if (!response) {
        toast.error(t('googleLoginFailed'))
        return
      }

      if (response.code === 0 && response.data.token) {
        // Google 登录成功（无论是新用户还是老用户）
        setToken(response.data.token)
        if (response.data.userInfo) {
          setUserInfo(response.data.userInfo)
        }
        toast.success(t('loginSuccess'))
        router.push('/')
      } else {
        toast.error(response.message || t('googleLoginFailed'))
      }
    } catch (error) {
      toast.error(t('googleLoginFailed'))
    }
  }

  const handleGoogleError = () => {
    toast.error(t('googleLoginFailed'))
  }

  const handleBackToLogin = () => {
    setStep('login')
    registerForm.reset()
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
          {step === 'login' && (
            <motion.div
              key="login"
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
                  {t('welcomeBack')}
                </h1>
                <p className="mt-2 text-gray-500">
                  {t('loginSubtitle')}
                </p>
              </div>

              {/* Google 登录按钮 */}
              <div className="space-y-3">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  shape="rectangular"
                  text="continue_with"
                  locale="zh_CN"
                  size="large"
                  width="400"
                />
              </div>

              {/* 分隔线 */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-300" />
                <span className="text-sm text-gray-400">{t('or')}</span>
                <div className="h-px flex-1 bg-gray-300" />
              </div>

              {/* 邮箱登录表单 */}
              <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    {...loginForm.register('email')}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder={t('enterPassword')}
                    {...loginForm.register('password')}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="h-12 w-full rounded-xl text-base font-medium"
                >
                  {loginForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('waitingForActivation')}
                    </>
                  ) : (
                    t('login')
                  )}
                </Button>
              </form>

              {/* 忘记密码链接 */}
              <div className="mt-4 text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
            </motion.div>
          )}

          {step === 'register' && (
            <motion.div
              key="register"
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
                onClick={handleBackToLogin}
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
                  {t('completeRegistration')}
                </h1>
                <p className="mt-2 text-gray-500">
                  {t('registerSubtitle')}
                </p>
              </div>

              {/* 邮箱提示 */}
              <div className="mb-6 rounded-xl bg-gray-100 p-4">
                <p className="text-sm text-gray-600">
                  {t('activationEmailSent')}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">{userEmail}</p>
              </div>

              {/* 注册表单 */}
              <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">
                    {t('emailCode')}
                  </label>
                  <Input
                    type="text"
                    placeholder={t('enterEmailCode')}
                    maxLength={6}
                    {...registerForm.register('verifyCode', {
                      onChange: (e) => {
                        // 只允许输入数字
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      },
                    })}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-center text-xl tracking-[0.5em] placeholder:text-gray-400 placeholder:tracking-normal focus:border-gray-400 focus:ring-0"
                  />
                  {registerForm.formState.errors.verifyCode && (
                    <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.verifyCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">
                    {t('setPassword')}
                  </label>
                  <Input
                    type="password"
                    placeholder={t('enterPassword')}
                    {...registerForm.register('password')}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                  />
                  {registerForm.formState.errors.password ? (
                    <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">{t('passwordMinLength')}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">
                    {t('inviteCode')}
                  </label>
                  <Input
                    type="text"
                    placeholder={t('enterInviteCode')}
                    {...registerForm.register('inviteCode')}
                    className="h-12 rounded-xl border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  className="h-12 w-full rounded-xl text-base font-medium"
                >
                  {registerForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('registering')}
                    </>
                  ) : (
                    t('completeRegistration')
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部条款 */}
        <p className="mt-10 text-center text-xs text-gray-400">
          {t('termsText')}{' '}
          <Link href="/websit/terms-of-service" className="text-gray-500 underline hover:text-gray-700">
            {t('termsOfService')}
          </Link>
          {' '}{t('and')}{' '}
          <Link href="/websit/privacy-policy" className="text-gray-500 underline hover:text-gray-700">
            {t('privacyPolicy')}
          </Link>
        </p>
      </div>
    </div>
  )
}

