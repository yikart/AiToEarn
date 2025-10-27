/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

@Schema({
  collection: 'product',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Product {
  @Prop({
    type: String,
    required: true,
    index: true,
    unique: true,
  })
  id: string

  @Prop({
    type: String,
    required: true,
    index: true,
    unique: true,
  })
  name: string

  @Prop({
    type: Boolean,
    required: false,
    index: true,
  })
  active?: boolean

  @Prop({ type: Array, required: false })
  images?: string[] // 邀请人用户ID

  @Prop({ type: Object, required: false, default: {} })
  metadata?: object
}

export const ProductSchema = SchemaFactory.createForClass(Product)
