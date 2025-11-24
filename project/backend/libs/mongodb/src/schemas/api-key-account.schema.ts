import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { APIKeyStatus } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'apiKeyAccount',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
  id: true,
})
export class ApiKeyAccount extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  apiKey: string

  @Prop({
    required: true,
    index: true,
  })
  accountId: string

  @Prop({
    required: true,
    enum: AccountType,
    index: true,
  })
  accountType: AccountType

  @Prop({
    required: false,
    enum: APIKeyStatus,
    default: APIKeyStatus.Active,
  })
  status: APIKeyStatus

  static get indexes() {
    return [{ apiKeyId: 1, accountId: 1 }]
  }
}

export const ApiKeyAccountSchema = SchemaFactory.createForClass(ApiKeyAccount)
