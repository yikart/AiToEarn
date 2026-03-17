import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../channel-db.constants'
import { AccountStatus } from '../enums'
import { BaseTemp } from './time.tamp'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'account' })
export class Account extends BaseTemp {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({
    required: false,
    type: String,
  })
  userId?: string

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
