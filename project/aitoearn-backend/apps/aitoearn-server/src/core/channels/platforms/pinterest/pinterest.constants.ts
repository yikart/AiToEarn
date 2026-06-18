import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { PinterestOptionSchema } from './pinterest.schema'

export const PINTEREST_METADATA = {
  platform: AccountType.Pinterest,
  displayName: { 'en-US': 'Pinterest', 'zh-CN': 'Pinterest' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video], maxTitleLength: 100, maxBodyLength: 800, maxImages: 1, maxVideos: 1 },
  mediaRules: {
    imageFormats: ['bmp', 'jpg', 'jpeg', 'png', 'tiff', 'webp'],
    videoFormats: ['mp4', 'm4v', 'mov'],
    maxImageSize: 20 * 1024 * 1024,
    maxVideoDuration: 300,
  },
  topic: { supported: false },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Sync,
    scheduleByPlatform: false,
    updateSupported: true,
  },
  optionSchema: PinterestOptionSchema,
} satisfies PlatformStaticMetadata
