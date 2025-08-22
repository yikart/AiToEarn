/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2024-11-22 09:53:38
 * @LastEditors: nevin
 * @Description: 反馈 Feedback feedback
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseTemp } from './time.tamp'

export enum FeedbackType {
  errReport = 'errReport', // 错误反馈
  feedback = 'feedback', // 反馈
  msgReport = 'msgReport', // 消息举报
  msgFeedback = 'msgFeedback', // 消息反馈
}

@Schema({
  collection: 'feedback',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Feedback extends BaseTemp {
  id: string

  @Prop({ required: true })
  userId: string

  @Prop({ comment: '用户名' })
  userName: string

  @Prop({
    comment: '内容',
    default: '',
  })
  content: string

  @Prop({
    default: FeedbackType.feedback,
    enum: FeedbackType,
  })
  type: FeedbackType

  @Prop({
    comments: '标识数组',
    type: [String],
    default: [],
  })
  tagList?: string[]

  @Prop({
    comments: '文件链接数组',
    type: [String],
    default: [],
  })
  fileUrlList: string[]
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback)
