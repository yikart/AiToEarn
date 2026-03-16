/**
 * PhoneLoginForm - 手机号验证码登录表单（国内环境）
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { phoneCodeLoginApi, sendPhoneCodeApi } from '@/api/auth'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'

import { useCountdown } from './useCountdown'

interface PhoneLoginFormProps {
  /** 弹框模式：登录成功回调，替代 router.push */
  onLoginSuccess?: () => void
  /** 覆盖 searchParams 的 redirect */
  redirectUrl?: string
  /** 覆盖 searchParams 的 inviteCode */
  inviteCode?: string
}

interface PhoneLoginFormData {
  phone: string
  code: string
}

export function PhoneLoginForm({ onLoginSuccess, redirectUrl, inviteCode: _inviteCodeProp }: PhoneLoginFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = redirectUrl ?? searchParams.get('redirect')
  const { setToken, setUserInfo } = useUserStore()
  const { t } = useTransClient('login')
  const { countdown, isCounting, start: startCountdown } = useCountdown()
  const [sendingCode, setSendingCode] = useState(false)

  const schema = useMemo(
    () =>
      z.object({
        phone: z
          .string()
          .min(1, t('phoneRequired'))
          .regex(/^1[3-9]\d{9}$/, t('phoneInvalid')),
        code: z.string().min(1, t('emailCodeRequired')).length(6, t('codeLength')),
      }),
    [t],
  )

  const form = useForm<PhoneLoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', code: '' },
  })

  /** 发送手机验证码 */
  const handleSendCode = async () => {
    const result = await form.trigger('phone')
    if (!result)
      return

    const phone = form.getValues('phone')
    setSendingCode(true)
    try {
      const res = await sendPhoneCodeApi({ phone })
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

  /** 手机验证码登录 */
  const handleSubmit = async (data: PhoneLoginFormData) => {
    try {
      const res = await phoneCodeLoginApi({ phone: data.phone, code: data.code })
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

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div>
        <div className="flex">
          <span className="inline-flex h-12 items-center rounded-l-xl border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            +86
          </span>
          <Input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder={t('phonePlaceholder')}
            {...form.register('phone')}
            className="h-12 rounded-l-none rounded-r-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
          />
        </div>
        {form.formState.errors.phone && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.phone.message}
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
  )
}
