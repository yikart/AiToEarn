import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ICheckoutMode, ICheckoutStatus, ICurrency, IPayment, Stripe } from '@yikart/stripe'

export interface CheckoutMetadata {
  userId: string
  payment: IPayment
  mode: ICheckoutMode
  [key: string]: any
}

@Schema({
  collection: 'checkout',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Checkout {
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
    index: true,
  })
  payment_intent: string | null

  @Prop({ type: String, required: false, index: true })
  charge?: string // 订单chargeId

  @Prop({
    type: String,
    required: false,
    index: true,
    default: null,
  })
  subscription: string | null

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  mode: ICheckoutMode

  @Prop({
    type: String,
    required: false,
    index: true,
  })
  price: string

  @Prop({
    type: String,
    required: false,
  })
  success_url: string

  @Prop({
    type: String,
    required: false,
  })
  currency: ICurrency

  @Prop({
    type: Number,
    required: true,
    default: ICheckoutStatus.created,
  })
  status: ICheckoutStatus

  @Prop({
    type: Number,
    required: true,
  })
  amount: number // 收款金额

  @Prop({
    type: Number,
    required: true,
  })
  amount_total: number // 实付金额

  @Prop({
    type: Number,
    required: false,
  })
  quantity: number // 购买数目

  @Prop({
    type: Number,
    required: false,
    default: 0,
  })
  amount_refunded: number // 已退款金额

  @Prop({
    type: String,
    required: false,
    index: true,
  })
  url: string // 支付连接

  @Prop({
    type: Number,
    required: false,
  })
  created: number // 支付连接创建时间

  @Prop({
    type: Number,
    required: false,
  })
  expires_at: number // 支付连接过期时间

  @Prop({ type: Object, required: false, default: {} })
  info?: object | null // 订单的完整信息

  @Prop({ type: Object, required: false, default: {} })
  chargeInfo?: Stripe.Charge | null // charge的完整信息

  @Prop({ type: Object, required: false, default: {} })
  metadata: CheckoutMetadata // 元数据

  @Prop({ type: Object, required: false, default: {} })
  customer_details?: object | null // 客户的完整信息
}

export const CheckoutSchema = SchemaFactory.createForClass(Checkout)
