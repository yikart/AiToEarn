import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { LinkedInOptionSchema } from './linkedin.schema'

export const LINKEDIN_METADATA = {
  platform: AccountType.LinkedIn,
  displayName: { 'en-US': 'LinkedIn', 'zh-CN': 'LinkedIn' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.Text, PublishContentMode.ImageText, PublishContentMode.Video], maxTitleLength: 200, maxBodyLength: 3000, maxImages: 9, maxVideos: 1 },
  mediaRules: {
    imageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    videoFormats: ['mp4'],
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 200 * 1024 * 1024,
    maxVideoDuration: 600,
  },
  topic: { supported: false },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Sync,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  optionSchema: LinkedInOptionSchema,
} satisfies PlatformStaticMetadata
