/*
 * @Author: nevin
 * @Date: 2025-03-02 21:06:59
 * @LastEditTime: 2025-03-02 22:12:36
 * @LastEditors: nevin
 * @Description: 财务相关
 */
import type { UserWalletAccount } from './userWalletAccount'

export enum UserWalletRecordType {
  TASK_COMMISSION = 'TASK_COMMISSION', // 任务佣金
  WITHDRAW = 'WITHDRAW', // 提现
}

export enum UserWalletRecordStatus {
  FAIL = -1,
  WAIT = 0,
  SUCCESS = 1,
}

export interface UserWalletRecord {
  id: string
  userId: string
  account: UserWalletAccount
  dataId: string // 关联数据的ID
  type: UserWalletRecordType
  balance: number
  status: UserWalletRecordStatus
  payTime?: string
  des?: string
  imgUrl?: string // 反馈截图
  createdAt: string
  updatedAt: string
}
