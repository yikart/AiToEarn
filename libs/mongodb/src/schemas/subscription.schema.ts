import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ICurrency, ISubscriptionStatus } from '@yikart/stripe'

@Schema({
  collection: 'subscription',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Subscription {
  @Prop({
    type: String,
    required: true,
    index: true,
    unique: true,
  })
  id: string

  @Prop({
    type: String,
    required: false,
    index: true,
  })
  userId: string

  @Prop({
    type: String,
    required: false,
    index: true,
  })
  customer: string

  @Prop({
    type: String,
    required: false,
  })
  currency: ICurrency

  @Prop({
    type: Number,
    required: true,
    default: ISubscriptionStatus.canceled,
  })
  status: ISubscriptionStatus

  @Prop({
    type: Number,
    required: false,
  })
  created: number // 订阅开始时间

  @Prop({ type: Object, required: false, default: {} })
  info?: object // 订阅的完整信息

  @Prop({ type: Object, required: false, default: {} })
  metadata?: object // 元数据
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)
