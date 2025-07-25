import { YoutubePublishOption } from '@transports/plat/youtube.common'
import { BilibiliPublishOption } from 'src/transports/channel/bilibili.common'
import { FacebookPostOptions, InstagramPostOptions, ThreadsPostOptions } from '@/transports/channel/meta.common'
import { WxGzhPublishOption } from '@/transports/channel/wxGzh.common'

export interface PlatOptons {
  bilibili?: BilibiliPublishOption
  youtube?: YoutubePublishOption
  wxGzh?: WxGzhPublishOption
  facebook?: FacebookPostOptions
  threads?: ThreadsPostOptions
  instagram?: InstagramPostOptions
}

export enum PublishType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article', // 文章
}

export interface NewPublishData<T extends PlatOptons> {
  readonly flowId: string
  readonly accountId: string
  readonly type: PublishType
  readonly title: string
  readonly desc: string
  readonly videoUrl?: string
  readonly coverUrl?: string
  readonly imgList?: string[]
  readonly publishTime?: Date
  readonly option?: T
}
