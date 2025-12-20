/**
 * GlobalLoginModal - 全局登录弹窗
 * 使用全局 store 管理状态，放在根布局中
 */

'use client'

import { LoginModal } from '../LoginModal'

export function GlobalLoginModal() {
  return <LoginModal useGlobalStore />
}

export default GlobalLoginModal

