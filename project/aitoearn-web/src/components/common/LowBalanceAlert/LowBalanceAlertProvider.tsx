/**
 * LowBalanceAlertProvider - 余额不足提示逻辑处理组件
 *
 * 功能描述: 数据就绪后立即检查，在满足条件时弹出余额不足提示
 *
 * 触发条件：
 * 1. 用户已登录
 * 2. 余额低于阈值（0.5美元 = 50美分）
 * 3. 本次会话未点击"取消"
 * 4. 未永久禁用提示
 * 5. 不在公开页面（/pricing、/auth 等）
 */

'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAccountStore } from '@/store'
import { useSystemStore } from '@/store/system'
import { useUserStore } from '@/store/user'
import { isPublicPage } from '@/utils/route'
import { LowBalanceAlert } from './index'

// 余额阈值：0.5美元 = 50美分
const BALANCE_THRESHOLD = -1

// sessionStorage key
const SESSION_STORAGE_KEY = 'lowBalanceAlertDismissed'

export function LowBalanceAlertProvider() {
  const pathname = usePathname()

  // 本次组件生命周期内是否已弹出过，避免重复弹出
  const hasShownRef = useRef(false)

  // 从 userStore 获取状态
  const { token, creditsBalance, userHasHydrated, lang, creditsInitialized } = useUserStore(
    useShallow(state => ({
      token: state.token,
      creditsBalance: state.creditsBalance,
      userHasHydrated: state._hasHydrated,
      lang: state.lang,
      creditsInitialized: state.creditsInitialized,
    })),
  )
  const { setLowBalanceAlertOpen, lowBalanceAlertOpen } = useAccountStore(
    useShallow(state => ({
      setLowBalanceAlertOpen: state.setLowBalanceAlertOpen,
      lowBalanceAlertOpen: state.lowBalanceAlertOpen,
    })),
  )

  // 从 systemStore 获取状态
  const { disableLowBalanceAlert, systemHasHydrated, setDisableLowBalanceAlert } = useSystemStore(
    useShallow(state => ({
      disableLowBalanceAlert: state.disableLowBalanceAlert,
      systemHasHydrated: state._hasHydrated,
      setDisableLowBalanceAlert: state.setDisableLowBalanceAlert,
    })),
  )

  /**
   * 检查 sessionStorage 是否已禁用本次会话提示
   */
  const isSessionDismissed = (): boolean => {
    if (typeof window === 'undefined')
      return false
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true'
  }

  /**
   * 设置 sessionStorage 禁用本次会话提示
   */
  const setSessionDismissed = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true')
    }
  }

  /**
   * 检查是否应该显示余额不足提示
   */
  const checkShouldShowAlert = (): boolean => {
    // 未登录不提示
    if (!token) {
      return false
    }

    // 余额充足不提示
    if (creditsBalance >= BALANCE_THRESHOLD) {
      return false
    }

    // 公开页面不提示
    if (isPublicPage(pathname)) {
      return false
    }

    // 聊天页面不自动弹出（聊天页通过 ActionCard 处理余额不足）
    if (pathname.includes('/chat/')) {
      return false
    }

    // 本次会话已点击取消，不再提示
    if (isSessionDismissed()) {
      return false
    }

    // 永久禁用，不提示
    if (disableLowBalanceAlert) {
      return false
    }

    return true
  }

  // 数据就绪后立即检查余额
  useEffect(() => {
    // 等待两个 store 的持久化数据都加载完成
    if (!userHasHydrated || !systemHasHydrated) {
      return
    }

    // 等待余额数据加载完成
    if (!creditsInitialized) {
      return
    }

    // 已弹出过，不再重复弹出
    if (hasShownRef.current) {
      return
    }

    // 检查是否应该显示提示
    const shouldShowAlert = checkShouldShowAlert()

    if (shouldShowAlert) {
      hasShownRef.current = true
      // 延迟一小段时间再弹出，确保页面渲染完成
      setTimeout(() => {
        setLowBalanceAlertOpen(true)
      }, 500)
    }
  }, [pathname, userHasHydrated, systemHasHydrated, token, creditsBalance, disableLowBalanceAlert, creditsInitialized])

  /**
   * 处理关闭弹窗（点击取消或关闭按钮）
   */
  const handleClose = () => {
    setLowBalanceAlertOpen(false)
    // 设置本次会话不再提示
    setSessionDismissed()
  }

  /**
   * 处理"不再提示"
   */
  const handleNeverRemind = () => {
    setDisableLowBalanceAlert(true)
  }

  return (
    <LowBalanceAlert
      open={lowBalanceAlertOpen}
      onClose={handleClose}
      onNeverRemind={handleNeverRemind}
      lng={lang || 'en'}
    />
  )
}

export default LowBalanceAlertProvider
