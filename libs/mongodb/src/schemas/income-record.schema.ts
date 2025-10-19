import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { IncomeStatus, IncomeType } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'incomeRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class IncomeRecord extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  amount: number

  @Prop({
    required: true,
    enum: IncomeType,
  })
  type: IncomeType

  @Prop({
    index: true,
    enum: IncomeStatus,
    default: IncomeStatus.Pending,
  })
  status: IncomeStatus

  // 提现ID
  @Prop({
    required: false,
    type: String,
  })
  withdrawId?: string

  // 关联ID
  @Prop({
    required: false,
    type: String,
  })
  relId?: string

  @Prop({
    required: false,
  })
  desc?: string

  @Prop({
    type: Object,
    required: false,
  })
  metadata?: Record<string, unknown>
}

export const IncomeRecordSchema = SchemaFactory.createForClass(IncomeRecord)
