import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '..'
import { WithTimestampSchema } from './timestamp.schema'

export enum TaskOpportunityStatus {
  PENDING = 'pending', // 待接取
  ACCEPTED = 'accepted', // 已接取
  EXPIRED = 'expired', // 已过期
}

// 任务派发表
@Schema({
  collection: 'taskOpportunities',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class TaskOpportunity extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  taskId: string

  @Prop({ required: false, type: Number })
  reward?: number

  @Prop({ required: false, index: true })
  accountId?: string

  @Prop({ required: false })
  nickname?: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: false })
  userName?: string

  @Prop({ required: false })
  mail?: string

  @Prop({
    required: false,
    enum: AccountType,
  })
  accountType?: AccountType

  @Prop({
    required: false,
  })
  accountTypes?: AccountType[]

  @Prop({
    required: false,
  })
  uid?: string

  @Prop({
    type: String,
    enum: TaskOpportunityStatus,
    default: TaskOpportunityStatus.PENDING,
    index: true,
  })
  status: TaskOpportunityStatus

  // 是否已经查看
  @Prop({
    required: false,
    default: false,
  })
  isView?: boolean

  @Prop({ required: true })
  expiredAt: Date

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any> // 额外信息，如匹配得分等
}

export const TaskOpportunitySchema = SchemaFactory.createForClass(TaskOpportunity)

// 创建复合索引
TaskOpportunitySchema.index({ userId: 1, status: 1 })
TaskOpportunitySchema.index({ taskId: 1, status: 1 })
TaskOpportunitySchema.index({ expiredAt: 1 })
