/**
 * 登录跳转工具函数
 */

import { useLoginDialogStore } from '@/app/layout/LoginDialog/store'

/**
 * 打开全局登录弹框
 * @param redirect 登录成功后的重定向 URL
 */
export function navigateToLogin(redirect?: string) {
  useLoginDialogStore.getState().openLoginDialog({ redirectUrl: redirect })
}
