import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import mongoose from 'mongoose'
import { PlatPulOption } from '../../../core/publish/common'
import { BaseTemp } from './time.tamp'

export enum PublishType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article',
}

export enum PublishStatus {
  FAILED = -1, // 发布失败
  WaitingForPublish = 0, // 未发布
  PUBLISHED = 1, // 已发布
  PUBLISHING = 2, // 发布中
}

@Schema({
  collection: 'publishTask',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class PublishTask extends BaseTemp {
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

  // 错误信息
  @Prop({
    required: false,
  })
  errorMsg?: string

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
  option?: PlatPulOption
}

export const PublishTaskSchema = SchemaFactory.createForClass(PublishTask)
