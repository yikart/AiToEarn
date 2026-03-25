/**
 * Consolidated type definitions for the channel module.
 * Migrated from transports/channel/ common files.
 */

// From transports/channel/common.ts
// NOTE: PublishType, PublishStatus, PublishRecord already exist in @yikart/mongodb - NOT duplicated
export enum PublishingChannel {
  INTERNAL = 'internal', // 通过我们内部系统发布的
  NATIVE = 'native', // 平台原生端发布的
}

// From transports/channel/api/bilibili.common.ts
export enum VideoUTypes {
  Little = 0,
  Big = 1,
}

export interface BClient {
  clientName: string
  clientId: string
  clientSecret: string
  authBackUrl: string
}

export enum NoReprint {
  No = 1,
  Yes = 0,
}

export enum Copyright {
  Original = 1, // 原创
  Reprint = 2,
}

export interface BilibiliPublishOption {
  tid: number // 分区ID，由获取分区信息接口得到
  no_reprint?: NoReprint // 是否允许转载 0-允许，1-不允许。默认0
  copyright: Copyright // 1-原创，2-转载(转载时source必填)
  source?: string // 如果copyright为转载，则此字段表示转载来源
  topic_id?: number // 参加的话题ID，默认情况下不填写，需要填写和运营联系
}

export type AddArchiveData = {
  title: string // 标题
  cover?: string // 封面url
  desc?: string // 描述
} & BilibiliPublishOption

export enum ArchiveStatus {
  all = 'all',
  is_pubing = 'is_pubing',
  pubed = 'pubed',
  not_pubed = 'not_pubed',
}

export interface AccessToken {
  access_token: string // 'd30bedaa4d8eb3128cf35ddc1030e27d';
  expires_in: number // 1630220614;
  refresh_token: string // 'WxFDKwqScZIQDm4iWmKDvetyFugM6HkX';
  scopes: string[] // ['USER_INFO', 'ATC_DATA', 'ATC_BASE'];
}

// From transports/channel/api/meta.common.ts
export interface FacebookPostOptions {
  content_category: string
  content_tags?: string[]
  custom_labels?: string[]
  direct_share_status?: number
  embeddable?: boolean
}

export interface ProductTag {
  product_id: string
  x: number
  y: number
}

export interface UserTag {
  username: string
  x: number
  y: number
}

export interface InstagramPostOptions {
  content_category: string
  alt_text?: string
  caption?: string
  collaborators?: string[]
  cover_url?: string
  image_url?: string
  location_id?: string
  product_tags?: ProductTag[]
  user_tags?: UserTag[]
}

export interface ThreadsPostOptions {
  reply_control?: string
  location_id?: string
  allowlisted_country_codes?: string[]
  alt_text?: string
  auto_publish_text?: boolean
  topic_tags?: string
}

export interface TiktokPostOptions {
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'
  disable_duet?: boolean
  disable_stitch?: boolean
  disable_comment?: boolean
  brand_organic_toggle?: boolean
  brand_content_toggle?: boolean
}

// From transports/channel/api/wx-gzh.common.ts
export interface WxGzhPublishOption {
  tid: number // 分区ID，由获取分区信息接口得到
}

// From transports/channel/api/youtube.common.ts
export interface YoutubePublishOption {
  privacyStatus?: string // 隐私状态
  tag?: string // 标签, 多个标签用英文逗号分隔，总长度小于200
  categoryId?: string // 分类id
  publishAt?: string // 定时发布
}

// From transports/channel/api/common.ts
export enum FeedbackType {
  errReport = 'errReport', // 错误反馈
  feedback = 'feedback', // 反馈
  msgReport = 'msgReport', // 消息举报
  msgFeedback = 'msgFeedback', // 消息反馈
}

export interface Feedback {
  id: string
  userId: string
  userName: string
  content: string
  type: FeedbackType
  tagList: string[]
  fileUrlList: string[]
  createAt: Date
  updatedAt: Date
}

export interface CreateFeedback {
  userId: string
  userName: string
  content: string
  type?: FeedbackType
  tagList?: string[]
  fileUrlList?: string[]
}

export interface ChannelAccountDataCube {
  // 粉丝数
  fensNum?: number
  // 播放量
  playNum?: number
  // 评论数
  commentNum?: number
  // 点赞数
  likeNum?: number
  // 分享数
  shareNum?: number
  // 收藏数
  collectNum?: number
  // 稿件数量
  arcNum?: number
}

// 增量数据:分7天新增或30天新增
export interface ChannelAccountDataBulk extends ChannelAccountDataCube {
  // 每天
  list: ChannelAccountDataCube[]
}

export interface ChannelArcDataCube {
  // 粉丝数
  fensNum?: number
  // 播放量
  playNum?: number
  // 评论数
  commentNum?: number
  // 点赞数
  likeNum?: number
  // 分享数
  shareNum?: number
  // 收藏数
  collectNum?: number
}

// 增量数据:分7天新增或30天新增
export interface ChannelArcDataBulk extends ChannelAccountDataCube {
  recordId: string
  dataId: string

  // 每天
  list: ChannelArcDataCube[]
}
export enum DouyinDownloadType {
  Allow = 1,
  Disallow = 2,
}

export enum DouyinPrivateStatus {
  All = 0,
  Self = 1,
  Friend = 2,
}
