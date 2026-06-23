import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Schema as MongooseSchema } from 'mongoose'
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
    required: false,
    type: String,
  })
  refreshToken: string

  @Prop({
    required: false,
    type: Number,
  })
  accessTokenExpiresAt?: number

  @Prop({
    required: false,
    type: Number,
  })
  refreshTokenExpiresAt?: number

  @Prop({
    required: false,
    type: String,
  })
  scope?: string

  @Prop({
    required: false,
    type: MongooseSchema.Types.Mixed,
  })
  raw?: unknown

  get isExpired() {
    const now = Math.floor(Date.now() / 1000)
    if (this.refreshTokenExpiresAt) {
      return this.refreshTokenExpiresAt <= now
    }
    return this.accessTokenExpiresAt ? this.accessTokenExpiresAt <= now : false
  }
}

export const OAuth2CredentialSchema = SchemaFactory.createForClass(OAuth2Credential)
OAuth2CredentialSchema.index(
  { accountId: 1 },
  {
    unique: true,
    name: 'accountId_1',
  },
)
