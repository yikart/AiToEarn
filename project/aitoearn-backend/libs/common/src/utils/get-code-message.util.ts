import type { Locale } from '../i18n/messages'
import { ResponseCode } from '../enums/response-code.enum'
import { messages } from '../i18n/messages'

export function getCodeMessage(code: ResponseCode, data?: unknown, locale: Locale = 'en-US'): string {
  const codeMessages = messages[code]
  if (!codeMessages) {
    return locale === 'zh-CN' ? '未知错误' : 'Unknown error'
  }

  const message = codeMessages[locale] || codeMessages['en-US']

  if (typeof message === 'string') {
    return message
  }

  try {
    return message(data)
  }
  catch (e) {
    return locale === 'zh-CN' ? `消息渲染失败: ${e}` : `Message render failed: ${e}`
  }
}
