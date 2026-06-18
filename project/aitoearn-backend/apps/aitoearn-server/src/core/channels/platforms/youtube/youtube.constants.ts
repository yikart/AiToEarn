import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { YoutubeOptionSchema } from './youtube.schema'

export const YOUTUBE_METADATA = {
  platform: AccountType.YouTube,
  displayName: { 'en-US': 'YouTube', 'zh-CN': 'YouTube' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.Video], maxTitleLength: 100, maxBodyLength: 5000, maxImages: 0, maxVideos: 1 },
  mediaRules: { videoFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv'], maxVideoSize: 256 * 1024 * 1024 * 1024, maxVideoDuration: 43200 },
  topic: { supported: true, nativeField: true, maxTotalLength: 500 },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Sync,
    scheduleByPlatform: false,
    updateSupported: true,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: YoutubeOptionSchema,
} satisfies PlatformStaticMetadata
