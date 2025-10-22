import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountStatus, AccountType } from '..'
import { WithTimestampSchema } from './timestamp.schema'
import { UserPortrait } from './user-portrait.schema'

@Schema({
  collection: 'accountPortraits',
  versionKey: false,
  timestamps: true,
})
export class AccountPortrait extends WithTimestampSchema {
  id: string

  @Prop({ required: true })
  accountId: string

  @Prop({ required: true })
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
    required: false,
  })
  avatar?: string

  @Prop({
    required: false,
  })
  nickname?: string

  @Prop({
    required: true,
    default: AccountStatus.NORMAL,
  })
  status: AccountStatus // 登录状态，用于判断是否失效

  @Prop({ type: Object, default: {} })
  contentTags: Record<string, number>

  @Prop({ required: true, default: 0 })
  totalFollowers: number

  @Prop({ required: true, default: 0 })
  totalWorks: number

  @Prop({ required: true, default: 0 })
  totalViews: number

  @Prop({ required: true, default: 0 })
  totalLikes: number

  @Prop({ required: true, default: 0 })
  totalCollects: number

  @Prop({ required: true, type: Object, default: {} })
  userPortrait: UserPortrait // 用户画像数据
}

export const AccountPortraitSchema = SchemaFactory.createForClass(AccountPortrait)

// AccountPortraitSchema.index({ accountId: 1 }, { unique: true })
AccountPortraitSchema.index({ totalFollowers: -1 })
AccountPortraitSchema.index({ contentTags: 1 })
AccountPortraitSchema.index({ type: 1, uid: 1 }, { unique: true })
