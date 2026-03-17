import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { AssetStatus, AssetType } from '../enums/asset.enum'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

/** 图片元数据 */
export interface ImageMetadata {
  width: number
  height: number
}

/** 视频元数据 */
export interface VideoMetadata {
  width?: number
  height?: number
  duration?: number // seconds
  cover?: string // 封面图 path
  bitrate?: number // bps
  frameRate?: number // fps
}

/** 音频元数据 */
export interface AudioMetadata {
  duration: number // seconds
  bitrate?: number // bps
  sampleRate?: number // Hz
  channels?: number
}

/** Asset 元数据联合类型 */
export type AssetMetadata = ImageMetadata | VideoMetadata | AudioMetadata

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'assets' })
export class Asset extends WithTimestampSchema {
  id: string

  @Prop({ required: true })
  userId: string

  @Prop({
    required: true,
    enum: UserType,
    default: UserType.User,
  })
  userType: UserType

  @Prop({ required: true })
  path: string

  @Prop({ required: true, enum: AssetType })
  type: AssetType

  @Prop({ required: true, enum: AssetStatus, default: AssetStatus.Pending })
  status: AssetStatus

  @Prop()
  size?: number

  @Prop({ required: true })
  mimeType: string

  @Prop()
  filename?: string

  @Prop({ type: Object })
  metadata?: AssetMetadata

  @Prop({ type: Date })
  expiresAt?: Date

  @Prop({ type: Date })
  deletedAt?: Date
}

export const AssetSchema = SchemaFactory.createForClass(Asset)

AssetSchema.index({ userId: 1, userType: 1, type: 1, status: 1 })
AssetSchema.index({ userId: 1, userType: 1, createdAt: -1 })
AssetSchema.index({ path: 1 }, { unique: true })
AssetSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } },
)
AssetSchema.index(
  { status: 1, createdAt: -1 },
  { partialFilterExpression: { deletedAt: { $exists: false } } },
)
AssetSchema.index({ status: 1, deletedAt: 1, createdAt: -1 })
