/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-05-06 15:50:05
 * @LastEditors: nevin
 * @Description: 用户
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { EarnInfoStatus, UserStatus, UserVipCycleType } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserBackData {
  @Prop({
    required: false,
  })
  phone?: string

  @Prop({ required: false })
  wxOpenid?: string

  @Prop({ required: false })
  wxUnionid?: string
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserEarnInfo {
  @Prop({
    required: true,
    enum: EarnInfoStatus,
    default: EarnInfoStatus.OPEN,
  })
  status: EarnInfoStatus

  @Prop({ required: true })
  cycleInterval: number
}

// 用户会员信息
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserVipInfo {
  // 会员等级
  @Prop({
    required: true,
    enum: UserVipCycleType,
    default: UserVipCycleType.NONE,
  })
  cycleType: UserVipCycleType

  @Prop({ required: true })
  expireTime: Date

  @Prop({ required: true, default: false })
  autoContinue: boolean
}

export class UserStorage {
  @Prop({
    required: true,
    default: 500 * 1024 * 1024,
  })
  total: number // 总存储（Bytes）

  @Prop({ required: false })
  expiredAt?: Date
}

@Schema({
  collection: 'user',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class User extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    default: '',
  })
  name: string

  @Prop({
    required: false,
    index: true,
  })
  mail: string

  @Prop({
    required: false,
  })
  avatar?: string

  @Prop({
    required: false,
  })
  phone?: string

  @Prop({
    required: false,
    select: false,
  })
  password?: string

  @Prop({
    required: false,
    select: false,
  })
  salt?: string

  @Prop({
    required: true,
    enum: UserStatus,
    default: UserStatus.OPEN,
  })
  status: UserStatus

  // 是否删除
  @Prop({
    required: true,
    default: false,
    index: true,
  })
  isDelete: boolean

  @Prop({ required: false })
  wxOpenid?: string

  @Prop({ required: false })
  wxUnionid?: string

  @Prop({ required: false })
  popularizeCode?: string // 我的推广码

  @Prop({ required: false })
  inviteUserId?: string // 邀请人用户ID

  @Prop({ required: false })
  inviteCode?: string // 我填写的邀请码

  @Prop({ type: Object, required: false, default: {} })
  backData?: UserBackData

  @Prop({ type: Object, required: false, default: {} })
  earnInfo?: UserEarnInfo

  @Prop({ type: Object, required: false })
  googleAccount?: Record<string, any> // Google账号信息

  // 用户VIP会员信息
  @Prop({ type: UserVipInfo, required: false })
  vipInfo?: UserVipInfo

  @Prop({
    required: true,
    default: 0,
  })
  score: number // 积分

  @Prop({
    required: true,
    default: 0,
  })
  income: number // 收入（分）

  // 累计收入
  @Prop({
    required: true,
    default: 0,
  })
  totalIncome: number

  @Prop({
    required: true,
    default: 0,
  })
  usedStorage: number // 已用存储（Bytes）

  @Prop({ type: UserStorage, required: true, default: {
    total: 500 * 1024 * 1024,
  } })
  storage: UserStorage
}

export const UserSchema = SchemaFactory.createForClass(User)
