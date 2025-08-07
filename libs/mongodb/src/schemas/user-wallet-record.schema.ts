/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-03-24 21:44:35
 * @LastEditors: nevin
 * @Description: 钱包收支记录
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Decimal128 } from 'mongodb'
import { Types } from 'mongoose'
import { WithTimestampSchema } from './timestamp.schema'
import { UserWalletAccount } from './user-wallet-account.schema'

export enum UserWalletRecordType {
  TASK_COMMISSION = 'TASK_COMMISSION', // 任务佣金
  WITHDRAW = 'WITHDRAW', // 提现
}

export enum UserWalletRecordStatus {
  FAIL = -1,
  WAIT = 0,
  SUCCESS = 1,
}
@Schema({
  collection: 'userWalletRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class UserWalletRecord extends WithTimestampSchema {
  id: string

  @Prop({
    index: true,
    required: true,
  })
  userId: string

  @Prop({
    type: Types.ObjectId,
    ref: UserWalletAccount.name,
    required: true,
  })
  account: Types.ObjectId

  @Prop({
    index: true,
    required: false,
  })
  dataId?: string // 关联数据的ID

  @Prop({
    index: true,
    required: true,
    enum: UserWalletRecordType,
  })
  type: UserWalletRecordType

  @Prop({
    index: true,
    type: Decimal128,
    required: true,
    default: 0,
  })
  balance: Decimal128

  // 状态 -1 失败 0 等待 1 完成
  @Prop({
    index: true,
    required: true,
    default: UserWalletRecordStatus.WAIT,
  })
  status: UserWalletRecordStatus

  @Prop({
    required: false,
  })
  payTime?: Date

  @Prop({
    required: false,
  })
  des?: string

  @Prop({
    required: false,
  })
  imgUrl?: string // 反馈截图
}

export const UserWalletRecordSchema
  = SchemaFactory.createForClass(UserWalletRecord)
