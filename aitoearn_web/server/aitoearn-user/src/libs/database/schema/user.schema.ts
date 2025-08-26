/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2025-05-06 15:50:05
 * @LastEditors: nevin
 * @Description: 用户
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseTemp } from './time.tamp'

export enum UserStatus {
  STOP = 0,
  OPEN = 1,
  DELETE = -1,
}

export enum EarnInfoStatus {
  CLOSE = 0,
  OPEN = 1,
}

export enum GenderEnum {
  MALE = 1, // 男
  FEMALE = 2, // 女
}

// 会员周期类型
export enum UserVipCycleType {
  NONE = 0, // 未认证
  MONTH = 1, // 月
  YEAR = 2, // 年
  EXPERIENCE = 3, // 体验
}

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
}

@Schema({
  collection: 'user',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class User extends BaseTemp {
  id: string

  @Prop({
    required: true,
    default: '',
  })
  name: string

  @Prop({
    required: false,
    index: true,
    unique: true,
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
  score: number // 积分字段
}

export const UserSchema = SchemaFactory.createForClass(User)
