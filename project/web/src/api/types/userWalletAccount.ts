// 旧类型（保留兼容）
export type WalletType = 'ZFB' | 'WX_PAY'

export interface UserWalletAccountCreateDto {
  userId: string
  mail: string // email
  userName?: string
  account: string
  cardNum?: string
  phone?: string
  type: WalletType
}

export interface UserWalletAccount extends UserWalletAccountCreateDto {
  _id: string
  createdAt?: string
  updatedAt?: string
}

// 新API类型
export enum WalletAccountType {
  Alipay = 'alipay',
  StripeConnect = 'stripe_connect',
  WechatPay = 'wechat_pay',
}

export interface WalletAccountRequest {
  account?: string
  email?: string
  idCard?: string
  isDefault?: boolean
  phone?: string
  stripeConnectedAccountId?: string
  type: WalletAccountType
  userName?: string
  [property: string]: any
}

export interface WalletAccountUpdateRequest {
  email?: string
  idCard?: string
  phone?: string
  userName?: string
  [property: string]: any
}

export interface WalletAccount {
  id: string
  userId: string
  type: WalletAccountType
  account: string
  userName?: string
  phone?: string
  email?: string
  idCard?: string
  stripeConnectedAccountId?: string
  isDefault: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface WalletAccountListRequest {
  page?: number
  pageSize?: number
  type?: WalletAccountType
  [property: string]: any
}

export interface WalletAccountListResponse {
  page: number
  pageSize: number
  totalPages: number
  total: number
  list: WalletAccount[]
}
