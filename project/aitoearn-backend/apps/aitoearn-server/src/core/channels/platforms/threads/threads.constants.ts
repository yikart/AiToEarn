import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { ThreadsOptionSchema } from './threads.schema'

export const THREADS_METADATA = {
  platform: AccountType.Threads,
  displayName: { 'en-US': 'Threads', 'zh-CN': 'Threads' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.Text, PublishContentMode.ImageText, PublishContentMode.Video], maxBodyLength: 500, maxTotalTextLength: 500, maxImages: 10, maxVideos: 1 },
  mediaRules: { imageFormats: ['jpg', 'jpeg', 'png'], videoFormats: ['mp4', 'mov'], maxImageSize: 8 * 1024 * 1024, maxVideoSize: 1024 * 1024 * 1024, maxVideoDuration: 300 },
  topic: { supported: true, nativeField: true, maxCount: 1 },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Polling,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: ThreadsOptionSchema,
} satisfies PlatformStaticMetadata
