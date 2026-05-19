import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { VipStatus, VipTier } from '@yikart/common'
import { UserStatus } from '../enums'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
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

// User VIP Info
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserVipInfo {
  @Prop({
    required: true,
    enum: VipTier,
  })
  tier: VipTier

  @Prop({ required: true })
  expireAt: Date

  @Prop({
    required: true,
    enum: VipStatus,
    default: VipStatus.Active,
  })
  status: VipStatus

  @Prop({ required: true })
  startAt: Date
}

@Schema({ _id: false })
export class UserLocation {
  @Prop({ type: Number, required: false })
  lat?: number // 纬度

  @Prop({ type: Number, required: false })
  lng?: number // 经度

  @Prop({ type: String, required: false })
  country?: string // 国家名称

  @Prop({ type: String, required: false })
  countryCode?: string // 国家代码

  @Prop({ type: String, required: false })
  city?: string // 城市名称

  @Prop({ type: String, required: false })
  cityCode?: string // 城市代码

  @Prop({ type: String, required: false })
  district?: string // 区/县名称

  @Prop({ type: String, required: false })
  districtCode?: string // 区/县代码
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

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'user' })
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
    index: true,
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

  @Prop({ required: false, index: true })
  douyinUnionid?: string // 抖音UnionID

  @Prop({ required: false, index: true })
  douyinMiniAppOpenid?: string // 抖音小程序OpenID

  @Prop({ type: Object, required: false, default: {} })
  backData?: UserBackData

  @Prop({ type: Object, required: false })
  googleAccount?: Record<string, unknown> // Google Account Info

  @Prop({ type: UserVipInfo, required: false })
  vipInfo?: UserVipInfo

  @Prop({
    required: true,
    default: 0,
  })
  usedStorage: number // 已用存储（Bytes）

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
    type: UserAiInfo,
  })
  aiInfo?: UserAiInfo

  @Prop({ required: false, type: UserLocation })
  location?: UserLocation // 用户位置信息

  @Prop({ type: String, required: false, default: 'en-US' })
  locale?: string // 用户语言偏好 (en-US | zh-CN)

  @Prop({ required: false, index: true })
  placeId?: string

  @Prop({ required: false, index: true })
  libraryId?: string
}

export const UserSchema = SchemaFactory.createForClass(User)
