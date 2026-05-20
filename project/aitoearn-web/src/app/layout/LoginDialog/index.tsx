/**
 * LoginDialog - 全局登录弹框组件
 * 在当前页面弹出登录表单，避免跳转到独立登录页
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useCallback } from 'react'
import { useShallow } from 'zustand/shallow'

import { LoginMethodForm } from '@/app/[lng]/auth/login/components/LoginContent/LoginMethodForm'
import { useTransClient } from '@/app/i18n/client'
import { BrandWordmark } from '@/components/Brand/BrandWordmark'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import { useLoginDialogStore } from './store'

export default function LoginDialog() {
  const { visible } = useLoginDialogStore(
    useShallow(state => ({ visible: state.visible })),
  )

  if (!visible)
    return null

  return <LoginDialogContent />
}

const LoginDialogContent = memo(() => {
  const router = useRouter()
  const { t } = useTransClient('login')
  const isMobile = useIsMobile()
  const { redirectUrl, inviteCode, fromGuard, closeLoginDialog } = useLoginDialogStore(
    useShallow(state => ({
      redirectUrl: state.redirectUrl,
      inviteCode: state.inviteCode,
      fromGuard: state.fromGuard,
      closeLoginDialog: state.closeLoginDialog,
    })),
  )

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeLoginDialog()
    }
  }, [closeLoginDialog])

  const handleLoginSuccess = useCallback(() => {
    closeLoginDialog()
    if (fromGuard) {
      window.location.reload()
    }
    else if (redirectUrl) {
      router.push(redirectUrl)
    }
  }, [closeLoginDialog, fromGuard, redirectUrl, router])

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          isMobile
            ? 'fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none w-full max-w-none data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100'
            : 'sm:w-[min(460px,95vw)]',
        )}
      >
        <DialogTitle className="sr-only">{t('welcomeBack')}</DialogTitle>

        {/* Logo + 标题 */}
        <div className="flex flex-col items-center pb-2 pt-2">
          <BrandWordmark className="mb-4" direction="stack" markSize={56} showTagline size="md" />
          <h2 className="text-xl font-semibold text-foreground">{t('welcomeBack')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('loginSubtitle')}</p>
        </div>

        {/* 登录表单 */}
        <div className="px-2">
          <LoginMethodForm
            onLoginSuccess={handleLoginSuccess}
            redirectUrl={redirectUrl}
            inviteCode={inviteCode}
          />
        </div>

        {/* 底部条款 */}
        <p className="pb-2 text-center text-xs text-muted-foreground/70">
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
      </DialogContent>
    </Dialog>
  )
})

LoginDialogContent.displayName = 'LoginDialogContent'
