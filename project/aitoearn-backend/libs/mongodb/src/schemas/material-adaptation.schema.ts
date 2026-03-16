import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'material_adaptation' })
export class MaterialAdaptation extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  materialId: string

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true, index: true })
  platform: string

  @Prop({ required: false })
  title?: string

  @Prop({ required: false })
  desc?: string

  @Prop({ type: [String], default: [] })
  topics: string[]

  @Prop({ type: Object, required: false })
  platformOptions?: Record<string, unknown>
}

export const MaterialAdaptationSchema = SchemaFactory.createForClass(MaterialAdaptation)

MaterialAdaptationSchema.index({ materialId: 1, platform: 1 }, { unique: true })
