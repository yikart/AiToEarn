import type { PlatformStaticMetadata } from '../../platforms.interface'
import { AccountType } from '@yikart/common'
import { AuthType, CompletionStrategy, EditorType, PublishContentMode } from '../../platforms.interface'
import { WeChatChannelsOptionSchema } from './wechat-channels.schema'

export const WECHAT_CHANNELS_METADATA = {
  platform: AccountType.WeChatChannels,
  displayName: { 'en-US': 'WeChat Channels', 'zh-CN': '微信视频号' },
  authType: AuthType.Plugin,
  editor: EditorType.Text,
  contentLimits: { modes: [PublishContentMode.Video], maxTitleLength: 16, maxBodyLength: 1000, maxImages: 9, maxVideos: 1 },
  mediaRules: {
    imageFormats: ['jpg', 'jpeg', 'png', 'bmp'],
    videoFormats: ['mp4', 'avi', 'mkv', 'mov', 'flv', 'rmvb', 'wmv', 'webm'],
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxVideoDuration: 3600,
  },
  topic: { supported: true, nativeField: true },
  publishPolicy: {
    completionStrategy: CompletionStrategy.Polling,
    scheduleByPlatform: false,
    updateSupported: false,
  },
  optionSchema: WeChatChannelsOptionSchema,
} satisfies PlatformStaticMetadata
