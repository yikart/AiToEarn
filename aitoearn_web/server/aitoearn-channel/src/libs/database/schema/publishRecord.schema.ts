/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 发布记录
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { PublishTask } from './publishTask.schema'

@Schema({
  collection: 'publishRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class PublishRecord extends PublishTask {
  @Prop({
    required: true,
    index: true,
    type: String,
    default: '',
  })
  dataId: string // 微信公众号-publish_id

  @Prop({
    required: false,
    type: String,
  })
  workLink?: string // 作品链接

  // 数据补充内容
  @Prop({
    required: false,
    type: mongoose.Schema.Types.Mixed,
  })
  dataOption?: Record<string, any>
}

export const PublishRecordSchema = SchemaFactory.createForClass(PublishRecord)
