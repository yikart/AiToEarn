/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-04-27 12:11:39
 * @LastEditors: nevin
 * @Description: 用户钱包账户
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseTemp } from './time.tamp'

export enum WalletAccountType {
  ZFB = 'ZFB',
  WX_PAY = 'WX_PAY',
}

@Schema({
  collection: 'userWalletAccount',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class UserWalletAccount extends BaseTemp {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  userName: string // 真实姓名

  @Prop({
    required: false,
  })
  account?: string // 账号

  @Prop({
    required: true,
  })
  cardNum: string // 身份证号

  @Prop({
    required: true,
  })
  phone: string // 绑定的手机号

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
