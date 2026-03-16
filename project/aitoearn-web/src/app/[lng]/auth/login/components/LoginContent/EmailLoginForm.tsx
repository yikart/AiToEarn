/**
 * EmailLoginForm - 邮箱验证码登录表单（国外环境）
 * 支持 Google 登录 + 邮箱验证码登录
 */

'use client'

import type { GoogleLoginParams } from '@/api/apiReq'
import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleLogin } from '@react-oauth/google'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { googleLoginApi } from '@/api/apiReq'
import { emailCodeLoginApi, sendEmailCodeApi } from '@/api/auth'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'

import { useCountdown } from './useCountdown'

interface EmailLoginFormProps {
  /** 弹框模式：登录成功回调，替代 router.push */
  onLoginSuccess?: () => void
  /** 覆盖 searchParams 的 redirect */
  redirectUrl?: string
  /** 覆盖 searchParams 的 inviteCode */
  inviteCode?: string
}

interface EmailLoginFormData {
  email: string
  code: string
}

export function EmailLoginForm({ onLoginSuccess, redirectUrl, inviteCode: inviteCodeProp }: EmailLoginFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = redirectUrl ?? searchParams.get('redirect')
  const { setToken, setUserInfo } = useUserStore()
  const { t, i18n } = useTransClient('login')
  const { countdown, isCounting, start: startCountdown } = useCountdown()
  const [sendingCode, setSendingCode] = useState(false)
  const googleContainerRef = useRef<HTMLDivElement>(null)
  const [googleBtnWidth, setGoogleBtnWidth] = useState(0)

  useEffect(() => {
    const el = googleContainerRef.current
    if (!el)
      return

    const observer = new ResizeObserver(() => {
      const w = el.offsetWidth
      if (w > 0)
        setGoogleBtnWidth(Math.min(w, 400))
    })
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
        code: z.string().min(1, t('emailCodeRequired')).length(6, t('emailCodeLength')),
      }),
    [t],
  )

  const form = useForm<EmailLoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', code: '' },
  })

  /** 发送邮箱验证码 */
  const handleSendCode = async () => {
    const email = form.getValues('email')
    const result = await form.trigger('email')
    if (!result)
      return

    setSendingCode(true)
    try {
      const res = await sendEmailCodeApi({ mail: email })
      if (res?.code === 0) {
        toast.success(t('codeSentSuccess'))
        startCountdown()
      }
      else {
        toast.error(res?.message || t('codeSendFailed'))
      }
    }
    catch {
      toast.error(t('codeSendFailed'))
    }
    finally {
      setSendingCode(false)
    }
  }

  /** 邮箱验证码登录 */
  const handleSubmit = async (data: EmailLoginFormData) => {
    try {
      const inviteCode = inviteCodeProp ?? searchParams.get('inviteCode') ?? undefined
      const res = await emailCodeLoginApi({ mail: data.email, code: data.code, inviteCode })
      if (!res)
        return

      if (res.code === 0 && res.data.token) {
        setToken(res.data.token)
        if (res.data.userInfo) {
          setUserInfo(res.data.userInfo)
        }
        toast.success(t('loginSuccess'))
        if (onLoginSuccess) {
          onLoginSuccess()
        }
        else {
          router.push(redirect || '/')
        }
      }
      else {
        toast.error(res.message || t('loginFailed'))
      }
    }
    catch {
      toast.error(t('loginError'))
    }
  }

  /** Google 登录成功 */
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const params: GoogleLoginParams = {
        clientId: credentialResponse.clientId,
        credential: credentialResponse.credential,
      }
      const res = await googleLoginApi(params)
      if (!res) {
        toast.error(t('googleLoginFailed'))
        return
      }
      if (res.code === 0 && res.data.token) {
        setToken(res.data.token)
        if (res.data.userInfo) {
          setUserInfo(res.data.userInfo)
        }
        toast.success(t('loginSuccess'))
        if (onLoginSuccess) {
          onLoginSuccess()
        }
        else {
          router.push(redirect || '/')
        }
      }
      else {
        toast.error(res.message || t('googleLoginFailed'))
      }
    }
    catch {
      toast.error(t('googleLoginFailed'))
    }
  }

  return (
    <>
      {/* Google 登录 */}
      <div ref={googleContainerRef} className="space-y-3">
        {googleBtnWidth > 0 && (
          <GoogleLogin
            key={`${i18n.language}-${googleBtnWidth}`}
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error(t('googleLoginFailed'))}
            useOneTap={false}
            theme="outline"
            shape="rectangular"
            text="continue_with"
            locale={i18n.language.replace('-', '_')}
            size="large"
            width={String(googleBtnWidth)}
          />
        )}
      </div>

      {/* 分隔线 */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground/70">{t('or')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 邮箱验证码表单 */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder={t('emailPlaceholder')}
            {...form.register('email')}
            className="h-12 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder={t('enterCode')}
              {...form.register('code')}
              className="h-12 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
            />
            {form.formState.errors.code && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isCounting || sendingCode}
            onClick={handleSendCode}
            className="h-12 shrink-0 cursor-pointer rounded-xl px-4"
          >
            {sendingCode ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCounting ? (
              `${countdown}s`
            ) : (
              t('sendCode')
            )}
          </Button>
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full cursor-pointer rounded-xl text-base font-medium"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            t('login')
          )}
        </Button>
      </form>
    </>
  )
}
