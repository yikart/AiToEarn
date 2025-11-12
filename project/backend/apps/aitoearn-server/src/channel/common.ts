import { AccountType } from '@yikart/common'
import { AccountStatus, PublishType } from '@yikart/mongodb'
import { BilibiliPublishOption } from '../transports/channel/api/bilibili.common'
import { FacebookPostOptions, InstagramPostOptions, ThreadsPostOptions } from '../transports/channel/api/meta.common'
import { WxGzhPublishOption } from '../transports/channel/api/wxGzh.common'
import { YoutubePublishOption } from '../transports/channel/api/youtube.common'

export interface AccountPortraitReportData {
  accountId?: string
  userId?: string
  type: AccountType
  uid: string // 频道平台唯一ID
  avatar?: string
  nickname?: string
  status?: AccountStatus
  contentTags?: Record<string, number>
  totalFollowers?: number
  totalWorks?: number
  totalViews?: number
  totalLikes?: number
  totalCollects?: number
  countryCode?: string
}

export interface PlatOptions {
  bilibili?: BilibiliPublishOption
  youtube?: YoutubePublishOption
  wxGzh?: WxGzhPublishOption
  facebook?: FacebookPostOptions
  threads?: ThreadsPostOptions
  instagram?: InstagramPostOptions
}

export interface NewPublishData<T extends PlatOptions> {
  readonly flowId?: string
  readonly accountId: string
  readonly type: PublishType
  readonly title?: string
  readonly desc?: string
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
  taskId?: string
  userTaskId?: string
  taskMaterialId?: string
  coverUrl?: string
  imgUrlList?: string[]
  publishTime: Date
  readonly imgList?: string[]
  errorMsg?: string
  workLink?: string // 作品链接
  option: any
}
