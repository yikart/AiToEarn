import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { BilibiliOptionSchema } from './bilibili.schema'

export const BILIBILI_PUBLIC_VIDEO_ID_PATTERN = /^(?:BV[0-9A-Z]+|av\d+)$/i

export const BILIBILI_METADATA = {
  platform: AccountType.Bilibili,
  displayName: { 'en-US': 'Bilibili', 'zh-CN': '哔哩哔哩' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.Video], maxTitleLength: 79, maxBodyLength: 249, maxImages: 0, maxVideos: 1 },
  mediaRules: { imageFormats: ['jpg', 'jpeg', 'png'], videoFormats: ['mp4', 'flv'], maxImageSize: 5 * 1024 * 1024, maxVideoSize: 4 * 1024 * 1024 * 1024, maxVideoDuration: 5 * 60 * 60 },
  topic: { supported: true, nativeField: true, maxTotalLength: 199 },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Polling,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  optionSchema: BilibiliOptionSchema,
} satisfies PlatformStaticMetadata
