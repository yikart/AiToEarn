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

  //   @Prop({
  //     required: false, // 作品类型
  //     index: true
  //   })
  //   mediaType: string

  @Prop({
    required: false, // 作品ID
  })
  postId: string

  @Prop({ default: PostsRecordStatus.Pending, enum: PostsRecordStatus, index: true })
  status: PostsRecordStatus
}

export const PostsRecordSchema = SchemaFactory.createForClass(PostsRecord)
