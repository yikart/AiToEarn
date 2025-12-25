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
    url: 'payment/withdraw/all',
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

/**
 * 创建钱包账户
 */
export function createWalletAccountApi(params: {
  account?: string
  email?: string
  idCard?: string
  isDefault?: boolean
  phone?: string
  stripeConnectedAccountId?: string
  type: 'alipay' | 'stripe_connect' | 'wechat_pay'
  userName?: string
  [property: string]: any
}) {
  return request<any>({
    url: 'payment/user-wallet-account',
    method: 'POST',
    data: params,
  })
}

/**
 * 获取钱包账户列表
 */
export function getWalletAccountListApi(params: {
  page?: number
  pageSize?: number
  type?: 'alipay' | 'stripe_connect' | 'wechat_pay'
  [property: string]: any
}) {
  return request<{
    page: number
    pageSize: number
    totalPages: number
    total: number
    list: any[]
  }>({
    url: 'payment/user-wallet-account',
    method: 'GET',
    params,
  })
}

/**
 * 获取钱包账户详情
 */
export function getWalletAccountDetailApi(id: string) {
  return request<any>({
    url: `payment/user-wallet-account/${id}`,
    method: 'GET',
  })
}

/**
 * 更新钱包账户
 */
export function updateWalletAccountApi(id: string, params: {
  email?: string
  idCard?: string
  phone?: string
  userName?: string
  [property: string]: any
}) {
  return request<any>({
    url: `payment/user-wallet-account/${id}`,
    method: 'PATCH',
    data: params,
  })
}

/**
 * 删除钱包账户
 */
export function deleteWalletAccountApi(id: string) {
  return request<any>({
    url: `payment/user-wallet-account/${id}`,
    method: 'DELETE',
  })
}

/**
 * 设置为默认钱包账户
 */
export function setDefaultWalletAccountApi(id: string) {
  return request<any>({
    url: `payment/user-wallet-account/${id}/set-default`,
    method: 'POST',
  })
}

/**
 * 获取 Stripe / Connected Account 列表（新的商家钱包接口）
 */
export function getConnectedAccountListApi(params: {
  email?: string
  page?: number
  pageSize?: number
  search?: string
  status?: string
  [property: string]: any
}) {
  return request<any>({
    url: 'payment/connected-account',
    method: 'GET',
    params,
  })
}

/**
 * 创建 Connected Account（商家账户）
 */
export function createConnectedAccountApi(params: {
  country: string
  email: string
  entityType: 'company' | 'individual'
  [property: string]: any
}) {
  return request<any>({
    url: 'payment/connected-account',
    method: 'POST',
    data: params,
  })
}

/**
 * 获取 Connected Account 的 Onboarding 链接
 */
export function getConnectedAccountOnboardingLinkApi(accountId: string) {
  return request<any>({
    url: `payment/connected-account/${accountId}/onboarding-link`,
    method: 'GET',
  })
}

/**
 * 获取 Connected Account 详情
 */
export function getConnectedAccountDetailApi(accountId: string) {
  return request<any>({
    url: `payment/connected-account/${accountId}`,
    method: 'GET',
  })
}

/**
 * 刷新 Connected Account 状态（同步 Stripe）
 */
export function refreshConnectedAccountStatusApi(accountId: string) {
  return request<any>({
    url: `payment/connected-account/${accountId}/refresh`,
    method: 'POST',
  })
}

/**
 * 获取商家后台登录链接（dashboard link）
 */
export function getConnectedAccountDashboardLinkApi(accountId: string) {
  return request<any>({
    url: `payment/connected-account/${accountId}/dashboard-link`,
    method: 'GET',
  })
}