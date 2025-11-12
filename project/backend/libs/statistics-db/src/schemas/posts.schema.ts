import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { WithTimestampSchema } from './timestamp.schema'

export enum MediaType {
  VIDEO = 'video',
  ARTICLE = 'article',
  IMAGE = 'image',
}

export enum PostsRecordStatus {
  Pending = 'pending',
  Running = 'running',
  Success = 'success',
  Failed = 'Failed',
}

// posts history record
@Schema({
  versionKey: false,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class PostsRecord extends WithTimestampSchema {
  id: string

  @Prop({
    required: false,
    type: String,
  })
  accountId: string

  @Prop({
    required: false,
    type: String,
  })
  userId: string

  @Prop({
    required: true,
    enum: AccountType,
  })
  platform: AccountType

  @Prop({
    required: true, // 平台账户的唯一ID˝
  })
  uid: string

  @Prop({
    required: false, // 作品ID
  })
  postId: string

  @Prop({ default: PostsRecordStatus.Pending, enum: PostsRecordStatus, index: true })
  status: PostsRecordStatus

  // 新增详情数据字段
  @Prop({
    required: false,
    type: String,
  })
  title?: string

  @Prop({
    required: false,
    type: String,
  })
  desc?: string

  @Prop({
    required: false,
    type: String,
  })
  cover?: string

  @Prop({
    required: false,
    type: Date,
  })
  publishTime?: Date

  @Prop({
    required: false,
    type: String,
  })
  mediaType?: string

  @Prop({
    required: false,
    type: String,
  })
  url?: string

  @Prop({
    required: false,
    type: Number,
    default: 0,
  })
  viewCount?: number

  @Prop({
    required: false,
    type: Number,
    default: 0,
  })
  commentCount?: number

  @Prop({
    required: false,
    type: Number,
    default: 0,
  })
  likeCount?: number

  @Prop({
    required: false,
    type: Number,
    default: 0,
  })
  shareCount?: number

  @Prop({
    required: false,
    type: Number,
    default: 0,
  })
  favoriteCount?: number
}

export const PostsRecordSchema = SchemaFactory.createForClass(PostsRecord)

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class PostDatas extends WithTimestampSchema {
  id: string

  @Prop({
    required: false,
  })
  uid: string

  @Prop({
    required: false,
  })
  userId: string

  @Prop({
    required: false,
  })
  categoryId: string

  @Prop({
    required: false,
  })
  platform: string

  @Prop({
    required: false,
  })
  postId: string

  @Prop({
    required: false,
  })
  title: string

  @Prop({
    required: false,
  })
  desc: string

  @Prop({
    required: false,
  })
  cover: string

  @Prop({
    required: false,
  })
  mediaType: string

  @Prop({
    required: false,
    default: '',
  })
  url: string

  @Prop({
    required: false,
    default: '0:00:00',
  })
  duration: string

  @Prop({
    required: true,
    default: 0,
  })
  viewCount: number

  @Prop({
    required: true,
    default: 0,
  })
  likeCount: number

  @Prop({
    required: true,
    default: 0,
  })
  favoriteCount: number

  @Prop({
    required: true,
    default: 0,
  })
  shareCount: number

  @Prop({
    required: true,
    default: 0,
  })
  commentCount: number

  @Prop({
    required: false,
    default: 0,
  })
  clickCount: number

  @Prop({
    required: false,
    default: 0,
  })
  impressionCount: number

  @Prop({
    required: false,
    type: Date,
  })
  snapshotDate?: Date

  @Prop({
    required: false,
    type: Date,
  })
  publishTime?: Date
}

export const PostDatasSchema = SchemaFactory.createForClass(PostDatas)
