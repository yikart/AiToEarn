import { PlatPulOption } from '@core/publish/common'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { BaseTemp } from './time.tamp'

export enum MetaMediaStatus {
  FAILED = -1,
  CREATED = 0,
  IN_PROGRESS = 1,
  FINISHED = 2,
}

@Schema({
  collection: 'metaContainer',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})

export class MetaContainer extends BaseTemp {
  id: string

  @Prop({
    required: true,
  })
  publishId: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  platform: string

  @Prop({
    required: true,
  })
  taskId: string

  @Prop({
    required: true,
    enum: MetaMediaStatus,
    default: MetaMediaStatus.CREATED,
  })
  status: MetaMediaStatus

  @Prop({
    required: true,
  })
  accountId: string

  @Prop({
    required: false,
    type: mongoose.Schema.Types.Mixed,
  })
  option: PlatPulOption
}

export const MetaContainerSchema = SchemaFactory.createForClass(MetaContainer)
