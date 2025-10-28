import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithdrawRecordStatus, WithdrawRecordType } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'
import { UserWalletAccount } from './user-wallet-account.schema'

@Schema({
  collection: 'withdrawRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class WithdrawRecord extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: false,
    type: String,
  })
  flowId?: string

  @Prop({
    required: false,
  })
  userWalletAccountId?: string

  @Prop({
    required: false,
  })
  userWalletAccountInfo?: UserWalletAccount

  @Prop({
    required: true,
    enum: WithdrawRecordType,
  })
  type: WithdrawRecordType

  @Prop({
    required: true,
    type: Number,
  })
  amount: number

  // 收入记录ID
  @Prop({
    required: false,
    type: String,
  })
  incomeRecordId?: string

  // 关联ID
  @Prop({
    required: false,
    type: String,
  })
  relId?: string

  @Prop({
    required: false,
  })
  desc?: string // 备注

  @Prop({ type: [String] })
  screenshotUrls?: string[] // 发放截图列表

  @Prop({
    required: true,
    enum: WithdrawRecordStatus,
    default: WithdrawRecordStatus.WAIT,
  })
  status: WithdrawRecordStatus

  @Prop({
    type: Object,
    required: false,
  })
  metadata?: Record<string, unknown>
}

export const WithdrawRecordSchema = SchemaFactory.createForClass(WithdrawRecord)
