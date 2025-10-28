import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '..'
import { WithTimestampSchema } from './timestamp.schema'

export enum TaskType {
  VIDEO = 'video',
  ARTICLE = 'article',
  PROMOTION = 'promotion',
  INTERACTION = 'interaction',
}

export enum TaskStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  DEL = 'del',
}

// 互动任务数据
@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class InteractionTaskData {
  @Prop({ type: String, default: 'interaction', immutable: true })
  type: string

  @Prop({ type: String, required: true })
  targetWorksId: string

  @Prop({ type: String, required: false })
  targetAuthorId?: string

  @Prop({ type: String, required: false })
  platform?: string
}

@Schema({
  collection: 'task',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class Task extends WithTimestampSchema {
  id: string

  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  description: string

  @Prop({ required: true, enum: TaskType, index: true })
  type: TaskType

  @Prop({ required: true })
  maxRecruits: number

  @Prop({ default: 0 })
  currentRecruits: number

  @Prop({ required: true })
  deadline: Date

  @Prop({ required: true, type: Number })
  reward: number

  @Prop({ default: TaskStatus.ACTIVE, enum: TaskStatus, index: true })
  status: TaskStatus

  @Prop({ type: Array<AccountType>, required: true })
  accountTypes: AccountType[]

  @Prop({ type: Object, required: false })
  taskData?: InteractionTaskData

  @Prop({ type: Array<string>, required: true, default: [] })
  materialIds: string[]

  @Prop({ required: false })
  materialGroupId?: string // 草稿箱ID

  @Prop({ default: false })
  autoDeleteMaterial?: boolean

  @Prop({ default: false })
  autoDispatch?: boolean // 是否自动派发 用户创建时
}

export const TaskSchema = SchemaFactory.createForClass(Task)

TaskSchema.index({ type: 1, status: 1 })
TaskSchema.index({ deadline: 1, status: 1 })
TaskSchema.index({ createdAt: -1 })
