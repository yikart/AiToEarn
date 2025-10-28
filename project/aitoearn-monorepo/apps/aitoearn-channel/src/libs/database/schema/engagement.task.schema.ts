import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseTemp } from './time.tamp'

export enum EngagementTaskStatus {
  CREATED = 'CREATED',
  DISTRIBUTED = 'DISTRIBUTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
}
export enum EngagementTaskType {
  LIKE = 'LIKE',
  FAVORITE = 'FAVORITE',
  COMMENT = 'COMMENT', // comment on post
  REPLY = 'REPLY', // reply to comment
}

export enum EngagementTargetScope {
  ALL = 'ALL',
  PARTIAL = 'PARTIAL',
}

@Schema({
  collection: 'engagementTask',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class EngagementTask extends BaseTemp {
  id: string
  @Prop({
    required: true,
  })
  accountId: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  postId: string

  @Prop({
    required: true,
  })
  platform: string

  @Prop({
    required: true,
    default: '',
  })
  model: string

  @Prop({
    required: false,
    default: '',
  })
  prompt: string

  @Prop({
    required: true,
    enum: EngagementTaskType,
    default: EngagementTaskType.REPLY,
  })
  taskType: EngagementTaskType

  @Prop({
    required: true,
    enum: EngagementTargetScope,
    default: EngagementTargetScope.ALL,
  })
  targetScope: EngagementTargetScope

  @Prop({
    required: false,
    type: [String],
  })
  targetIds: string[]

  @Prop({
    required: true,
    enum: EngagementTaskStatus,
    default: EngagementTaskStatus.CREATED,
  })
  status: EngagementTaskStatus

  @Prop({
    required: true,
    default: 0,
  })
  subTaskCount: number

  @Prop({
    required: true,
    default: 0,
  })
  completedSubTaskCount: number

  @Prop({
    required: true,
    default: 0,
  })
  failedSubTaskCount: number
}

@Schema({
  collection: 'engagementSubTask',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class EngagementSubTask extends BaseTemp {
  id: string

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  taskId: string

  @Prop({
    required: true,
  })
  accountId: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  postId: string

  @Prop({
    required: true,
  })
  commentId: string

  @Prop({
    required: true,
    default: '',
  })
  commentContent: string

  @Prop({
    required: false,
    default: '',
  })
  replyContent: string

  @Prop({
    required: true,
  })
  platform: string

  @Prop({
    required: true,
    enum: EngagementTaskStatus,
    default: EngagementTaskStatus.CREATED,
  })
  status: EngagementTaskStatus
}
export const EngagementTaskSchema = SchemaFactory.createForClass(EngagementTask)
export const EngagementSubTaskSchema = SchemaFactory.createForClass(EngagementSubTask)
