import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { z } from 'zod'
import { AuthType, EditorType } from '../platforms.interface'

export const GOOGLE_BUSINESS_METADATA = {
  platform: AccountType.GoogleBusiness,
  displayName: { 'en-US': 'Google Business', 'zh-CN': 'Google 商家' },
  authType: AuthType.OAuth2,
  editor: EditorType.None,
  contentLimits: { modes: [] },
  mediaRules: {},
  topic: { supported: false },
  optionSchema: z.object({}),
} satisfies PlatformStaticMetadata
