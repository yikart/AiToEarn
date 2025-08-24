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
  email: string

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

  @Prop({
    type: String,
    required: false,
  })
  token?: string
}

export const MultiloginAccountSchema = SchemaFactory.createForClass(MultiloginAccounts)
