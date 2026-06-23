import type { PlatformStaticMetadata } from '../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PublishContentMode } from '../platforms.interface'
import { DouyinOptionSchema } from './douyin.schema'

export const DOUYIN_METADATA = {
  platform: AccountType.Douyin,
  displayName: { 'en-US': 'Douyin', 'zh-CN': '抖音' },
  authType: AuthType.QrCode,
  authInstructions: {
    'en-US': 'Scan the QR code with the Douyin app and complete authorization in the mini app.',
    'zh-CN': '请使用抖音 App 扫描二维码，并在小程序内完成账号授权。',
  },
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video], maxTitleLength: 30, maxBodyLength: 1000, maxTotalTextLength: 1000, maxImages: 12, maxVideos: 1 },
  mediaRules: {
    imageFormats: ['jpg', 'jpeg', 'png', 'bmp'],
    videoFormats: ['mp4', 'avi', 'mkv', 'mov'],
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxVideoDuration: 900,
  },
  topic: { supported: true, nativeField: true, maxCount: 5 },
  publishPolicy: {
    completionStrategy: CompletionStrategy.UserHandoff,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  analytics: { work: { dataSources: [ChannelWorkAnalyticsDataSource.PostInsightCrawler] } },
  optionSchema: DouyinOptionSchema,
} satisfies PlatformStaticMetadata
