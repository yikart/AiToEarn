import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from './account.schema'
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
