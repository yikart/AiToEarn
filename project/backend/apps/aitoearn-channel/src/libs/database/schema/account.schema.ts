import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Schema as MongooseSchema } from 'mongoose'
import { BaseTemp } from './time.tamp'

export enum AccountStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

@Schema({
  collection: 'account',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Account extends BaseTemp {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({
    required: true,
    type: String,
  })
  userId: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  type: AccountType

  @Prop({
    required: true, // 平台账户的唯一ID
  })
  uid: string

  @Prop({
    required: false, // 部分平台的补充ID
  })
  account: string

  @Prop({
    required: false,
    type: Date,
  })
  loginTime?: Date

  @Prop({
    required: false,
  })
  avatar?: string

  @Prop({
    required: true,
  })
  nickname: string

  @Prop({
    required: true,
    default: AccountStatus.NORMAL,
  })
  status: AccountStatus // 登录状态，用于判断是否失效
}

export const AccountSchema = SchemaFactory.createForClass(Account)
AccountSchema.index({ type: 1, uid: 1 }, { unique: true })
