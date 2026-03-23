import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'apiKey' })
export class ApiKey extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true })
  name: string

  @Prop({ required: true, unique: true, index: true })
  keyHash: string

  @Prop()
  lastUsedAt: Date
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey)
