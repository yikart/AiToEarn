/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-04-27 12:11:39
 * @LastEditors: nevin
 * @Description: 用户钱包账户
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WalletAccountType } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'userWalletAccount',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class UserWalletAccount extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: false,
  })
  mail?: string // 邮箱

  @Prop({
    required: false,
  })
  userName?: string // 真实姓名

  @Prop({
    required: true,
  })
  account: string // 账号

  @Prop({
    required: false,
  })
  cardNum?: string // 身份证号

  @Prop({
    required: false,
  })
  phone?: string // 绑定的手机号

  @Prop({
    required: true,
    enum: WalletAccountType,
  })
  type: WalletAccountType

  @Prop({
    required: true,
    default: false,
  })
  isDef: boolean // 是否默认
}

export const UserWalletAccountSchema
  = SchemaFactory.createForClass(UserWalletAccount)

UserWalletAccountSchema.index({ userId: 1, type: 1, account: 1 }, { unique: true })
