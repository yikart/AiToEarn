import { AccountType } from '../account/common'

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
