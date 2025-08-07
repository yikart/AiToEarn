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
    lastStatsTime?: Date
    loginTime?: Date
  }) {
    Object.assign(this, data)
  }
}
