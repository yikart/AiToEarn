import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { VipStatus } from '@yikart/common'
import { EarnInfoStatus, UserStatus } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserAiItemInfo {
  @Prop({ required: true })
  defaultModel: string

  @Prop({
    required: false,
    default: {},
    type: Object,
  })
  option?: Record<string, any>
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserAiInfo {
  @Prop({
    required: false,
    type: UserAiItemInfo,
  })
  image?: UserAiItemInfo

  @Prop({
    required: false,
    type: UserAiItemInfo,
  })
  edit?: UserAiItemInfo

  @Prop({
    required: false,
    type: UserAiItemInfo,
  })
  video?: UserAiItemInfo

  @Prop({
    required: false,
    type: UserAiItemInfo,
  })
  agent?: UserAiItemInfo
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

// User VIP Info
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserVipInfo {
  @Prop({ required: true })
  expireTime: Date

  @Prop({
    required: true,
    enum: VipStatus,
    default: VipStatus.none,
  })
  status: VipStatus

  // Start Time
  @Prop({ required: true })
  startTime: Date
}

export class UserStorage {
  @Prop({
    required: true,
    default: 500 * 1024 * 1024,
  })
  total: number // Total Storage (Bytes)

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

  // Is Deleted
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
  popularizeCode?: string // My Promotion Code

  @Prop({ required: false })
  inviteUserId?: string // Inviter User ID

  @Prop({ required: false })
  inviteCode?: string // Invite Code Entered

  @Prop({ type: Object, required: false, default: {} })
  backData?: UserBackData

  @Prop({ type: Object, required: false, default: {} })
  earnInfo?: UserEarnInfo

  @Prop({ type: Object, required: false })
  googleAccount?: Record<string, unknown> // Google Account Info

  @Prop({ type: UserVipInfo, required: false })
  vipInfo?: UserVipInfo

  @Prop({
    required: true,
    default: 0,
  })
  score: number // Score

  @Prop({
    required: true,
    default: 0,
  })
  income: number // Income (cents)

  @Prop({
    required: true,
    default: 0,
  })
  totalIncome: number

  @Prop({
    required: true,
    default: 0,
  })
  incomeUSD: number // Income (USD cents)

  @Prop({
    required: true,
    default: 0,
  })
  totalIncomeUSD: number // Total Income (USD cents)

  @Prop({
    required: true,
    default: 0,
  })
  usedStorage: number // Used Storage (Bytes)

  @Prop({
    type: UserStorage,
    required: true,
    default: {
      total: 500 * 1024 * 1024,
    },
  })
  storage: UserStorage

  @Prop({
    required: false,
    default: 0,
  })
  tenDayExpPoint: number

  @Prop({
    required: false,
    type: UserAiInfo,
  })
  aiInfo?: UserAiInfo
}

export const UserSchema = SchemaFactory.createForClass(User)
