import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '../../common/enums'
import { PublishingTaskType, PublishStatus } from '../enums'
import { PublishingTaskMeta } from './publishing-task-meta.schema'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'publishTask',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class PublishTask extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: false,
  })
  flowId?: string

  @Prop({
    required: false,
    type: String,
  })
  userTaskId?: string

  @Prop({
    required: false,
    type: String,
  })
  taskId?: string

  @Prop({
    required: false,
    type: String,
  })
  taskMaterialId?: string

  @Prop({
    required: true,
    enum: PublishingTaskType,
  })
  type: PublishingTaskType

  @Prop({
    required: false,
  })
  title?: string

  @Prop({
    required: false,
    default: '',
  })
  desc?: string

  @Prop({
    required: true,
  })
  accountId: string

  @Prop({
    required: false,
    type: [String],
    default: [],
  })
  topics?: string[]

  @Prop({
    required: true,
  })
  accountType: AccountType

  @Prop({
    required: true,
  })
  uid: string

  @Prop({
    required: false,
  })
  videoUrl?: string

  @Prop({
    required: false,
  })
  coverUrl?: string

  @Prop({
    required: false,
    type: [String],
  })
  imgUrlList?: string[]

  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  publishTime: Date

  @Prop({
    required: true,
    enum: PublishStatus,
    default: PublishStatus.WaitingForPublish,
  })
  status: PublishStatus

  @Prop({
    required: false,
  })
  queueId?: string

  @Prop({
    required: true,
    default: false,
  })
  inQueue: boolean

  @Prop({
    required: false,
    default: false,
  })
  queued: boolean

  @Prop({
    required: false,
  })
  errorMsg?: string

  @Prop({
    required: false,
    type: PublishingTaskMeta,
  })
  option?: PublishingTaskMeta

  @Prop({
    required: false,
    index: false,
    type: String,
    default: '',
  })
  dataId?: string

  @Prop({
    required: false,
    type: String,
  })
  workLink?: string
}

export const PublishTaskSchema = SchemaFactory.createForClass(PublishTask)
