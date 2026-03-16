import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { AiLogStatus } from '../enums'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'qrCodeArtImages' })
export class QrCodeArtImage extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true, enum: UserType })
  userType: UserType

  @Prop({ required: true, index: true })
  relId: string

  @Prop({ required: true })
  relType: string

  @Prop({ required: true, index: true })
  logId: string

  @Prop({ required: true })
  content: string

  @Prop({ required: false })
  referenceImageUrl?: string

  @Prop({ required: true })
  prompt: string

  @Prop({ required: true })
  model: string

  @Prop({ required: false })
  size?: string

  @Prop({ required: true, enum: AiLogStatus, default: AiLogStatus.Generating })
  status: AiLogStatus

  @Prop({ required: false })
  imageUrl?: string
}

export const QrCodeArtImageSchema = SchemaFactory.createForClass(QrCodeArtImage)

QrCodeArtImageSchema.index({ userId: 1, relId: 1, relType: 1 })
QrCodeArtImageSchema.index({ relId: 1, relType: 1, createdAt: -1 })
