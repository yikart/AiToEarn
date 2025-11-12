import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
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

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserTaskPosts extends WithTimestampSchema {
  id: string

  @Prop({
    required: false,
    type: String,
  })
  userId: string

  @Prop({
    required: false,
    type: String,
  })
  accountId: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  type: AccountType

  @Prop({
    required: true, // 平台账户的唯一ID˝
  })
  uid: string

  @Prop({
    required: false, // 任务ID
    index: true,
  })
  taskId: string

  @Prop({
    required: false, // 作品ID
  })
  postId: string

  @Prop({ default: TaskStatus.ACTIVE, enum: TaskStatus, index: true })
  status: TaskStatus
}

export const UserTaskPostsSchema = SchemaFactory.createForClass(UserTaskPosts)
