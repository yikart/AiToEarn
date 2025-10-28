import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/aitoearn-server-client'
import { BaseTemp } from './time.tamp'

// 账号状态
export enum TokenStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

@Schema({
  collection: 'oauth2Crendential',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class OAuth2Crendential extends BaseTemp {
  @Prop({
    required: true,
    type: String,
  })
  accountId: string

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
  accessToken: string

  @Prop({
    required: true,
    type: String,
    default: '',
  })
  refreshToken: string

  @Prop({
    required: true,
    type: Number,
  })
  accessTokenExpiresAt: number

  @Prop({
    required: false,
    type: Number,
  })
  refreshTokenExpiresAt?: number
}

export const OAuth2CrendentialSchema = SchemaFactory.createForClass(OAuth2Crendential)
