/**
 * SubscriptionManagementDialog - 订阅管理对话框组件
 * 包含订阅计划管理和购买记录两个标签页
 */

'use client'

import { useEffect, useState } from 'react'
import { Copy, Crown } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'
import {
  cancelSubscriptionApi,
  getOrderDetailApi,
  getOrderListApi,
  getSubscriptionListApi,
  unsubscribeApi,
} from '@/api/payment'
import type {
  Order,
  OrderListParams,
  Subscription,
  SubscriptionListParams,
} from '@/api/types/payment'
import {
  OrderStatus,
  PaymentMode,
  PaymentType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/api/types/payment'
import { cn } from '@/lib/utils'

interface SubscriptionManagementDialogProps {
  open: boolean
  onClose: () => void
}

// 状态判断辅助函数
const getVipStatusInfo = (status: string) => {
  switch (status) {
    case 'none':
      return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
    case 'trialing':
      return { isVip: true, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
    case 'monthly_once':
      return { isVip: true, isMonthly: true, isYearly: false, isAutoRenew: false, isOnce: true }
    case 'yearly_once':
      return { isVip: true, isMonthly: false, isYearly: true, isAutoRenew: false, isOnce: true }
    case 'active_monthly':
      return { isVip: true, isMonthly: true, isYearly: false, isAutoRenew: true, isOnce: false }
    case 'active_yearly':
      return { isVip: true, isMonthly: false, isYearly: true, isAutoRenew: true, isOnce: false }
    case 'active_nonrenewing':
      return { isVip: true, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
    case 'expired':
      return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
    default:
      return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
  }
}

export function SubscriptionManagementDialog({
  open,
  onClose,
}: SubscriptionManagementDialogProps) {
  const { t: tProfile } = useTransClient('profile')
  const { t: tVip } = useTransClient('vip')
  const { userInfo } = useUserStore()

  // 订单相关状态
  const [orders, setOrders] = useState<Order[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
  const [ordersPagination, setOrdersPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [subscriptionsPagination, setSubscriptionsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 订单详情弹窗状态
  const [orderDetailVisible, setOrderDetailVisible] = useState(false)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [currentOrderDetail, setCurrentOrderDetail] = useState<Order | null>(null)

  // 获取购买记录
  const fetchOrders = async (params: OrderListParams) => {
    setOrdersLoading(true)
    try {
      const response = await getOrderListApi(params)
      if (response?.code === 0 && response.data) {
        const data = response.data as any
        setOrders(data.list || [])
        setOrdersPagination({
          current: data.page || params.page,
          pageSize: data.pageSize || params.size,
          total: data.total || 0,
        })
      }
    } catch (error) {
      console.error('获取订单列表失败:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  // 获取订阅列表
  const fetchSubscriptions = async (params: SubscriptionListParams) => {
    setSubscriptionsLoading(true)
    try {
      const response: any = await getSubscriptionListApi(params)
      if (response?.code === 0 && response.data) {
        const data = response.data as any
        if (Array.isArray(data)) {
          setSubscriptions(data)
          setSubscriptionsPagination({
            current: params.page,
            pageSize: params.size,
            total: data.length,
          })
        } else {
          setSubscriptions(data.list || [])
          setSubscriptionsPagination({
            current: data.page || params.page,
            pageSize: data.pageSize || params.size,
            total: data.total || 0,
          })
        }
      }
    } catch (error) {
      console.error('获取订阅列表失败:', error)
    } finally {
      setSubscriptionsLoading(false)
    }
  }

  // 处理退订
  const handleUnsubscribe = async (subscription: Subscription) => {
    try {
      const params: any = {
        id: subscription.id,
      }
      const response = await unsubscribeApi(params)
      if (response?.code === 0) {
        toast.success(tProfile('unsubscribeSuccess'))
        fetchSubscriptions({
          page: subscriptionsPagination.current - 1,
          size: subscriptionsPagination.pageSize,
        })
      }
    } catch (error) {
      console.error('退订失败:', error)
      toast.error(tProfile('unsubscribeFailed'))
    }
  }

  // 处理恢复订阅
  const handleResumeSubscription = async (subscription: Subscription) => {
    try {
      const params: any = {
        id: subscription.id,
      }
      const response = await cancelSubscriptionApi(params)
      if (response?.code === 0) {
        toast.success(tProfile('resumeSuccess'))
        fetchSubscriptions({
          page: subscriptionsPagination.current,
          size: subscriptionsPagination.pageSize,
        })
      }
    } catch (error) {
      console.error('恢复订阅失败:', error)
      toast.error(tProfile('updateFailed'))
    }
  }

  // 获取订单详情
  const fetchOrderDetail = async (orderId: string) => {
    setOrderDetailLoading(true)
    try {
      const response: any = await getOrderDetailApi(orderId)
      if (response?.code === 0 && response.data) {
        setCurrentOrderDetail(response.data[0])
        setOrderDetailVisible(true)
      } else {
        toast.error(tProfile('getOrderDetailFailed'))
      }
    } catch (error) {
      console.error('获取订单详情失败:', error)
      toast.error(tProfile('getOrderDetailFailed'))
    } finally {
      setOrderDetailLoading(false)
    }
  }

  // 订单状态标签
  const getOrderStatusTag = (status: OrderStatus | string) => {
    const statusMap: Record<string, { variant: 'default' | 'destructive' | 'secondary', text: string }> = {
      [OrderStatus.COMPLETE]: { variant: 'default', text: tProfile('paymentSuccess') },
      [OrderStatus.OPEN]: { variant: 'secondary', text: tProfile('waitingForPayment') },
      [OrderStatus.EXPIRED]: { variant: 'destructive', text: tProfile('orderExpired') },
    }
    const config = statusMap[status as string] || { variant: 'default' as const, text: `${tProfile('status')}${status}` }
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  // 支付类型文本
  const getPaymentTypeText = (paymentType: string) => {
    const typeMap: any = {
      [PaymentType.ONCE_MONTH]: tProfile('oneTimeMonthly'),
      [PaymentType.MONTH]: tProfile('monthlySubscription'),
      [PaymentType.YEAR]: tProfile('yearlySubscription'),
    }
    return typeMap[paymentType as PaymentType] || paymentType || tProfile('unknown')
  }

  // 获取订阅模式文本
  const getSubscriptionModeText = (mode: PaymentMode | string) => {
    if (mode === PaymentMode.PAYMENT) {
      return tVip('oneTimePurchase')
    } else if (mode === PaymentMode.SUBSCRIPTION) {
      return tProfile('subscription')
    }
    return mode || tProfile('unknown')
  }

  // 复制文本
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(tProfile('copySuccess'))
  }

  // 弹窗打开时加载数据
  useEffect(() => {
    if (open) {
      fetchOrders({ page: 1, size: 10 })
      fetchSubscriptions({ page: 1, size: 10 })
    }
  }, [open])

  // 格式化日期
  const formatDate = (date: string | number) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date * 1000)
    return dateObj.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tVip('subscriptionManagement' as any)}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subscriptions">
                {tVip('subscriptionPlanManagement' as any)}
              </TabsTrigger>
              <TabsTrigger value="orders">
                {tVip('purchaseHistory' as any)}
              </TabsTrigger>
            </TabsList>

            {/* 订阅计划管理 */}
            <TabsContent value="subscriptions" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">{tVip('myMembership' as any)}</h3>
                
                {/* 会员信息卡片 */}
                {userInfo?.vipInfo && (
                  <div className="border rounded-lg p-4 mb-4 bg-card">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Crown className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {(() => {
                            if (!userInfo.vipInfo) return tVip('modal.vipInfo.monthly' as any)
                            const statusInfo = getVipStatusInfo(userInfo.vipInfo.status)
                            if (statusInfo.isYearly && statusInfo.isAutoRenew) {
                              return tVip('modal.vipInfo.yearly' as any)
                            } else if (statusInfo.isYearly && !statusInfo.isAutoRenew) {
                              return `${tVip('modal.vipInfo.yearly' as any)} (${tVip('modal.vipInfo.singleMonth' as any)})`
                            } else if (statusInfo.isMonthly && statusInfo.isAutoRenew) {
                              return tVip('modal.vipInfo.monthly' as any)
                            } else if (statusInfo.isMonthly && !statusInfo.isAutoRenew) {
                              return `${tVip('modal.vipInfo.monthly' as any)} (${tVip('modal.vipInfo.singleMonth' as any)})`
                            } else if (statusInfo.isOnce) {
                              return statusInfo.isYearly
                                ? `${tVip('modal.vipInfo.yearly' as any)} (${tVip('modal.vipInfo.singleMonth' as any)})`
                                : `${tVip('modal.vipInfo.monthly' as any)} (${tVip('modal.vipInfo.singleMonth' as any)})`
                            } else if (userInfo.vipInfo.status === 'trialing') {
                              return `${tVip('modal.vipInfo.monthly' as any)} (${tVip('modal.vipInfo.trial' as any)})`
                            } else if (userInfo.vipInfo.status === 'active_nonrenewing') {
                              return tVip('modal.vipInfo.cancelled' as any)
                            }
                            return tVip('modal.vipInfo.monthly' as any)
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {tVip('membershipExpires' as any)}: {userInfo.vipInfo.expireTime
                            ? formatDate(userInfo.vipInfo.expireTime)
                            : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 订阅列表 */}
                {subscriptionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : subscriptions.length > 0 ? (
                  <div className="space-y-4">
                    {subscriptions.map(subscription => (
                      <div
                        key={subscription.id}
                        className="border rounded-lg p-4 bg-card space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {subscription.plan === SubscriptionPlan.MONTH
                              ? tVip('modal.vipInfo.monthly2' as any)
                              : subscription.plan === SubscriptionPlan.CLOUD_SPACE_MONTH
                                ? '云空间月度'
                                : tVip('basicMembership' as any)}
                          </div>
                          <Badge
                            variant={
                              subscription.status === SubscriptionStatus.ACTIVE
                                ? 'default'
                                : subscription.status === SubscriptionStatus.CANCELED
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {subscription.status === SubscriptionStatus.ACTIVE
                              ? subscription.cancelAtPeriodEnd
                                ? tProfile('willCancelAtPeriodEnd')
                                : tProfile('subscriptionSuccess')
                              : subscription.status === SubscriptionStatus.CANCELED
                                ? tProfile('subscriptionCancelled')
                                : subscription.status === SubscriptionStatus.PAST_DUE
                                  ? tProfile('subscriptionPastDue')
                                  : subscription.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{tProfile('subscriptionMode')}:</span>
                            <span className="ml-2">
                              {subscription.plan === SubscriptionPlan.MONTH
                                ? tVip('modal.vipInfo.monthly2' as any)
                                : subscription.plan === SubscriptionPlan.CLOUD_SPACE_MONTH
                                  ? '云空间月度'
                                  : subscription.plan}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{tProfile('createTime')}:</span>
                            <span className="ml-2">{formatDate(subscription.createdAt)}</span>
                          </div>
                          {subscription.canceledAt && (
                            <div>
                              <span className="text-muted-foreground">{tProfile('cancelTime')}:</span>
                              <span className="ml-2">{formatDate(subscription.canceledAt)}</span>
                            </div>
                          )}
                          {subscription.trialEndAt && (
                            <div>
                              <span className="text-muted-foreground">{tProfile('trialEndTime')}:</span>
                              <span className="ml-2">{formatDate(subscription.trialEndAt)}</span>
                            </div>
                          )}
                          <div className="col-span-2">
                            <span className="text-muted-foreground">{tProfile('subscriptionId')}:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-xs">{subscription.id}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopy(subscription.id)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          {(subscription.status === SubscriptionStatus.ACTIVE &&
                            !subscription.cancelAtPeriodEnd) ||
                          (subscription.status === SubscriptionStatus.TRIALING &&
                            !subscription.cancelAtPeriodEnd) ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleUnsubscribe(subscription)}
                            >
                              {tProfile('cancelSubscription')}
                            </Button>
                          ) : subscription.status === SubscriptionStatus.CANCELED &&
                            subscription.cancelAtPeriodEnd ? (
                            <Button
                              size="sm"
                              onClick={() => handleResumeSubscription(subscription)}
                            >
                              {tProfile('resumeSubscription')}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}

                    {/* 分页 */}
                    {subscriptionsPagination.total > subscriptionsPagination.pageSize && (
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={subscriptionsPagination.current === 1}
                          onClick={() =>
                            fetchSubscriptions({
                              page: subscriptionsPagination.current - 1,
                              size: subscriptionsPagination.pageSize,
                            })
                          }
                        >
                          {tVip('previousPage' as any)}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {tVip('pageInfo' as any)
                            .replace('{current}', subscriptionsPagination.current.toString())
                            .replace(
                              '{total}',
                              Math.ceil(
                                subscriptionsPagination.total / subscriptionsPagination.pageSize,
                              ).toString(),
                            )}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            subscriptionsPagination.current >=
                            Math.ceil(
                              subscriptionsPagination.total / subscriptionsPagination.pageSize,
                            )
                          }
                          onClick={() =>
                            fetchSubscriptions({
                              page: subscriptionsPagination.current + 1,
                              size: subscriptionsPagination.pageSize,
                            })
                          }
                        >
                          {tVip('nextPage' as any)}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">{tVip('noAutoRenewalItems' as any)}</p>
                    <Button variant="outline">{tVip('viewMorePlans' as any)}</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 购买记录 */}
            <TabsContent value="orders" className="space-y-4">
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div
                      key={order._id}
                      className="border rounded-lg p-4 bg-card space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{tProfile('subscriptionMode')}:</span>
                          <span className="ml-2">{getSubscriptionModeText(order.mode)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{tProfile('amount')}:</span>
                          <span className="ml-2">
                            {(order.amount / 100).toFixed(2)} {order.currency}
                          </span>
                        </div>
                          <div>
                            <span className="text-muted-foreground">{tProfile('quantity')}:</span>
                            <span className="ml-2">{order.quantity || 1}</span>
                          </div>
                        <div>
                          <span className="text-muted-foreground">{tProfile('status')}:</span>
                          <span className="ml-2">{getOrderStatusTag(order.status)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{tProfile('createTime')}:</span>
                          <span className="ml-2">{formatDate(order.created)}</span>
                        </div>
                          <div>
                            <span className="text-muted-foreground">{tProfile('paymentMethod')}:</span>
                            <span className="ml-2">
                              {(order as any).payment_method || tVip('alipayPayment')}
                            </span>
                          </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{tProfile('orderId')}:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs">{order.id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleCopy(order.id)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 分页 */}
                  {ordersPagination.total > ordersPagination.pageSize && (
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersPagination.current === 1}
                        onClick={() =>
                          fetchOrders({
                            page: ordersPagination.current - 1,
                            size: ordersPagination.pageSize,
                          })
                        }
                      >
                        {tVip('previousPage' as any)}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {tVip('pageInfo' as any)
                          .replace('{current}', ordersPagination.current.toString())
                          .replace(
                            '{total}',
                            Math.ceil(ordersPagination.total / ordersPagination.pageSize).toString(),
                          )}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          ordersPagination.current >=
                          Math.ceil(ordersPagination.total / ordersPagination.pageSize)
                        }
                        onClick={() =>
                          fetchOrders({
                            page: ordersPagination.current + 1,
                            size: ordersPagination.pageSize,
                          })
                        }
                      >
                        {tVip('nextPage' as any)}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{tProfile('noOrderRecords')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 订单详情弹窗 */}
      {currentOrderDetail && (
        <Dialog open={orderDetailVisible} onOpenChange={setOrderDetailVisible}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{tProfile('orderDetails')}</DialogTitle>
            </DialogHeader>
            {orderDetailLoading ? (
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tProfile('orderId')}:</span>
                  <span className="font-mono">{currentOrderDetail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tProfile('internalId')}:</span>
                  <span className="font-mono">{currentOrderDetail._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tProfile('packageType')}:</span>
                  <span>{getPaymentTypeText(currentOrderDetail.metadata?.payment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tProfile('subscriptionMode')}:</span>
                  <span>{currentOrderDetail.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tProfile('amount')}:</span>
                  <span>
                    CNY {(currentOrderDetail.amount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tProfile('status')}:</span>
                  <span>{getOrderStatusTag(currentOrderDetail.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tProfile('createTime')}:</span>
                  <span>{formatDate(currentOrderDetail.created)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tProfile('paymentMethod')}:</span>
                  <span>
                    {(currentOrderDetail as any).payment_method || tProfile('unknown')}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

