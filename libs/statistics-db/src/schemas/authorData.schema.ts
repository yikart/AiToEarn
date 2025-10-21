import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class AuthorDatas extends WithTimestampSchema {
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
  accountId: string

  @Prop({
    required: false,
  })
  platform: string

  @Prop({
    required: false,
  })
  gender: string

  @Prop({
    required: false,
  })
  desc: string

  @Prop({
    required: true,
    default: 0,
  })
  followerCount: number

  @Prop({
    required: true,
    default: 0,
  })
  followingCount: number

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
    type: Date,
  })
  snapshotDate?: Date

  @Prop({
    required: true,
    default: 0,
  })
  postCount: number
}

export const AuthorDatasSchema = SchemaFactory.createForClass(AuthorDatas)

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
