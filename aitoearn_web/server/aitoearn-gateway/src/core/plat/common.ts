import { YoutubePublishOption } from '@transports/plat/youtube.common'
import { BilibiliPublishOption } from 'src/transports/channel/bilibili.common'
import { AccountType } from '@/transports/account/comment'
import { FacebookPostOptions, InstagramPostOptions, ThreadsPostOptions } from '@/transports/channel/meta.common'
import { WxGzhPublishOption } from '@/transports/channel/wxGzh.common'

export interface PlatOptions {
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

export interface NewPublishData<T extends PlatOptions> {
  readonly flowId: string
  readonly accountId: string
  readonly type: PublishType
  readonly title: string
  readonly desc: string
  readonly videoUrl?: string
  readonly coverUrl?: string
  readonly imgList?: string[]
  topics?: string[]
  readonly publishTime?: Date
  readonly option?: T
}

export interface NewPublishRecordData {
  userId: string
  readonly flowId?: string
  type: PublishType
  title?: string
  desc?: string // 主要内容
  readonly accountId: string
  topics: string[]
  accountType: AccountType
  uid: string
  videoUrl?: string
  coverUrl?: string
  imgUrlList?: string[]
  publishTime: Date
  readonly imgList?: string[]
  errorMsg?: string
  option: any
}
