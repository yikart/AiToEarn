import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DraftGenerationMemoryContentType } from '@yikart/aitoearn-ai-shared'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ _id: false })
export class DraftGenerationMemoryItem {
  @Prop({ required: true })
  id: string

  @Prop({ required: true })
  text: string

  @Prop({ required: true, type: Date })
  createdAt: Date

  @Prop({ required: true, type: Date })
  updatedAt: Date
}

export const DraftGenerationMemoryItemSchema = SchemaFactory.createForClass(DraftGenerationMemoryItem)

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'draftGenerationMemories' })
export class DraftGenerationMemory extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true, index: true, enum: DraftGenerationMemoryContentType })
  contentType: DraftGenerationMemoryContentType

  @Prop({ required: true, type: [DraftGenerationMemoryItemSchema], default: [] })
  items: DraftGenerationMemoryItem[]

  @Prop({ required: false, type: Date })
  lastGeneratedAt?: Date

  @Prop({ required: true, type: Number, default: 0 })
  sampleCount: number
}

export const DraftGenerationMemorySchema = SchemaFactory.createForClass(DraftGenerationMemory)
DraftGenerationMemorySchema.index({ userId: 1, contentType: 1 }, { unique: true })
