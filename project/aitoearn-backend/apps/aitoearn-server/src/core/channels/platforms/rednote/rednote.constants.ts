import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { RedNoteOptionSchema } from './rednote.schema'

export const REDNOTE_METADATA = {
  platform: AccountType.RedNote,
  displayName: { 'en-US': 'RedNote', 'zh-CN': '小红书' },
  authType: AuthType.Plugin,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video], maxTitleLength: 20, maxBodyLength: 1000, maxImages: 9, maxVideos: 1 },
  mediaRules: {
    imageFormats: ['jpg', 'jpeg', 'png', 'bmp', 'webp'],
    videoFormats: ['mp4', 'avi', 'mkv', 'mov', 'webm'],
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxVideoDuration: 900,
  },
  topic: { supported: true, nativeField: true, maxCount: 5 },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Sync,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: RedNoteOptionSchema,
} satisfies PlatformStaticMetadata
