import { AccountType } from '@yikart/common'
import { AccountStatus, PublishType } from '@yikart/mongodb'
import {
  BilibiliPublishOption,
  FacebookPostOptions,
  InstagramPostOptions,
  ThreadsPostOptions,
  WxGzhPublishOption,
  YoutubePublishOption,
} from './channel.interfaces'

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
  readonly userTaskId?: string
  readonly accountType: AccountType
  readonly type: PublishType
  readonly title?: string
  readonly desc?: string
  readonly videoUrl?: string
  readonly coverUrl?: string
  readonly imgUrlList?: string[]
  topics?: string[]
  readonly publishTime?: Date
  readonly option?: T
}
