import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { DEFAULT_SCHEMA_OPTIONS } from '../channel-db.constants'
import { BaseTemp } from './time.tamp'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'channelAuthIdentity' })
export class ChannelAuthIdentity extends BaseTemp {
  id: string

  @Prop({
    required: true,
    enum: AccountType,
    index: true,
  })
  platform: AccountType

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  subjectUid: string

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  userId: string
}

export const ChannelAuthIdentitySchema = SchemaFactory.createForClass(ChannelAuthIdentity)
ChannelAuthIdentitySchema.index({ platform: 1, subjectUid: 1 }, { unique: true })
