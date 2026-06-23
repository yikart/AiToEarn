import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { TiktokOptionSchema } from './tiktok.schema'

export const TIKTOK_METADATA = {
  platform: AccountType.TikTok,
  displayName: { 'en-US': 'TikTok', 'zh-CN': 'TikTok' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video], maxBodyLength: 2200, maxTotalTextLength: 2200, maxImages: 35, maxVideos: 1 },
  mediaRules: {
    imageFormats: ['jpg', 'jpeg', 'webp'],
    videoFormats: ['mp4', 'mov', 'webm'],
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 4 * 1024 * 1024 * 1024,
    maxVideoDuration: 600,
  },
  topic: { supported: true },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Polling,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: TiktokOptionSchema,
} satisfies PlatformStaticMetadata
