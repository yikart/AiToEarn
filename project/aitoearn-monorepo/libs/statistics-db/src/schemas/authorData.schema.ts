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
    required: false,
    type: Date,
  })
  businessDate?: Date

  @Prop({
    required: true,
    default: 0,
  })
  postCount: number
}

export const AuthorDatasSchema = SchemaFactory.createForClass(AuthorDatas)
