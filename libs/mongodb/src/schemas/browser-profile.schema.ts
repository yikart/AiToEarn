import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'browser_profiles',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
  id: true,
})
export class BrowserProfile extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  accountId: string

  @Prop({
    required: true,
  })
  profileId: string

  @Prop({
    required: false,
  })
  environmentId?: string

  @Prop({
    required: true,
    type: Object,
  })
  config: Record<string, unknown>
}

export const BrowserProfileSchema = SchemaFactory.createForClass(BrowserProfile)
