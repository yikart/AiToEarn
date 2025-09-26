import { ICurrency } from '../stripe.interface'

export interface ICheckout {
  id?: string
  success_url: string
  mode: ICheckoutMode
  line_items?: ILineItems[]
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

export enum ICheckoutMode {
  payment = 'payment',
  subscription = 'subscription',
}

export const IPaymentToMode: Record<IPayment, ICheckoutMode> = {
  [IPayment.year]: ICheckoutMode.subscription,
  [IPayment.month]: ICheckoutMode.subscription,
  [IPayment.onceYear]: ICheckoutMode.payment,
  [IPayment.onceMonth]: ICheckoutMode.payment,
  [IPayment.points]: ICheckoutMode.payment,
  [IPayment.cloudSpaceMonth]: ICheckoutMode.subscription,
  [IPayment.cloudSpaceOnceMonth]: ICheckoutMode.payment,
}

export const IPriceId: { [key: string]: { [key: string]: string } } = {
  [ICheckoutMode.subscription]: {
    [IPayment.month]: 'price_1S8NOEClgjQcLawNySA59RXH', // 19刀连续包月
    [IPayment.year]: 'price_1S8NPPClgjQcLawNRNUseHhF', // 144刀连续包年
    [IPayment.cloudSpaceMonth]: 'price_1S7qBGClgjQcLawNwEO5ZRYT', // cloudSpace 连续包月19刀
  },
  [ICheckoutMode.payment]: {
    [IPayment.onceMonth]: 'price_1S8NQYClgjQcLawNNXv7JTxg', // 一次性包月是25刀
    [IPayment.onceYear]: 'price_1RxSRlClgjQcLawNNW524ETm', // 一次性包年是120刀
    [IPayment.points]: 'price_1RzDoQClgjQcLawN1SQa6o9o', // 积分是15刀1000积分
    [IPayment.cloudSpaceOnceMonth]: 'price_1S7qByClgjQcLawNA20nlTb5', // cloudSpace 一次性包月29刀
  },
} as const

export enum ICheckoutStatus {
  succeeded = 1, //  status： 1   支付成功
  created = 2, // --status 2  订单创建成功等待支付
  refunded = 3, // --status 3  退款成功
  expired = 4, //  订单取消
}

export enum IIsAdmin {
  client = 0,
  admin = 1,
}

export enum IFlagTrialPeriodDays {
  false = 0,
  true = 1,
}
