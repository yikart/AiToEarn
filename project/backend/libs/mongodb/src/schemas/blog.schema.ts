import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'blog',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Blog extends WithTimestampSchema {
  id: string

  @Prop({
    comment: '内容',
    default: '',
  })
  content: string
}

export const BlogSchema = SchemaFactory.createForClass(Blog)
