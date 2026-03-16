import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class NotificationTypeEmailControl {
  @Prop({
    type: Boolean,
    required: true,
    default: true,
  })
  email: boolean
}

export const NotificationTypeEmailControlSchema = SchemaFactory.createForClass(NotificationTypeEmailControl)

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'userNotificationControls' })
export class UserNotificationControl extends WithTimestampSchema {
  id: string

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
    unique: true,
  })
  userId: string

  @Prop({
    type: Map,
    of: NotificationTypeEmailControlSchema,
    required: false,
    default: {},
    description: '每种通知类型的邮件控制设置',
  })
  controls: Map<string, NotificationTypeEmailControl>

  @Prop({
    type: Date,
    required: false,
    index: true,
    description: '删除时间，存在即代表已删除',
  })
  deletedAt?: Date
}

export const UserNotificationControlSchema = SchemaFactory.createForClass(UserNotificationControl)
