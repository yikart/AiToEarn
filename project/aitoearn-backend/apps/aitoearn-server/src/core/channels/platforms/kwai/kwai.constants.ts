import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { KwaiOptionSchema } from './kwai.schema'

export enum KwaiOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export enum KwaiPublishResultStatus {
  Published = 200,
  Processing = 202,
}

export const KWAI_METADATA = {
  platform: AccountType.Kwai,
  displayName: { 'en-US': 'Kwai', 'zh-CN': '快手' },
  authType: AuthType.OAuth2,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.Video], maxTitleLength: 30, maxBodyLength: 1000, maxTotalTextLength: 1000, maxImages: 0, maxVideos: 1 },
  mediaRules: {
    imageFormats: ['jpg', 'jpeg', 'png', 'bmp', 'webp'],
    videoFormats: ['mp4', 'avi', 'mkv', 'mov', 'webm'],
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxVideoDuration: 1800,
  },
  // 产品兜底：未找到快手官方 topic 数量文档。
  topic: { supported: true, maxCount: 4 },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Polling,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: KwaiOptionSchema,
} satisfies PlatformStaticMetadata
