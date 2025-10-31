import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Schema as MongooseSchema } from 'mongoose'

import { WithTimestampSchema } from './timestamp.schema'

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
export class Account extends WithTimestampSchema {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
    enum: AccountType,
    index: true,
  })
  type: AccountType

  @Prop({
    required: true, // 平台账户的唯一ID˝
    index: true,
  })
  uid: string

  @Prop({
    required: false, // 部分平台的补充ID
    index: true,
  })
  account: string

  @Prop({
    required: false,
    type: String,
  })
  loginCookie: string

  @Prop({
    required: false,
    type: String,
  })
  access_token: string

  @Prop({
    required: false,
    type: String,
  })
  refresh_token: string

  @Prop({
    required: false,
    type: String,
    default: '',
  })
  token: string // 其他token 目前抖音用

  @Prop({
    required: false,
    type: Date,
    index: true,
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
    default: 0,
  })
  fansCount: number

  @Prop({
    required: true,
    default: 0,
  })
  readCount: number

  @Prop({
    required: true,
    default: 0,
  })
  likeCount: number

  @Prop({
    required: true,
    default: 0,
  })
  collectCount: number

  @Prop({
    required: true,
    default: 0,
  })
  forwardCount: number

  @Prop({
    required: true,
    default: 0,
  })
  commentCount: number

  @Prop({
    required: false,
    type: Date,
  })
  lastStatsTime?: Date

  @Prop({
    required: true,
    default: 0,
  })
  workCount: number

  @Prop({
    required: true,
    default: 0,
  })
  income: number

  // 账户关联组，与 accountGroup.id 关联
  @Prop({ type: String, required: true })
  groupId: string

  @Prop({
    required: true,
    default: AccountStatus.NORMAL,
    index: true,
  })
  status: AccountStatus // 登录状态，用于判断是否失效

  @Prop({ type: String, required: false })
  channelId: string

  // 排序
  @Prop({
    required: true,
    type: Number,
    default: 1,
  })
  rank: number
}

export const AccountSchema = SchemaFactory.createForClass(Account)
AccountSchema.index({ type: 1, uid: 1 }, { unique: true })
