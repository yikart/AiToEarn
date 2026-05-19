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
  /** 当前环境是否禁用手动登录 */
  manualLoginDisabled: boolean
  /** 禁用手动登录提示触发计数 */
  manualLoginDisabledNoticeSeq: number
  /** 打开登录弹框 */
  openLoginDialog: (options?: { redirectUrl?: string, inviteCode?: string, fromGuard?: boolean }) => void
  /** 关闭登录弹框 */
  closeLoginDialog: () => void
  /** 设置是否禁用手动登录 */
  setManualLoginDisabled: (disabled: boolean) => void
  /** 触发禁用手动登录提示 */
  requestManualLoginDisabledNotice: () => void
}

export const useLoginDialogStore = create<LoginDialogState>(set => ({
  visible: false,
  redirectUrl: undefined,
  inviteCode: undefined,
  fromGuard: false,
  manualLoginDisabled: false,
  manualLoginDisabledNoticeSeq: 0,
  openLoginDialog: options =>
    set((state) => {
      if (state.manualLoginDisabled) {
        return {
          visible: false,
          redirectUrl: undefined,
          inviteCode: undefined,
          fromGuard: false,
          manualLoginDisabledNoticeSeq: state.manualLoginDisabledNoticeSeq + 1,
        }
      }

      return {
        visible: true,
        redirectUrl: options?.redirectUrl,
        inviteCode: options?.inviteCode,
        fromGuard: options?.fromGuard ?? false,
      }
    }),
  closeLoginDialog: () =>
    set({
      visible: false,
      redirectUrl: undefined,
      inviteCode: undefined,
      fromGuard: false,
    }),
  setManualLoginDisabled: disabled =>
    set({
      manualLoginDisabled: disabled,
      ...(disabled
        ? {
            visible: false,
            redirectUrl: undefined,
            inviteCode: undefined,
            fromGuard: false,
          }
        : {}),
    }),
  requestManualLoginDisabledNotice: () =>
    set(state => ({
      visible: false,
      redirectUrl: undefined,
      inviteCode: undefined,
      fromGuard: false,
      manualLoginDisabledNoticeSeq: state.manualLoginDisabledNoticeSeq + 1,
    })),
}))
