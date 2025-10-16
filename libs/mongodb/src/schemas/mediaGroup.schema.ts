/*
 * @Author: nevin
 * @Date: 2024-09-02 14:45:57
 * @LastEditTime: 2025-02-22 12:37:22
 * @LastEditors: nevin
 * @Description: 媒体库 mediaGroup
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { MediaType } from './media.schema'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'mediaGroup',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class MediaGroup extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
    index: true,
    default: UserType.User,
  })
  userType: UserType

  @Prop({
    required: true,
    enum: MediaType,
    index: true,
  })
  type: MediaType

  @Prop({
    required: true,
  })
  title: string

  @Prop({
    required: false,
  })
  desc?: string

  // 是否默认
  @Prop({
    required: true,
    index: true,
    default: false,
  })
  isDefault: boolean
}

export const MediaGroupSchema = SchemaFactory.createForClass(MediaGroup)
