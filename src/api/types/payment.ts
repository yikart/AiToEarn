// 订单状态枚举 (根据实际API返回的数字状态)
export enum OrderStatus {
  SUCCEEDED = 1,    // 支付成功
  CREATED = 2,      // 订单创建成功等待支付
  REFUNDED = 3,     // 退款成功  
  EXPIRED = 4       // 订单取消/过期
}

// 套餐类型枚举
export enum PaymentType {
  MONTH = 'month',        // 月度订阅
  YEAR = 'year',          // 年度订阅
  ONCE_MONTH = 'onceMonth', // 一次性月度
  ONCE_YEAR = 'onceYear'   // 一次性年度
}

// 订单类型 (根据实际API返回结构)
export interface Order {
  _id: string;
  amount: number;
  amount_refunded: number;
  created: number; // 时间戳
  currency: string;
  customer: any;
  customer_details: any;
  expires_at: number;
  id: string; // stripe checkout session id
  info: any;
  metadata: {
    userId: string;
    payment: string;
    mode: string;
  };
  mode: string;
  payment_intent: string | null;
  price: string;
  status: OrderStatus;
  subscription: any;
  success_url: string;
  url: string;
  userId: string;
}

// 订单查询参数
export interface OrderListParams {
  price?: string;
  page: number;
  size: number;
}

// 订阅信息
export interface Subscription {
  id: string;
  userId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt: string;
  price: string;
  billingCycle: 'monthly' | 'yearly';
}

// 退款参数
export interface RefundParams {
  charge: string;
  payment_intent: string;
  userId: string;
}

// 退订参数
export interface UnsubscribeParams {
  id: string;
  userId: string;
}

// API响应类型
export interface PaymentApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 分页响应 (根据实际API返回结构: data.count 和 data.list)
export interface PaginatedResponse<T> {
  count: number;
  list: T[];
} 