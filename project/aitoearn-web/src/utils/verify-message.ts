import type { TFunction } from 'i18next'

/**
 * 根据 verifyCode + verifyParams 解析多语言审核消息
 * 优先使用 verifyCode 查 i18n 模板，兜底显示 rejectionReason 原文
 */
export function resolveVerifyMessage(
  t: TFunction,
  verifyCode?: string,
  verifyParams?: Record<string, unknown>,
  rejectionReason?: string,
): string | null {
  if (verifyCode) {
    const key = `verifyCode.${verifyCode}`
    const message = t(key, verifyParams as Record<string, string>)
    if (message !== key) {
      return message
    }
  }

  if (rejectionReason) {
    return rejectionReason
  }

  return null
}
