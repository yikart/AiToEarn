/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 每日发布信息
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'publishDayInfo' })
export class PublishDayInfo extends WithTimestampSchema {
  @Prop({
    required: true,
    index: true,
    type: String,
    default: '',
  })
  userId: string

  // 发布总数
  @Prop({
    required: true,
    type: Number,
    default: 0,
  })
  publishTotal: number
}

export const PublishDayInfoSchema = SchemaFactory.createForClass(PublishDayInfo)
