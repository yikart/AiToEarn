import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { APIKeyStatus, APIKeyType } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'apiKey',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
  id: true,
})
export class ApiKey extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  key: string

  @Prop({
    required: false,
  })
  desc?: string

  @Prop({
    required: true,
    default: APIKeyStatus.Active,
  })
  status: APIKeyStatus

  @Prop({
    required: true,
    enum: APIKeyType,
  })
  type: APIKeyType
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey)
