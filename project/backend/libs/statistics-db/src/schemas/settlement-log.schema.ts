import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ collection: 'task_settlement_logs', versionKey: false, timestamps: true })
export class TaskSettlementLog extends WithTimestampSchema {
  id: string

  @Prop({ required: true })
  taskId: string

  @Prop({ required: true })
  batchId: string

  @Prop({ required: true })
  startTime: Date

  @Prop({ required: true })
  endTime: Date

  @Prop({ required: true, type: Number })
  settledCount: number

  @Prop({ required: true, type: Number })
  totalAmountCent: number

  @Prop({ required: false, type: Object })
  summary?: Record<string, unknown>

  @Prop({ required: false, type: Array })
  failures?: Array<{
    postId?: string
    userId?: string
    reason: string
    stage?: string
    amountCent?: number
  }>
}

export const TaskSettlementLogSchema = SchemaFactory.createForClass(TaskSettlementLog)
