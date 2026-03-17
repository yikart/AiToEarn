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
import { PublishRecordSource, PublishStatus, PublishType } from '../enums'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { PublishErrorData } from './publishing-task-meta.schema'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'publishRecord' })
export class PublishRecord extends WithTimestampSchema {
  id: string

  @Prop({
    required: false,
    type: String,
    default: '',
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
    index: true,
  })
  materialGroupId?: string // 草稿箱ID (广告主线下任务)

  @Prop({
    required: false,
    type: String,
    index: true,
  })
  materialId?: string // 草稿ID (广告主线下任务)

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
  })
  desc?: string // 主要内容

  @Prop({
    required: false,
  })
  accountId?: string

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
    required: false,
  })
  uid?: string

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
  })
  queueId?: string

  @Prop({
    required: true,
    default: false,
  })
  inQueue: boolean

  @Prop({
    required: false,
    default: false,
  })
  queued: boolean

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
    type: mongoose.Schema.Types.Mixed,
  })
  option?: any

  @Prop({
    required: false,
    index: false,
    type: String,
    default: '',
  })
  dataId?: string

  @Prop({
    required: false,
    index: true,
    type: String,
  })
  uniqueId?: string // 作品唯一标识 (accountType + dataId)

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

  @Prop({
    required: false,
    type: String,
    enum: PublishRecordSource,
  })
  source?: PublishRecordSource
}

export const PublishRecordSchema = SchemaFactory.createForClass(PublishRecord)

PublishRecordSchema.index({ status: 1, publishTime: 1 })
