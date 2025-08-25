import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BrowserEnvironmentRegion, BrowserEnvironmentStatus } from '@yikart/common'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'browser_environments',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
  id: true,
})
export class BrowserEnvironment extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  instanceId: string

  @Prop({
    required: true,
  })
  region: BrowserEnvironmentRegion

  @Prop({
    required: true,
  })
  status: BrowserEnvironmentStatus

  @Prop({
    required: true,
  })
  ip: string

  @Prop()
  password?: string
}

export const BrowserEnvironmentSchema = SchemaFactory.createForClass(BrowserEnvironment)
