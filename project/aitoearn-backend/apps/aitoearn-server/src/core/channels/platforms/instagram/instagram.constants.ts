import type { PlatformMediaRules, PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { InstagramOptionSchema } from './instagram.schema'

export const INSTAGRAM_FEED_MEDIA_RULES: PlatformMediaRules = {
  imageFormats: ['jpg', 'jpeg'],
  videoFormats: ['mp4', 'mov'],
  maxImageSize: 8 * 1024 * 1024,
  maxVideoSize: 1024 * 1024 * 1024,
  maxVideoDuration: 900,
  aspectRatio: { min: 0.8, max: 1.91 },
}

export const INSTAGRAM_REELS_MEDIA_RULES: PlatformMediaRules = {
  imageFormats: ['jpg', 'jpeg'],
  videoFormats: ['mp4', 'mov'],
  maxImageSize: 8 * 1024 * 1024,
  maxVideoSize: 300 * 1024 * 1024,
  minVideoDuration: 3,
  maxVideoDuration: 900,
}

export const INSTAGRAM_STORY_MEDIA_RULES: PlatformMediaRules = {
  imageFormats: ['jpg', 'jpeg'],
  videoFormats: ['mp4', 'mov'],
  maxImageSize: 8 * 1024 * 1024,
  maxVideoSize: 100 * 1024 * 1024,
  minVideoDuration: 3,
  maxVideoDuration: 60,
}

export const INSTAGRAM_METADATA = {
  platform: AccountType.Instagram,
  displayName: { 'en-US': 'Instagram', 'zh-CN': 'Instagram' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video], maxBodyLength: 2200, maxImages: 10, maxVideos: 1 },
  mediaRules: INSTAGRAM_FEED_MEDIA_RULES,
  topic: { supported: true, maxCount: 30 },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Polling,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: InstagramOptionSchema,
} satisfies PlatformStaticMetadata
