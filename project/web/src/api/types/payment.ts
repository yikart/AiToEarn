// 订单状态枚举 (根据实际API返回)
export enum OrderStatus {
  OPEN = 'open', // 待支付
  COMPLETE = 'complete', // 已完成
  EXPIRED = 'expired', // 已过期
}

// 支付模式枚举
export enum PaymentMode {
  PAYMENT = 'payment', // 一次性支付
  SUBSCRIPTION = 'subscription', // 订阅
}

// 订阅状态枚举
export enum SubscriptionStatus {
  ACTIVE = 'active', // 活跃
  CANCELED = 'canceled', // 已取消
  PAST_DUE = 'past_due', // 逾期
  TRIALING = 'trialing', // 试用中
}

// 订阅计划类型枚举
export enum SubscriptionPlan {
  MONTH = 'month', // 月度订阅
  CLOUD_SPACE_MONTH = 'cloudSpaceMonth', // 云空间月度订阅
}

// 套餐类型枚举
export enum PaymentType {
  MONTH = 'month', // 月度订阅
  YEAR = 'year', // 年度订阅
  ONCE_MONTH = 'onceMonth', // 一次性月度
  ONCE_YEAR = 'onceYear', // 一次性年度
}

// 订阅信息类型 (根据新的API返回结构)
export interface Subscription {
  id: string // 订阅 ID (必需)
  userId: string // 用户 ID (必需)
  stripeCustomerId: string // Stripe 客户 ID (必需)
  plan: SubscriptionPlan // 订阅计划类型 (必需)
  status: SubscriptionStatus // 订阅状态 (必需)
  cancelAtPeriodEnd: boolean // 是否在当前计费周期结束时取消 (必需)
  createdAt: string // 订阅创建时间 (必需, ISO 8601格式)
  canceledAt?: string // 订阅取消时间 (可选, ISO 8601格式)
  trialEndAt?: string // 试用期结束时间 (可选, ISO 8601格式)
}

// 订单类型 (根据实际API返回结构)
export interface Order {
  _id: string
  amount: number
  amount_refunded: number
  created: number // 时间戳
  currency: string
  customer: any
  customer_details: any
  expires_at: number
  id: string // stripe checkout session id
  info: any
  metadata: {
    userId: string
    payment: string
    mode: string
  }
  mode: PaymentMode // 支付模式 (必需)
  payment_intent: string | null
  price: string
  quantity: number // 购买数量 (必需)
  status: OrderStatus // 支付状态 (必需)
  subscription: any
  success_url: string
  url: string
  userId: string
}

// 订单查询参数
export interface OrderListParams {
  price?: string
  page: number
  size: number
}

// 订阅列表查询参数
export interface SubscriptionListParams {
  page: number
  size: number
}

// 退款参数
export interface RefundParams {
  charge: string
  payment_intent: string
  userId: string
}

// 退订参数
export interface UnsubscribeParams {
  id: string
  userId: string
}

// API响应类型
export interface PaymentApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页响应 (根据实际API返回结构: data.count 和 data.list)
export interface PaginatedResponse<T> {
  count: number
  list: T[]
}
