import { z } from 'zod'
import { getLocale } from '../interceptors/request-context.interceptor'

const i18nObjectSchema = z.object({
  'en-US': z.string(),
  'zh-CN': z.string(),
})

export type I18nObject = z.infer<typeof i18nObjectSchema>

export function zodI18nString() {
  return i18nObjectSchema.transform((obj) => {
    const locale = getLocale()
    return obj[locale] || obj['en-US']
  })
}
