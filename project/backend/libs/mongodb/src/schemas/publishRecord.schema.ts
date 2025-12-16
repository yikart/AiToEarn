/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 发布记录
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import mongoose from 'mongoose'
import { PublishStatus, PublishType } from '../enums'
import { PublishErrorData } from './publishing-task-meta.schema'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'publishRecord',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class PublishRecord extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: false,
  })
  flowId?: string // 前端传入的流水ID

  @Prop({
    required: false,
    type: String,
  })
  userTaskId?: string // 用户任务ID

  @Prop({
    required: false,
    type: String,
  })
  taskId?: string // 任务ID

  @Prop({
    required: false,
    type: String,
  })
  taskMaterialId?: string // 任务素材ID

  @Prop({
    required: true,
    enum: PublishType,
  })
  type: PublishType

  @Prop({
    required: false,
  })
  title?: string

  @Prop({
    required: false,
    default: '',
  })
  desc?: string // 主要内容

  @Prop({
    required: true,
  })
  accountId: string

  // 话题
  @Prop({
    required: true,
    type: [String],
  })
  topics: string[]

  @Prop({
    required: true,
  })
  accountType: AccountType

  @Prop({
    required: true,
  })
  uid: string

  @Prop({
    required: false,
  })
  videoUrl?: string

  @Prop({
    required: false,
  })
  coverUrl?: string

  // 图片列表
  @Prop({
    required: false,
    type: [String],
  })
  imgUrlList?: string[]

  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  publishTime: Date

  @Prop({
    required: true,
    enum: PublishStatus,
    default: PublishStatus.WaitingForPublish,
  })
  status: PublishStatus

  @Prop({
    required: false,
    type: PublishErrorData,
  })
  errorData?: PublishErrorData

  @Prop({
    required: false,
  })
  errorMsg?: string

  @Prop({
    required: false,
  })
  queueId?: string

  @Prop({
    required: true,
    default: false,
  })
  inQueue: boolean

  @Prop({
    required: false,
    type: mongoose.Schema.Types.Mixed,
  })
  option?: any

  @Prop({
    required: true,
    index: true,
    type: String,
    default: '',
  })
  dataId: string

  @Prop({
    required: false,
    type: String,
  })
  workLink?: string

  @Prop({
    required: false,
    type: mongoose.Schema.Types.Mixed,
  })
  dataOption?: Record<string, any>
}

export const PublishRecordSchema = SchemaFactory.createForClass(PublishRecord)
