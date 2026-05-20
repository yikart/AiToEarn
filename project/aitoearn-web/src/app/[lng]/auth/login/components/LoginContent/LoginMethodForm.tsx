'use client'

import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import { EmailLoginForm } from './EmailLoginForm'
import { PhoneLoginForm } from './PhoneLoginForm'

interface LoginMethodFormProps {
  inviteCode?: string
  onLoginSuccess?: () => void
  redirectUrl?: string
}

type LoginMethod = 'phone' | 'email'

export function LoginMethodForm({ inviteCode, onLoginSuccess, redirectUrl }: LoginMethodFormProps) {
  const { t } = useTransClient('login')
  const [method, setMethod] = useState<LoginMethod>('phone')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
        {(['phone', 'email'] as const).map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setMethod(item)}
            className={cn(
              'h-10 rounded-lg text-sm font-medium transition-colors',
              method === item
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item === 'phone' ? t('phoneLogin') : t('emailLogin')}
          </button>
        ))}
      </div>

      {method === 'phone'
        ? <PhoneLoginForm onLoginSuccess={onLoginSuccess} redirectUrl={redirectUrl} />
        : <EmailLoginForm inviteCode={inviteCode} onLoginSuccess={onLoginSuccess} redirectUrl={redirectUrl} />}
    </div>
  )
}
