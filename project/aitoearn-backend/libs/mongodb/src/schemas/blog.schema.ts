import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'blog' })
export class Blog extends WithTimestampSchema {
  id: string

  @Prop({
    comment: '内容',
    default: '',
  })
  content: string
}

export const BlogSchema = SchemaFactory.createForClass(Blog)
