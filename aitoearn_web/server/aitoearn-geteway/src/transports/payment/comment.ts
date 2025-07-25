import { UserVipCycleType } from '../user/comment'

export interface ICheckout {
  id?: string
  success_url: string
  mode: ICheckoutMode
  line_items?: ILineItems[]
}

export interface IPaymentConfig {
  success_url: string
}

export interface ILineItems {
  price?: string
  quantity?: number
  price_data?: IPriceData
}

export interface IPriceData {
  currency?: ICurrency
  recurring?: IRecurring
  unit_amount?: number
  product?: string
}

export interface IRecurring {
  interval: IInterval
  interval_count: number // 不大于3年
}

export enum IInterval {
  day = 'day',
  month = 'month',
  year = 'year',
}

export enum IPayment {
  month = 'month',
  year = 'year',
  onceYear = 'onceYear',
  onceMonth = 'onceMonth',
}

export enum RefundStatus {
  pending = 'pending',
  succeeded = 'succeeded',
  failed = 'failed',
  canceled = 'canceled',
}

export enum ICurrency {
  cny = 'cny', //  人民币
  usd = 'usd', //  美刀
  gbp = 'gbp', // 英镑
}

export enum ICheckoutMode {
  payment = 'payment',
  subscription = 'subscription',
}

export const IPaymentToUserVip: { [key: string]: UserVipCycleType } = {
  [IPayment.year]: UserVipCycleType.YEAR,
  [IPayment.month]: UserVipCycleType.MONTH,
  [IPayment.onceYear]: UserVipCycleType.YEAR,
  [IPayment.onceMonth]: UserVipCycleType.MONTH,
}

export interface IMetadata {
  userId?: string // 付款后需要和订单验证用户的回调
  mode?: ICheckoutMode //
  payment?: IPayment
}

export enum IWebhookType {
  'payment_intent.created' = 'payment_intent.created', // --status 2  订单创建成功等待支付
  'charge.refunded' = 'charge.refunded', // --status 3  退款成功
  'checkout.session.expired' = 'checkout.session.expired', // --status 4 订单取消
  'customer.subscription.created' = 'customer.subscription.created', // 创建订阅
  'customer.subscription.deleted' = 'customer.subscription.deleted', // 取消订阅
  'checkout.session.completed' = 'checkout.session.completed', // 订单完成  -- status： 1   支付成功
}

export enum ICheckoutStatus {
  succeeded = 1, //  status： 1   支付成功
  created = 2, // --status 2  订单创建成功等待支付
  refunded = 3, // --status 3  退款成功
  expired = 4, //  订单取消
}
