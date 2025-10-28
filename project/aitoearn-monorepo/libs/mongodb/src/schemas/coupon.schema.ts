import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ICurrency, IDuration } from '@yikart/stripe'
import { Int32 } from 'mongodb'

@Schema({
  collection: 'coupon',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Coupon {
  @Prop({ type: String, required: true, index: true, unique: true })
  id: string

  @Prop({ type: String, required: true, index: true })
  duration: IDuration

  @Prop({ type: String, required: false, default: ICurrency.usd })
  currency?: ICurrency // 货币

  @Prop({ type: Int32, required: false })
  created?: number // 价格  正整数  每种货币的最小单位   1美刀的话对应  100    1元的话对应100  1英镑对应  100
}

export const CouponSchema = SchemaFactory.createForClass(Coupon)
