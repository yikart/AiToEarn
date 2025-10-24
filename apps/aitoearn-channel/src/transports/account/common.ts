// 平台类型
export enum AccountType {
  Douyin = 'douyin', // 抖音
  Xhs = 'xhs', // 小红书
  WxSph = 'wxSph', // 微信视频号
  KWAI = 'KWAI', // 快手
  YOUTUBE = 'youtube', // youtube
  WxGzh = 'wxGzh', // 微信公众号
  BILIBILI = 'bilibili', // B站
  TWITTER = 'twitter', // twitter
  TIKTOK = 'tiktok', // tiktok
  FACEBOOK = 'facebook', // facebook
  INSTAGRAM = 'instagram', // instagram
  THREADS = 'threads', // threads
  PINTEREST = 'pinterest',
  LINKEDIN = 'linkedin', // linkedin
}

export enum AccountStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

export interface Account {
  id: string
  userId: string
  type: AccountType
  uid: string
  account: string
  loginCookie: string
  access_token?: string
  refresh_token?: string
  loginTime?: Date
  avatar: string
  nickname: string
  status: AccountStatus // 登录状态，用于判断是否失效
  channelId?: string
}

export class NewAccount implements Partial<Account> {
  constructor(data: {
    userId: string
    type: AccountType
    uid: string
    account: string
    loginCookie?: string
    access_token?: string
    refresh_token?: string
    token?: string
    avatar: string
    nickname: string
    lastStatsTime?: Date
    loginTime?: Date
    channelId?: string
    status?: AccountStatus
    groupId?: string
  }) {
    Object.assign(this, data)
  }
}

export interface UpdateAccountStatisticsData {
  workCount?: number
  fansCount?: number
  readCount?: number
  likeCount?: number
  collectCount?: number
  commentCount?: number
  income?: number
}

export enum PublishType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article',
}

export enum PublishStatus {
  FAILED = -1, // 发布失败
  WaitingForPublish = 0, // 未发布
  PUBLISHED = 1, // 已发布
  PUBLISHING = 2, // 发布中
}

export interface PublishRecord {
  _id: string
  id: string
  userId: string
  flowId?: string // 前端传入的流水ID
  userTaskId?: string // 用户任务ID
  taskMaterialId?: string // 任务素材ID
  taskId?: string // 任务ID
  type: PublishType
  title?: string
  desc?: string // 主要内容
  accountId: string
  topics: string[]
  accountType: AccountType
  uid: string
  videoUrl?: string
  coverUrl?: string
  imgUrlList?: string[]
  publishTime: Date
  status: PublishStatus
  errorMsg?: string
  queueId?: string
  inQueue: boolean
  option?: any
  dataId: string // 微信公众号-publish_id
  workLink?: string // 作品链接
  dataOption?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
