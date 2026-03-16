/**
 * AuthRedirect - Auth 页面重定向组件
 * 已登录用户重定向到首页 /
 * 未登录用户重定向到首页 / 并弹出登录弹框
 */

'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useLoginDialogStore } from '@/app/layout/LoginDialog/store'
import { useUserStore } from '@/store/user'

export default function AuthRedirect() {
  const token = useUserStore(state => state.token)
  const router = useRouter()

  useEffect(() => {
    if (token) {
      router.replace('/')
    }
    else {
      router.replace('/')
      useLoginDialogStore.getState().openLoginDialog()
    }
  }, [token, router])

  return null
}
