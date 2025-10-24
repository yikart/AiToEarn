import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { PlatPulOption } from '../../../core/publish/common'
import { BaseTemp } from './time.tamp'

export enum PostMediaStatus {
  FAILED = -1,
  CREATED = 0,
  IN_PROGRESS = 1,
  FINISHED = 2,
}

export enum PostCategory {
  POST = 'POST',
  REELS = 'REELS',
  STORY = 'STORY',
}

export enum PostSubCategory {
  PLAINTEXT = 'PLAINTEXT',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

@Schema({
  collection: 'postMediaContainer',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})

export class PostMediaContainer extends BaseTemp {
  id: string

  @Prop({
    required: true,
  })
  publishId: string

  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  platform: string

  @Prop({
    required: true,
  })
  taskId: string

  @Prop({
    required: true,
    enum: PostCategory,
    default: PostCategory.POST,
  })
  category: PostCategory

  @Prop({
    required: true,
    enum: PostSubCategory,
    default: PostSubCategory.PLAINTEXT,
  })
  subCategory: PostSubCategory

  @Prop({
    required: true,
    enum: PostMediaStatus,
    default: PostMediaStatus.CREATED,
  })
  status: PostMediaStatus

  @Prop({
    required: true,
  })
  accountId: string

  @Prop({
    required: false,
    type: mongoose.Schema.Types.Mixed,
  })
  option: PlatPulOption
}

export const PostMediaContainerSchema = SchemaFactory.createForClass(PostMediaContainer)
