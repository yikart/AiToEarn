'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { passwordLoginApi, passwordRegisterApi } from '@/api/auth'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'

interface PasswordLoginFormProps {
  onLoginSuccess?: () => void
  redirectUrl?: string
  inviteCode?: string
}

interface PasswordLoginFormData {
  account: string
  password: string
}

type AuthMode = 'login' | 'register'

const phonePattern = /^1[3-9]\d{9}$/

function isValidAccount(value: string): boolean {
  return phonePattern.test(value) || z.string().email().safeParse(value).success
}

export function PasswordLoginForm({ onLoginSuccess, redirectUrl, inviteCode: inviteCodeProp }: PasswordLoginFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = redirectUrl ?? searchParams.get('redirect')
  const inviteCode = inviteCodeProp ?? searchParams.get('inviteCode') ?? undefined
  const { setToken, setUserInfo } = useUserStore()
  const { t } = useTransClient('login')
  const [mode, setMode] = useState<AuthMode>('login')

  const schema = useMemo(
    () =>
      z.object({
        account: z
          .string()
          .trim()
          .min(1, t('accountRequired'))
          .refine(isValidAccount, t('accountInvalid')),
        password: z.string().min(6, t('passwordLength')).max(64, t('passwordLength')),
      }),
    [t],
  )

  const form = useForm<PasswordLoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: { account: '', password: '' },
  })

  const submitLabel = mode === 'login' ? t('login') : t('createAccount')

  const handleSubmit = async (data: PasswordLoginFormData) => {
    try {
      const params = {
        account: data.account.trim(),
        password: data.password,
        ...(mode === 'register' && inviteCode ? { inviteCode } : {}),
      }
      const res = mode === 'login'
        ? await passwordLoginApi(params)
        : await passwordRegisterApi(params)

      if (!res)
        return

      if (res.code === 0 && res.data.token) {
        setToken(res.data.token)
        if (res.data.userInfo) {
          setUserInfo(res.data.userInfo)
        }
        toast.success(mode === 'login' ? t('loginSuccess') : t('registerSuccess'))
        if (onLoginSuccess) {
          onLoginSuccess()
        }
        else {
          router.push(redirect || '/')
        }
      }
      else {
        toast.error(res.message || (mode === 'login' ? t('loginFailed') : t('registerFailed')))
      }
    }
    catch {
      toast.error(mode === 'login' ? t('loginError') : t('registerError'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
        {(['login', 'register'] as const).map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              'h-10 rounded-lg text-sm font-medium transition-colors',
              mode === item
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item === 'login' ? t('passwordLogin') : t('passwordRegister')}
          </button>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <Input
            type="text"
            autoComplete="username"
            placeholder={t('accountPlaceholder')}
            {...form.register('account')}
            className="h-12 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
          />
          {form.formState.errors.account && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.account.message}
            </p>
          )}
        </div>

        <div>
          <Input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={t('passwordPlaceholder')}
            {...form.register('password')}
            className="h-12 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
          />
          {form.formState.errors.password && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full cursor-pointer rounded-xl text-base font-medium"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </div>
  )
}
