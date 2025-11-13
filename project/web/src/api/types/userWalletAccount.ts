/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-01 19:39:02
 * @LastEditors: nevin
 * @Description: 用户钱包账户
 */
export enum WalletAccountType {
  ZFB = 'ZFB',
  WX_PAY = 'WX_PAY',
}

export interface UserWallet {
  userId: string
  balance: number
  income: number
}

export interface UserWalletAccount {
  id: string
  account: string // 账户号
  userId: string
  userName: string // 真实姓名
  cardNum: string // 身份证号
  phone: string // 绑定的手机号
  type: WalletAccountType
}

export interface CreateUserWalletAccountParams {
  account: string // 账户号
  userName: string // 真实姓名
  cardNum: string // 身份证号
  phone: string // 绑定的手机号
  type: WalletAccountType
}
