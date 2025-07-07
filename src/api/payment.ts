import { request } from '@/utils/request';
import type { 
  Order, 
  OrderListParams, 
  Subscription, 
  RefundParams, 
  UnsubscribeParams,
  PaymentApiResponse,
  PaginatedResponse
} from './types/payment';

/**
 * 获取订单列表
 */
export const getOrderListApi = (params: OrderListParams) => {
  return request<PaginatedResponse<Order>>({
    url: 'payment/checkout',
    method: 'GET',
    params
  });
};

/**
 * 查询单个订单
 */
export const getOrderDetailApi = (id: string) => {
  return request<Order>({
    url: `payment/checkout/${id}`,
    method: 'GET'
  });
};

/**
 * 获取订阅列表
 */
export const getSubscriptionListApi = () => {
  return request<Subscription[]>({
    url: 'payment/subscription',
    method: 'GET'
  });
};

/**
 * 订单退款
 */
export const refundOrderApi = (params: RefundParams) => {
  return request<any>({
    url: 'payment/refund',
    method: 'POST',
    data: params
  });
};

/**
 * 退订
 */
export const unsubscribeApi = (params: UnsubscribeParams) => {
  return request<any>({
    url: 'payment/unsubscribe',
    method: 'POST',
    data: params
  });
}; 