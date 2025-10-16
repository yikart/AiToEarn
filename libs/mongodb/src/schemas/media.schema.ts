/*
 * @Author: nevin
 * @Date: 2024-09-02 14:45:57
 * @LastEditTime: 2025-02-22 12:37:22
 * @LastEditors: nevin
 * @Description: 媒体 Media media
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { WithTimestampSchema } from './timestamp.schema'

export enum MediaType {
  VIDEO = 'video', // 视频
  IMG = 'img', // 图片
}

export interface FileMetadata {
  size: number // bytes
  mimeType: string
}

@Schema({
  collection: 'media',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class Media extends WithTimestampSchema {
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
    required: false,
    index: true,
  })
  groupId?: string // 所属组ID

  @Prop({
    required: true,
    enum: MediaType,
    index: true,
  })
  type: MediaType

  @Prop({
    required: true,
  })
  url: string

  @Prop({
    required: false,
  })
  thumbUrl?: string // 缩略图

  @Prop({
    required: false,
  })
  title?: string

  @Prop({
    required: false,
  })
  desc?: string

  @Prop({
    required: true,
    default: 0,
  })
  useCount: number

  @Prop({
    type: Object,
  })
  metadata?: FileMetadata
}

export const MediaSchema = SchemaFactory.createForClass(Media)
