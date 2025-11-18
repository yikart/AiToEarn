import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { SchemaTypes } from 'mongoose'
import { MaterialType } from './material.schema'
import { MediaType } from './media.schema'
import { WithTimestampSchema } from './timestamp.schema'

export enum MaterialTaskStatus {
  WAIT = 0,
  RUNNING = 1,
  SUCCESS = 2,
  FAIL = -1,
}

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class MediaUrlInfo {
  @Prop({
    required: true,
    index: true,
  })
  mediaId: string

  @Prop({
    required: true,
    index: true,
  })
  url: string

  @Prop({
    required: true,
    index: true,
    default: 0,
  })
  num: number

  @Prop({
    required: true,
  })
  type: MediaType
}

@Schema({
  collection: 'materialTask',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class MaterialTask extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
    index: true,
    default: UserType.User,
  })
  userType: UserType

  @Prop({
    required: true,
    index: true,
  })
  groupId: string // Group ID

  @Prop({
    required: true,
    enum: MaterialType,
    index: true,
  })
  type: MaterialType

  @Prop({
    required: true,
  })
  aiModelTag: string

  @Prop({
    required: true,
  })
  prompt: string // Prompt

  @Prop({
    required: false,
  })
  systemPrompt?: string // System prompt

  @Prop({
    required: false,
  })
  coverGroup?: string

  // Array of media groups used
  @Prop({
    type: [String],
    default: [],
  })
  mediaGroups: string[]

  @Prop({
    required: false,
    default: {},
    type: Object, // Explicitly specify type as Object
  })
  option?: Record<string, unknown> // Advanced settings

  @Prop({
    required: true,
    type: [MediaUrlInfo],
  })
  coverUrlList: MediaUrlInfo[] // Cover array

  @Prop({
    required: true,
    type: SchemaTypes.Mixed,
  })
  mediaUrlMap: MediaUrlInfo[][] // 2D array of media

  @Prop({
    required: true,
  })
  reNum: number

  @Prop({
    required: true,
    enum: MaterialTaskStatus,
    default: MaterialTaskStatus.WAIT,
  })
  status: MaterialTaskStatus

  @Prop({
    required: true,
    default: false,
  })
  autoDeleteMedia: boolean
}

export const MaterialTaskSchema = SchemaFactory.createForClass(MaterialTask)
