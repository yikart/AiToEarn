/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 发布记录
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { PublishStatus, PublishType } from '../enums'
import { AccountType } from './account.schema'
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

  // 错误信息
  @Prop({
    required: false,
  })
  errorMsg?: string

  // 队列 ID
  @Prop({
    required: false,
  })
  queueId?: string

  // 此任务是否进入队列
  @Prop({
    required: true,
    default: false,
  })
  inQueue: boolean

  /**
   * 任意对象值
   * bilibili: {
   *  tid: number; 分区
   *  copyright: number; 1-原创，2-转载(转载时source必填)
   *  source: string; 如果copyright为转载，则此字段表示转载来源;
   * }
   */
  @Prop({
    required: false,
    type: mongoose.Schema.Types.Mixed,
  })
  option?: Record<string, unknown>

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
