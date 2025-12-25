/**
 * 登录弹窗全局状态管理
 * 用于在任何地方触发登录弹窗
 */

import { create } from 'zustand'

export interface ILoginModalStore {
  /** 弹窗是否打开 */
  isOpen: boolean
  /** 登录成功后的回调 */
  onSuccessCallback: (() => void) | null
  /** 打开登录弹窗 */
  openLoginModal: (onSuccess?: () => void) => void
  /** 关闭登录弹窗 */
  closeLoginModal: () => void
  /** 触发成功回调并关闭 */
  handleLoginSuccess: () => void
}

export const useLoginModalStore = create<ILoginModalStore>((set, get) => ({
  isOpen: false,
  onSuccessCallback: null,

  openLoginModal: (onSuccess?: () => void) => {
    set({
      isOpen: true,
      onSuccessCallback: onSuccess || null,
    })
  },

  closeLoginModal: () => {
    set({
      isOpen: false,
      onSuccessCallback: null,
    })
  },

  handleLoginSuccess: () => {
    const { onSuccessCallback } = get()
    if (onSuccessCallback) {
      onSuccessCallback()
    }
    set({
      isOpen: false,
      onSuccessCallback: null,
    })
  },
}))

/**
 * 便捷方法：打开登录弹窗
 * 可以在非 React 组件中使用
 */
export function openLoginModal(onSuccess?: () => void) {
  useLoginModalStore.getState().openLoginModal(onSuccess)
}

/**
 * 便捷方法：关闭登录弹窗
 */
export function closeLoginModal() {
  useLoginModalStore.getState().closeLoginModal()
}



