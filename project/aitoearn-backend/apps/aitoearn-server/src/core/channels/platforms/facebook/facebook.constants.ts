import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { FacebookOptionSchema } from './facebook.schema'

export const FACEBOOK_METADATA = {
  platform: AccountType.Facebook,
  displayName: { 'en-US': 'Facebook', 'zh-CN': 'Facebook' },
  authType: AuthType.OAuth2,
  emptyAccountHint: {
    title: {
      'en-US': 'No Facebook Page found',
      'zh-CN': '未找到 Facebook 公共主页',
    },
    description: {
      'en-US': 'Create a Facebook Page first, or make sure this Facebook account has access to a Page, then authorize again.',
      'zh-CN': '请先创建 Facebook 公共主页，或确认当前 Facebook 账号拥有公共主页访问权限后重新授权。',
    },
    action: {
      label: {
        'en-US': 'Create Facebook Page',
        'zh-CN': '创建 Facebook 公共主页',
      },
      url: 'https://www.facebook.com/pages/create',
    },
  },
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.Text, PublishContentMode.ImageText, PublishContentMode.Video], maxBodyLength: 63206, maxImages: 10, maxVideos: 1 },
  mediaRules: { imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'], videoFormats: ['mp4', 'mov', 'avi'], maxImageSize: 10 * 1024 * 1024, maxVideoSize: 1024 * 1024 * 1024, maxVideoDuration: 90 },
  topic: { supported: false },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Sync,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: FacebookOptionSchema,
} satisfies PlatformStaticMetadata
