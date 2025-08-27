import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CloudSpaceRegion, CloudSpaceStatus } from '@yikart/common'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'cloud_spaces',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
  id: true,
})
export class CloudSpace extends WithTimestampSchema {
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
  region: CloudSpaceRegion

  @Prop({
    required: true,
  })
  status: CloudSpaceStatus

  @Prop({
    required: true,
  })
  ip: string

  @Prop()
  password?: string

  @Prop({
    type: Date,
    required: true,
  })
  expiredAt: Date
}

export const CloudSpaceSchema = SchemaFactory.createForClass(CloudSpace)
