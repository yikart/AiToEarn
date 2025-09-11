import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { AiLogChannel, AiLogStatus, AiLogType } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'aiLogs',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
  id: true,
})
export class AiLog extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
    enum: UserType,
  })
  userType: UserType

  @Prop({
    required: false,
    index: true,
  })
  taskId?: string

  @Prop({
    required: true,
    enum: AiLogType,
  })
  type: AiLogType

  @Prop({
    required: true,
  })
  model: string

  @Prop({
    required: true,
    enum: AiLogChannel,
  })
  channel: AiLogChannel

  @Prop({
    required: false,
  })
  action?: string

  @Prop({
    required: true,
    enum: AiLogStatus,
  })
  status: AiLogStatus

  @Prop({
    required: true,
    type: Date,
  })
  startedAt: Date

  @Prop({
    required: false,
  })
  duration?: number

  @Prop({
    required: true,
    type: Object,
  })
  request: Record<string, unknown>

  @Prop({
    required: false,
    type: Object,
  })
  response?: Record<string, unknown>

  @Prop({
    required: false,
    type: Object,
  })
  errorMessage?: string

  @Prop({
    required: true,
  })
  points: number
}

export const AiLogSchema = SchemaFactory.createForClass(AiLog)
