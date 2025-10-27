import { VipStatus } from '@yikart/mongodb'
import { ICreateCloudSpace } from '../../payment/dto/payment.dto'

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
  points = 'points',
  cloudSpaceMonth = 'cloudSpaceMonth',
  cloudSpaceOnceMonth = 'cloudSpaceOnceMonth',
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

export const IPaymentToUserVip: { [key: string]: VipStatus } = {
  [IPayment.year]: VipStatus.active_yearly,
  [IPayment.month]: VipStatus.active_monthly,
  [IPayment.onceYear]: VipStatus.yearly_once,
  [IPayment.onceMonth]: VipStatus.monthly_once,
}

export interface IMetadata {
  userId?: string // 付款后需要和订单验证用户的回调
  mode?: ICheckoutMode //
  payment?: IPayment
  cloudSpace?: ICreateCloudSpace
  cloudSpaceId?: string
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

export enum IFlagTrialPeriodDays {
  false = 0,
  true = 1,
}

export const IPointsDescription: { [key: string]: string } = {
  [ICheckoutStatus.refunded]: '减少积分: ',
  [ICheckoutStatus.succeeded]: '增加积分: ',
}

export enum WithdrawRecordType {
  TASK = 'task', // 任务
  REWARD = 'reward', // 奖励
}

export enum WithdrawRecordStatus {
  WAIT = 0,
  SUCCESS = 1,
  FAIL = -1,
}

export interface WithdrawRecord {
  id: string
  userId: string
  flowId?: string
  userWalletAccountId?: string
  type: WithdrawRecordType
  amount: number
  incomeRecordId?: string
  relId?: string
  desc?: string // 备注
  screenshotUrls?: string[] // 发放截图列表
  status: WithdrawRecordStatus
  metadata?: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

export enum IPaymentStatus {
  no_payment_required = 'no_payment_required',
  paid = 'paid',
  unpaid = 'unpaid',
}
