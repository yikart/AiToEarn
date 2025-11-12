import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'
import * as mongoose from 'mongoose'
import { NotificationStatus, NotificationType } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'notifications',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class Notification extends WithTimestampSchema {
  id: string

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  userId: string

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
  data?: Record<string, unknown>

  @Prop({
    type: Date,
    required: false,
    index: true,
    description: '用户删除时间，存在即代表已删除',
  })
  deletedAt?: Date
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)

NotificationSchema.index({ userId: 1, status: 1 })
NotificationSchema.index({ userId: 1, deletedAt: 1, createdAt: -1 })
