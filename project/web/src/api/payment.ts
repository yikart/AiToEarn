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
