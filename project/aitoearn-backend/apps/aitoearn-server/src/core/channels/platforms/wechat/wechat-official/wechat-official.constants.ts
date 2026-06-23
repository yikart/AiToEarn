import type { PlatformStaticMetadata } from '../../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, CompletionStrategy, EditorType, PublishContentMode } from '../../platforms.interface'
import { WeChatOfficialOptionSchema } from './wechat-official.schema'

export const WECHAT_OFFICIAL_METADATA = {
  platform: AccountType.WeChatOfficial,
  displayName: { 'en-US': 'WeChat Official', 'zh-CN': '微信公众号' },
  authType: AuthType.OAuth2,
  editor: EditorType.Html,
  contentLimits: { modes: [PublishContentMode.ImageText], maxTitleLength: 64, maxBodyLength: 20000, maxImages: 20 },
  mediaRules: {
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
    maxImageSize: 10 * 1024 * 1024,
  },
  topic: { supported: false },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Polling,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  optionSchema: WeChatOfficialOptionSchema,
} satisfies PlatformStaticMetadata
