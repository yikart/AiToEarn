import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { WithTimestampSchema } from './timestamp.schema'

export enum AccountStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

export enum JobTaskStatus {
  Pending = 'pending',
  Running = 'running',
  Success = 'success',
  Failed = 'failed',
}

@Schema({
  collection: 'account',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Account extends WithTimestampSchema {
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
    required: true, // 平台账户的唯一ID˝
  })
  uid: string

  @Prop({
    required: false, // 部分平台的补充ID
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
  })
  loginTime?: Date

  @Prop({
    required: true,
  })
  avatar: string

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
  })
  status: AccountStatus // 登录状态，用于判断是否失效
}

export const AccountSchema = SchemaFactory.createForClass(Account)

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class NewChannel {
  id: string

  @Prop({
    required: false,
    type: String,
  })
  userId: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  type: AccountType

  @Prop({
    required: true, // 平台账户的唯一ID˝
  })
  uid: string

  @Prop({
    required: false, // 部分平台的补充ID
  })
  accountId: string

  @Prop({
    required: false,
  })
  avatar: string

  @Prop({
    required: false,
  })
  nickname: string

  @Prop({
    required: true,
    enum: JobTaskStatus,
    default: JobTaskStatus.Pending,
  })
  status: JobTaskStatus
}

export const NewChannelSchema = SchemaFactory.createForClass(NewChannel)

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class ChannelCookie {
  id: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  platform: AccountType

  @Prop({
    required: true,
  })
  res: Array<{ cookie: string }>
}

export const ChannelCookieSchema = SchemaFactory.createForClass(ChannelCookie)

@Schema({
  versionKey: false,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class ChannelsCrawl extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  platform: AccountType

  @Prop({
    required: true,
  })
  uid: string

  @Prop({
    required: true,
    enum: JobTaskStatus,
    default: JobTaskStatus.Pending,
  })
  status: JobTaskStatus
}

export const ChannelsCrawlSchema = SchemaFactory.createForClass(ChannelsCrawl)

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class AuthorDatas extends WithTimestampSchema {
  id: string

  @Prop({
    required: false,
  })
  uid: string

  @Prop({
    required: false,
  })
  userId: string

  @Prop({
    required: false,
  })
  accountId: string

  @Prop({
    required: false,
  })
  platform: string

  @Prop({
    required: false,
  })
  gender: string

  @Prop({
    required: false,
  })
  desc: string

  @Prop({
    required: true,
    default: 0,
  })
  followerCount: number

  @Prop({
    required: true,
    default: 0,
  })
  followingCount: number

  @Prop({
    required: true,
    default: 0,
  })
  viewCount: number

  @Prop({
    required: true,
    default: 0,
  })
  likeCount: number

  @Prop({
    required: true,
    default: 0,
  })
  favoriteCount: number

  @Prop({
    required: true,
    default: 0,
  })
  shareCount: number

  @Prop({
    required: true,
    default: 0,
  })
  commentCount: number

  @Prop({
    required: false,
    type: Date,
  })
  snapshotDate?: Date

  @Prop({
    required: false,
    type: Date,
  })
  businessDate?: Date

  @Prop({
    required: true,
    default: 0,
  })
  postCount: number
}

export const AuthorDatasSchema = SchemaFactory.createForClass(AuthorDatas)
