import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { WithTimestampSchema } from './timestamp.schema'

@Schema()
export class PostMedia {
  @Prop({
    required: true,
  })
  type: 'video' | 'image'

  @Prop({
    required: true,
  })
  url: string

  @Prop({
    required: false,
  })
  thumbnail?: string
}

export const PostMediaSchema = SchemaFactory.createForClass(PostMedia)

@Schema({
  collection: 'publishedPosts',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
  id: true,
})
export class PublishedPost extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
    index: true,
  })
  accountId: string

  @Prop({
    required: true,
    index: true,
  })
  uid: string

  @Prop({
    required: true,
    index: true,
    enum: AccountType,
  })
  platform: AccountType

  @Prop({
    required: true,
    index: true,
  })
  postId: string

  @Prop({
    required: true,
    default: '',
  })
  title: string

  @Prop({
    required: true,
    default: '',
  })
  desc: string

  @Prop({
    required: true,
  })
  permalink: string

  @Prop({
    required: true,
  })
  publishTime: Date

  @Prop({
    required: true,
    type: [PostMediaSchema],
    default: [],
  })
  medias: PostMedia[]

  @Prop({
    required: true,
    default: 0,
  })
  viewCount: number

  @Prop({
    required: true,
    default: 0,
  })
  commentCount: number

  @Prop({
    required: true,
    default: 0,
  })
  likeCount: number

  @Prop({
    required: true,
    default: 0,
  })
  shareCount: number

  @Prop({
    required: true,
    default: 0,
  })
  clickCount: number

  @Prop({
    required: true,
    default: 0,
  })
  impressionCount: number

  @Prop({
    required: true,
    default: 0,
  })
  favoriteCount: number
}

export const PublishedPostSchema = SchemaFactory.createForClass(PublishedPost)
