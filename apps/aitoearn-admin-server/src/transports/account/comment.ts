export enum AccountType {
  Douyin = 'douyin', // 抖音
  Xhs = 'xhs', // 小红书
  WxSph = 'wxSph', // 微信视频号
  KWAI = 'KWAI', // 快手
  YOUTUBE = 'youtube', // youtube
  WxGzh = 'wxGzh', // 微信公众号
  BILIBILI = 'bilibili', // B站
}

export enum AccountStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

export interface Account {
  id: number
  userId: string
  type: AccountType
  uid: string
  account: string
  loginCookie: string
  token: string // 其他token 目前抖音用
  loginTime?: Date
  avatar: string
  nickname: string
  fansCount: number
  readCount: number
  likeCount: number
  collectCount: number
  forwardCount: number
  commentCount: number
  lastStatsTime?: Date
  workCount: number
  income: number
  groupId: string
  status: AccountStatus // 登录状态，用于判断是否失效
}

export interface AccountGroup {
  id: string
  userId: string
  isDefault: boolean
  name: string
  rank: number
  createAt: Date
  updatedAt: Date
}

export class NewAccount implements Partial<Account> {
  constructor(data: {
    userId: string
    type: AccountType
    uid: string
    account?: string // 部分平台的补充ID
    loginCookie?: string
    access_token?: string
    refresh_token?: string
    token?: string
    avatar: string
    nickname: string
  }) {
    Object.assign(this, data)
  }
}

export interface AccountFilter {
  readonly userId?: string
}
