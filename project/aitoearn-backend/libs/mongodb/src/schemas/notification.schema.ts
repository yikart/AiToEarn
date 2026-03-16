import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { NotificationType, UserType } from '@yikart/common'
import { Types } from 'mongoose'
import * as mongoose from 'mongoose'
import { NotificationStatus } from '../enums'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class NotificationChannelResultData {
  @Prop({
    type: Boolean,
    required: true,
  })
  success: boolean

  @Prop({
    type: String,
    required: false,
  })
  message?: string
}

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class NotificationChannelResult {
  @Prop({
    type: NotificationChannelResultData,
    required: false,
  })
  oneSignal?: NotificationChannelResultData

  @Prop({
    type: NotificationChannelResultData,
    required: false,
  })
  mail?: NotificationChannelResultData
}

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'notifications' })
export class Notification extends WithTimestampSchema {
  id: string

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  userId: string

  @Prop({
    enum: UserType,
    index: true,
    required: true,
    default: UserType.User,
  })
  userType: UserType

  @Prop({
    type: String,
    required: true,
  })
  title: string

  @Prop({
    type: String,
    required: true,
    description: '通知内容摘要或全文',
  })
  content: string

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    description: '通知类型',
  })
  type: NotificationType

  @Prop({
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.Unread,
    index: true,
    description: '通知状态',
  })
  status: NotificationStatus

  @Prop({
    type: Date,
    required: false,
    description: '用户标记为已读的时间',
  })
  readAt?: Date

  @Prop({
    type: String,
    required: true,
    index: true,
    description: '关联的相关ID（任务ID、用户任务ID等）',
  })
  relatedId: string

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    required: false,
    description: '任意数据，用于存储与通知相关的额外信息',
  })
  data?: any

  @Prop({
    type: Date,
    required: false,
    index: true,
    description: '用户删除时间，存在即代表已删除',
  })
  deletedAt?: Date

  @Prop({
    type: NotificationChannelResult,
    required: false,
  })
  channelResult?: NotificationChannelResult
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)

NotificationSchema.index({ userId: 1, status: 1 })
NotificationSchema.index({ userId: 1, deletedAt: 1, createdAt: -1 })
