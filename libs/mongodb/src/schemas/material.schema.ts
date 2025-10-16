import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { FileMetadata, MediaType } from './media.schema'
import { WithTimestampSchema } from './timestamp.schema'

export enum MaterialType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article', // 文章
}

export enum MaterialStatus {
  WAIT = 0,
  SUCCESS = 1,
  FAIL = -1,
}

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class MaterialMedia {
  @Prop({
    required: true,
  })
  url: string

  @Prop({
    type: Object,
  })
  metadata?: FileMetadata

  @Prop({
    required: true,
  })
  type: MediaType

  @Prop({
    required: false,
    default: '',
  })
  content?: string

  @Prop({
    required: false,
  })
  mediaId?: string
}
@Schema({
  collection: 'material',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class Material extends WithTimestampSchema {
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
  groupId: string // 所属组ID

  @Prop({
    required: false,
    index: true,
  })
  taskId?: string // 使用生成的任务ID

  @Prop({
    required: true,
    enum: MaterialType,
    index: true,
  })
  type: MaterialType

  @Prop({
    required: false,
  })
  coverUrl?: string

  @Prop({
    required: true,
    type: [MaterialMedia],
    default: [],
  })
  mediaList: MaterialMedia[]

  @Prop({
    required: false,
  })
  title?: string

  @Prop({
    required: false,
  })
  desc?: string

  @Prop({
    required: false,
    default: {},
    type: Object, // 明确指定类型为 Object
  })
  option?: Record<string, any>

  @Prop({
    required: true,
    enum: MaterialStatus,
    default: MaterialStatus.WAIT,
  })
  status: MaterialStatus

  @Prop({
    required: false,
    default: '',
  })
  message?: string

  @Prop({
    required: true,
    default: 0,
    index: true,
  })
  useCount: number

  // 是否自动删除素材
  @Prop({
    required: true,
    default: false,
  })
  autoDeleteMedia: boolean
}

export const MaterialSchema = SchemaFactory.createForClass(Material)
