import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'multilogin_accounts',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
  id: true,
})
export class MultiloginAccounts extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  username: string

  @Prop({
    required: true,
  })
  password: string

  @Prop({
    type: Number,
    required: true,
  })
  maxProfiles: number

  @Prop({
    type: Number,
    required: true,
  })
  currentProfiles: number
}

export const MultiloginAccountSchema = SchemaFactory.createForClass(MultiloginAccounts)
