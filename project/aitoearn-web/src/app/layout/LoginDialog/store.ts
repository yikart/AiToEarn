/**
 * LoginDialog Store - 全局登录弹框状态管理
 */

import { create } from 'zustand'

interface LoginDialogState {
  /** 弹框是否可见 */
  visible: boolean
  /** 登录成功后跳转 URL */
  redirectUrl?: string
  /** 邀请码 */
  inviteCode?: string
  /** 来自受保护页面守卫（关闭弹框时导航到 '/'） */
  fromGuard: boolean
  /** 打开登录弹框 */
  openLoginDialog: (options?: { redirectUrl?: string, inviteCode?: string, fromGuard?: boolean }) => void
  /** 关闭登录弹框 */
  closeLoginDialog: () => void
}

export const useLoginDialogStore = create<LoginDialogState>(set => ({
  visible: false,
  redirectUrl: undefined,
  inviteCode: undefined,
  fromGuard: false,
  openLoginDialog: options =>
    set({
      visible: true,
      redirectUrl: options?.redirectUrl,
      inviteCode: options?.inviteCode,
      fromGuard: options?.fromGuard ?? false,
    }),
  closeLoginDialog: () =>
    set({
      visible: false,
      redirectUrl: undefined,
      inviteCode: undefined,
      fromGuard: false,
    }),
}))
