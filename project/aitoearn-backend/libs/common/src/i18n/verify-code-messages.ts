import type { Locale } from './messages'

const verifyCodeMessages: Record<string, Record<Locale, string>> = {
  DRAFT_SIMILARITY_LOW: {
    'en-US': 'The submitted work does not match the draft content. Please verify consistency.',
    'zh-CN': '提交的作品与草稿内容不一致，请注意核实。',
  },
  WORK_PUBLISH_TIME_EXPIRED: {
    'en-US': 'The work publish time has exceeded the allowed limit (must be within 31 days).',
    'zh-CN': '作品发布时间超过限制（必须在 31 天内），请核实。',
  },
}

export function resolveVerifyCodeMessage(
  verifyCode: string,
  locale: Locale,
): string | undefined {
  const messages = verifyCodeMessages[verifyCode]
  if (!messages) {
    return undefined
  }
  return messages[locale] ?? messages['en-US']
}
