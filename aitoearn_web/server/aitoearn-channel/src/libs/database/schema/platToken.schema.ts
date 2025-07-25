import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@transports/account/common'
import { BaseTemp } from './time.tamp'

// 账号状态
export enum TokenStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

@Schema({
  collection: 'accountToken',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class PlatToken extends BaseTemp {
  @Prop({
    required: true,
    type: String,
  })
  userId: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  platform: AccountType

  @Prop({
    required: true,
    type: String,
    default: '',
  })
  refreshToken: string

  @Prop({
    required: true,
    // unique: true,
    type: String,
  })
  accountId: string

  @Prop({
    required: true,
    default: TokenStatus.NORMAL,
  })
  status: TokenStatus

  @Prop({
    required: false,
    type: Date,
  })
  expiresAt?: Date
}

export const PlatTokenSchema = SchemaFactory.createForClass(PlatToken)
