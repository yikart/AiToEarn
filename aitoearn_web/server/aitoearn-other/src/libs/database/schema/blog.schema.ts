import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseTemp } from './time.tamp'

@Schema({
  collection: 'blog',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Blog extends BaseTemp {
  id: string

  @Prop({
    comment: '内容',
    default: '',
  })
  content: string
}

export const BlogSchema = SchemaFactory.createForClass(Blog)
