/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 发布信息
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'publishInfo',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class PublishInfo extends WithTimestampSchema {
  @Prop({
    required: true,
    index: true,
    type: String,
    default: '',
  })
  userId: string

  @Prop({
    index: true,
    required: true,
    type: Date,
  })
  upInfoDate: Date

  // 已经连续发布的天数
  @Prop({
    type: Number,
    default: 0,
  })
  days: number
}

export const PublishInfoSchema = SchemaFactory.createForClass(PublishInfo)
