/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-03-04 15:23:22
 * @LastEditors: nevin
 * @Description: 规则
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { FilterSet } from '..'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'rules',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class Rule extends WithTimestampSchema {
  id: string

  @Prop({ required: true, index: true })
  name: string

  @Prop({
    required: true,
    type: Object,
  })
  filter: FilterSet
}

export const RuleSchema = SchemaFactory.createForClass(Rule)
