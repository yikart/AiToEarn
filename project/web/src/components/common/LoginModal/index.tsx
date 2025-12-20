/**
 * LoginModal - 登录弹窗组件
 * 支持 Google 登录和邮箱登录/注册
 * 移动端友好：底部抽屉式弹出
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleLogin } from '@react-oauth/google'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
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
import { useLoginModalStore } from '@/store/loginModal'
import { cn } from '@/lib/utils'

export interface ILoginModalProps {
  /** 是否打开（可选，不传则使用全局 store） */
  open?: boolean
  /** 关闭回调（可选，不传则使用全局 store） */
  onClose?: () => void
  /** 登录成功回调（可选，不传则使用全局 store） */
  onSuccess?: () => void
  /** 是否使用全局 store 管理状态 */
  useGlobalStore?: boolean
}

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

export function LoginModal({ 
  open: propOpen, 
  onClose: propOnClose, 
  onSuccess: propOnSuccess,
  useGlobalStore = false,
}: ILoginModalProps) {
  const { setToken, setUserInfo } = useUserStore()
  const { t } = useTransClient('login')
  
  // 全局 store 状态
  const { 
    isOpen: globalOpen, 
    closeLoginModal: globalClose, 
    handleLoginSuccess: globalHandleSuccess,
  } = useLoginModalStore()
  
  // 根据 useGlobalStore 决定使用哪个状态源
  const isOpen = useGlobalStore ? globalOpen : (propOpen ?? false)
  const handleClose = useGlobalStore ? globalClose : (propOnClose ?? (() => {}))
  const handleSuccess = useGlobalStore ? globalHandleSuccess : (propOnSuccess ?? (() => {}))

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

  // 重置状态当弹窗关闭时
  useEffect(() => {
    if (!isOpen) {
      setStep('login')
      setUserEmail('')
      loginForm.reset()
      registerForm.reset()
    }
  }, [isOpen, loginForm, registerForm])

  // 登录成功后的处理
  const onLoginSuccess = (token: string, userInfo?: any) => {
    setToken(token)
    if (userInfo) {
      setUserInfo(userInfo)
    }
    toast.success(t('loginSuccess'))
    handleClose()
    handleSuccess()
  }

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
          onLoginSuccess(response.data.token, response.data.userInfo)
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
        onLoginSuccess(response.data.token, response.data.userInfo)
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
        // Google 登录成功
        onLoginSuccess(response.data.token, response.data.userInfo)
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

  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 弹窗内容 - 移动端底部抽屉，桌面端居中 */}
      <div className={cn(
        'fixed z-50 bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden',
        // 移动端：底部全宽抽屉
        'inset-x-0 bottom-0 max-h-[90vh]',
        // 桌面端：居中弹窗
        'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
        'sm:w-full sm:max-w-[420px] sm:max-h-[85vh]',
      )}>
        {/* 移动端拖拽指示条 */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* 内容区域 - 可滚动 */}
        <div className="overflow-y-auto max-h-[calc(90vh-20px)] sm:max-h-[85vh] p-6 pt-4 sm:pt-6">
          <AnimatePresence mode="wait">
            {step === 'login' && (
              <motion.div
                key="login"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                {/* Logo 和标题 */}
                <div className="mb-6 flex flex-col items-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center">
                    <Image src={logo} alt="AiToEarn" width={56} height={56} className="drop-shadow-md" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {t('welcomeBack')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('loginSubtitle')}
                  </p>
                </div>

                {/* Google 登录按钮 */}
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    shape="rectangular"
                    text="continue_with"
                    locale="zh_CN"
                    size="large"
                    width="320"
                  />
                </div>

                {/* 分隔线 */}
                <div className="my-5 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground/70">{t('or')}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* 邮箱登录表单 */}
                <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-3">
                  <div>
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      {...loginForm.register('email')}
                      className="h-11 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      type="password"
                      placeholder={t('enterPassword')}
                      {...loginForm.register('password')}
                      className="h-11 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loginForm.formState.isSubmitting}
                    className="h-11 w-full rounded-xl text-base font-medium"
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
                    onClick={handleClose}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>

                {/* 条款 */}
                <p className="mt-5 text-center text-xs text-muted-foreground/70">
                  {t('termsText')}{' '}
                  <Link href="/websit/terms-of-service" onClick={handleClose} className="text-muted-foreground underline hover:text-foreground">
                    {t('termsOfService')}
                  </Link>
                  {' '}{t('and')}{' '}
                  <Link href="/websit/privacy-policy" onClick={handleClose} className="text-muted-foreground underline hover:text-foreground">
                    {t('privacyPolicy')}
                  </Link>
                </p>
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
              >
                {/* 返回按钮 */}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="mb-4 flex cursor-pointer items-center gap-1.5 border-none bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">{t('backToLogin')}</span>
                </button>

                {/* 标题 */}
                <div className="mb-5 flex flex-col items-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center">
                    <Image src={logo} alt="AiToEarn" width={48} height={48} />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {t('completeRegistration')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('registerSubtitle')}
                  </p>
                </div>

                {/* 邮箱提示 */}
                <div className="mb-5 rounded-xl bg-accent p-3">
                  <p className="text-sm text-muted-foreground">
                    {t('activationEmailSent')}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{userEmail}</p>
                </div>

                {/* 注册表单 */}
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">
                      {t('emailCode')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('enterEmailCode')}
                      maxLength={6}
                      {...registerForm.register('verifyCode', {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        },
                      })}
                      className="h-11 rounded-xl border-input bg-background px-4 text-center text-xl tracking-[0.5em] placeholder:text-muted-foreground/70 placeholder:tracking-normal focus:border-ring focus:ring-0"
                    />
                    {registerForm.formState.errors.verifyCode && (
                      <p className="mt-1 text-xs text-destructive">{registerForm.formState.errors.verifyCode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">
                      {t('setPassword')}
                    </label>
                    <Input
                      type="password"
                      placeholder={t('enterPassword')}
                      {...registerForm.register('password')}
                      className="h-11 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
                    />
                    {registerForm.formState.errors.password ? (
                      <p className="mt-1 text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground/70">{t('passwordMinLength')}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">
                      {t('inviteCode')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('enterInviteCode')}
                      {...registerForm.register('inviteCode')}
                      className="h-11 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={registerForm.formState.isSubmitting}
                    className="h-11 w-full rounded-xl text-base font-medium"
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
        </div>
      </div>
    </>
  )
}

export default LoginModal

