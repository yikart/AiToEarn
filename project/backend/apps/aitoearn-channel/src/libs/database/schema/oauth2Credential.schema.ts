import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { BaseTemp } from './time.tamp'

// 账号状态
export enum TokenStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

@Schema({
  collection: 'oauth2Credential',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class OAuth2Credential extends BaseTemp {
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

  @Prop({
    required: false,
    type: String,
    default: '',
  })
  raw?: string
}

export const OAuth2CredentialSchema = SchemaFactory.createForClass(OAuth2Credential)
