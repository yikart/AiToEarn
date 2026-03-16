import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'oauth2Credential' })
export class OAuth2Credential extends WithTimestampSchema {
  id: string

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

  get isExpired() {
    const now = Math.floor(Date.now() / 1000)
    return this.refreshTokenExpiresAt ? this.refreshTokenExpiresAt <= now : this.accessTokenExpiresAt <= now
  }
}

export const OAuth2CredentialSchema = SchemaFactory.createForClass(OAuth2Credential)
