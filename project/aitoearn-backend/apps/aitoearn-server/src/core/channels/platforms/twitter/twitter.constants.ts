import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { TwitterOptionSchema } from './twitter.schema'

export const TWITTER_METADATA = {
  platform: AccountType.Twitter,
  displayName: { 'en-US': 'Twitter (X)', 'zh-CN': 'Twitter（X）' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.Text, PublishContentMode.ImageText, PublishContentMode.Video], maxTitleLength: 0, maxBodyLength: 280, maxTotalTextLength: 280, maxImages: 4, maxVideos: 1 },
  mediaRules: {
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    videoFormats: ['mp4', 'mov'],
    maxImageSize: 5 * 1024 * 1024,
    maxVideoSize: 512 * 1024 * 1024,
    maxVideoDuration: 140,
  },
  topic: { supported: true },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Sync,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: TwitterOptionSchema,
} satisfies PlatformStaticMetadata
