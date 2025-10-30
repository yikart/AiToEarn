import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'
import { AccountType } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

export enum UserTaskStatus {
  DOING = 'doing', // 进行中
  PENDING = 'pending', // 待提现奖励
  APPROVED = 'approved', // 已通过（完成）
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled', // 已取消
  DEL = 'del', // 已删除或回退
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class AutoData {
  @Prop({
    required: true,
  })
  status: -1 | 0 | 1

  @Prop({ required: false })
  message?: string
}

@Schema({
  collection: 'user_task',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class UserTask extends WithTimestampSchema {
  id: string

  @Prop({ required: true })
  userId: string

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: string

  @Prop({
    required: false,
  })
  opportunityId?: string // 派发记录ID

  @Prop({
    required: false,
  })
  flowId?: string // 流水ID

  @Prop({ required: true, index: true })
  accountId: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  accountType: AccountType

  @Prop({
    required: true, // 平台账户的唯一ID˝
  })
  uid: string

  @Prop({
    type: String,
    enum: UserTaskStatus,
    default: UserTaskStatus.DOING,
    index: true,
  })
  status: UserTaskStatus

  @Prop({ required: true, default: 0 })
  keepTime: number // 保持时间(秒)

  @Prop({
    required: false,
  })
  taskMaterialId?: string // 任务的素材ID

  @Prop({ type: [String] })
  screenshotUrls?: string[] // 任务完成截图

  @Prop()
  submissionTime?: Date // 提交时间

  @Prop()
  completionTime?: Date // 完成时间

  @Prop()
  rejectionReason?: string // 拒绝原因

  @Prop({ type: Object })
  metadata?: Record<string, unknown> // 额外信息，如审核反馈等

  @Prop({ default: false })
  isFirstTimeSubmission: boolean // 是否首次提交，用于确定是否给予首次奖励

  @Prop()
  verifierUserId?: string // 核查人员ID

  @Prop()
  verificationNote?: string // 人工核查备注

  @Prop({
    required: true,
    default: 0,
  })
  reward: number // 奖励金额

  @Prop()
  rewardTime?: Date // 奖励发放时间

  @Prop({ type: Object, required: false, default: {} })
  autoData?: AutoData
}

export const UserTaskSchema = SchemaFactory.createForClass(UserTask)
