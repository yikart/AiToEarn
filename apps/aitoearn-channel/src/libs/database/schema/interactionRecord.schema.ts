/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 互动记录记录 interactionRecord
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '../../../transports/account/common'
import { BaseTemp } from './time.tamp'

@Schema({
  collection: 'interactionRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class InteractionRecord extends BaseTemp {
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
  worksId: string

  // 作品标题
  @Prop({
    type: String,
    default: '',
  })
  worksTitle?: string

  // 作品封面
  @Prop({
    type: String,
  })
  worksCover?: string

  @Prop({
    type: String,
    default: '',
  })
  worksContent?: string

  @Prop({
    type: String,
  })
  commentContent?: string

  // 评论时间
  @Prop({
    type: Date,
    default: null,
  })
  commentTime?: Date

  // 评论备注
  @Prop({
    type: String,
  })
  commentRemark?: string

  // 点赞时间
  @Prop({
    type: Date,
  })
  likeTime?: Date

  // 收藏时间
  @Prop({
    type: Date,
  })
  collectTime?: Date
}

export const InteractionRecordSchema = SchemaFactory.createForClass(InteractionRecord)
