/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 回复评论的记录 replyCommentRecord
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'replyCommentRecord' })
export class ReplyCommentRecord extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  userId: string

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  accountId: string

  // 作品ID
  @Prop({
    index: true,
    type: String,
  })
  worksId?: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  type: AccountType

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  commentId: string

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  commentContent: string

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  replyContent: string
}

export const ReplyCommentRecordSchema = SchemaFactory.createForClass(ReplyCommentRecord)
