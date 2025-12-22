import type {
  Order,
  OrderListParams,
  PaginatedResponse,
  PaymentApiResponse,
  RefundParams,
  SubscriptionListParams,
  UnsubscribeParams,
} from './types/payment'
import { request } from '@/utils/request'

/**
 * 获取订单列表
 */
export function getOrderListApi(params: OrderListParams) {
  return request<PaginatedResponse<Order>>({
    url: 'payment/checkout',
    method: 'GET',
    params,
  })
}

/**
 * 查询单个订单
 */
export function getOrderDetailApi(id: string) {
  return request<Order>({
    url: `payment/checkout/${id}`,
    method: 'GET',
  })
}

/**
 * 获取订阅列表
 */
export function getSubscriptionListApi(params: SubscriptionListParams) {
  return request<PaginatedResponse<Order>>({
    url: 'payment/subscriptions',
    method: 'GET',
    params,
  })
}

/**
 * 订单退款
 */
export function refundOrderApi(params: RefundParams) {
  return request<any>({
    url: 'payment/refund',
    method: 'POST',
    data: params,
  })
}

/**
 * 退订
 */
export function unsubscribeApi(params: any) {
  return request<any>({
    url: `payment/subscriptions/${params.id}/cancel`,
    method: 'POST',
    data: params,
  })
}

/**
 * 恢复订阅
 */
export function cancelSubscriptionApi(params: any) {
  return request<any>({
    url: `payment/subscriptions/${params.id}/resume`,
    method: 'POST',
    data: params,
  })
}

/**
 * 获取收入记录列表
 */
export function getIncomeListApi(params: {
  currency?: 'CNY' | 'UNK' | 'USD'
  page?: number
  pageSize?: number
  status?: 'pending' | 'withdrawn'
  type?: 'reward_back' | 'task' | 'task_back' | 'task_withdraw'
  [property: string]: any
}) {
  return request<PaginatedResponse<any>>({
    url: 'payment/income',
    method: 'GET',
    params,
  })
}

/**
 * 获取收入记录详情
 */
export function getIncomeDetailApi(id: string) {
  return request<any>({
    url: `payment/income/${id}`,
    method: 'GET',
  })
}

/**
 * 创建提现申请
 */
export function createWithdrawApi(params: {
  amount: number
  currency: 'CNY' | 'UNK' | 'USD'
  incomeRecordIds?: string[]
  metadata?: { [key: string]: any }
  relId?: string
  type: 'reward' | 'task'
  walletAccountId: string
  [property: string]: any
}) {
  return request<any>({
    url: 'payment/withdraw',
    method: 'POST',
    data: params,
  })
}

/**
 * 获取提现记录列表
 */
export function getWithdrawListApi(params: {
  currency?: 'CNY' | 'UNK' | 'USD'
  page?: number
  pageSize?: number
  status?: 'approved' | 'failed' | 'paid' | 'pending' | 'rejected'
  type?: 'reward' | 'task'
  [property: string]: any
}) {
  return request<PaginatedResponse<any>>({
    url: 'payment/withdraw',
    method: 'GET',
    params,
  })
}

/**
 * 提现全部待提现收入
 */
export function withdrawAllPendingApi(params: {
  currency: 'CNY' | 'UNK' | 'USD'
  type?: 'reward' | 'task'
  walletAccountId: string
  [property: string]: any
}) {
  return request<any>({
    url: 'payment/withdraw/all-pending',
    method: 'POST',
    data: params,
  })
}

/**
 * 获取提现记录详情
 */
export function getWithdrawDetailApi(id: string) {
  return request<any>({
    url: `payment/withdraw/${id}`,
    method: 'GET',
  })
}

/**
 * 取消提现申请
 */
export function cancelWithdrawApi(id: string) {
  return request<any>({
    url: `payment/withdraw/${id}/cancel`,
    method: 'POST',
  })
}