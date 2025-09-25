import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ICurrency } from '@yikart/stripe'
import { Int32 } from 'mongodb'
/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: price
 */

@Schema({
  collection: 'price',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Price {
  @Prop({ type: String, required: true, index: true, unique: true })
  id: string

  @Prop({ type: String, required: true, index: true })
  product?: string // 关联产品id

  @Prop({ type: Boolean, required: false, index: true })
  active?: boolean

  @Prop({ type: String, required: false, default: ICurrency.usd })
  currency?: ICurrency // 货币

  @Prop({ type: Object, required: false, default: {} })
  metadata?: object

  @Prop({ type: Int32, required: true })
  unit_amount?: number // 价格  正整数  每种货币的最小单位   1美刀的话对应  100    1元的话对应100  1英镑对应  100
}

export const PriceSchema = SchemaFactory.createForClass(Price)
