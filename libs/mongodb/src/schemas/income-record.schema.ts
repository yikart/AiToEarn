import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { IncomeRecordStatus, IncomeRecordType } from '../enums'
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
    enum: IncomeRecordType,
  })
  type: IncomeRecordType

  @Prop({
    index: true,
    enum: IncomeRecordStatus,
    default: IncomeRecordStatus.Pending,
  })
  status: IncomeRecordStatus

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
