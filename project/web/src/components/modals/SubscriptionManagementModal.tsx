/**
 * SubscriptionManagementModal - 订阅管理弹窗
 * 管理用户订阅状态、购买记录等
 */

'use client'

import type {
  Order,
  OrderListParams,
  RefundParams,
  Subscription,
  SubscriptionListParams,
} from '@/api/types/payment'
import { Button, Descriptions, Tabs, Tag } from 'antd'
import { toast } from '@/lib/toast'
import { Modal } from '@/components/ui/modal'
import Image from 'next/image'
import { memo, useEffect, useState } from 'react'
import {
  cancelSubscriptionApi,
  getOrderDetailApi,
  getOrderListApi,
  getSubscriptionListApi,
  refundOrderApi,
  unsubscribeApi,
} from '@/api/payment'
import {
  OrderStatus,
  PaymentMode,
  PaymentType,
  SubscriptionPlan,
  SubscriptionStatus,
  UnsubscribeParams,
} from '@/api/types/payment'
import { useTransClient } from '@/app/i18n/client'
import plusvip from '@/assets/images/plusvip.png'

import { useUserStore } from '@/store/user'
import styles from './subscriptionManagementModal.module.css'

const { TabPane } = Tabs

interface SubscriptionManagementModalProps {
  open: boolean
  onClose: () => void
}

const SubscriptionManagementModal = memo(({ open, onClose }: SubscriptionManagementModalProps) => {
  const { t: tProfile } = useTransClient('profile')
  const { t: tVip } = useTransClient('vip')
  const { userInfo } = useUserStore()

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
    }
    catch (error) {
      console.error('获取订单列表失败:', error)
    }
    finally {
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
        // 如果返回的是数组,直接使用;如果是对象,取list字段
        if (Array.isArray(data)) {
          setSubscriptions(data)
          setSubscriptionsPagination({
            current: params.page,
            pageSize: params.size,
            total: data.length,
          })
        }
        else {
          setSubscriptions(data.list || [])
          setSubscriptionsPagination({
            current: data.page || params.page,
            pageSize: data.pageSize || params.size,
            total: data.total || 0,
          })
        }
      }
    }
    catch (error) {
      console.error('获取订阅列表失败:', error)
    }
    finally {
      setSubscriptionsLoading(false)
    }
  }

  // 处理退款
  const handleRefund = async (order: Order) => {
    try {
      const params: RefundParams = {
        charge: order.id,
        payment_intent: order.payment_intent || order.id,
        userId: userInfo?.id || '',
      }
      const response = await refundOrderApi(params)
      if (response?.code === 0) {
        toast.success(tProfile('refundSubmitted'))
        fetchOrders({ page: ordersPagination.current - 1, size: ordersPagination.pageSize })
      }
      else {
        toast.error(response?.message || tProfile('refundFailed'))
      }
    }
    catch (error) {
      console.error('退款失败:', error)
      toast.error(tProfile('refundFailed'))
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
        fetchSubscriptions({ page: subscriptionsPagination.current - 1, size: subscriptionsPagination.pageSize })
      }
    }
    catch (error) {
      console.error('退订失败:', error)
    }
  }

  const handleResumeSubscription = async (subscription: Subscription) => {
    try {
      const params: any = {
        id: subscription.id,
      }
      const response = await cancelSubscriptionApi(params)
      if (response?.code === 0) {
        toast.success(tProfile('resumeSuccess' as any))
        fetchSubscriptions({ page: subscriptionsPagination.current, size: subscriptionsPagination.pageSize })
      }
    }
    catch (error) {
      console.error('恢复订阅失败:', error)
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
      }
      else {
        toast.error(tProfile('getOrderDetailFailed'))
      }
    }
    catch (error) {
      console.error('获取订单详情失败:', error)
      toast.error(tProfile('getOrderDetailFailed'))
    }
    finally {
      setOrderDetailLoading(false)
    }
  }

  // 订单状态标签
  const getOrderStatusTag = (status: OrderStatus | string) => {
    const statusMap: Record<string, { color: string, text: string }> = {
      [OrderStatus.COMPLETE]: { color: 'green', text: tProfile('paymentSuccess') },
      [OrderStatus.OPEN]: { color: 'orange', text: tProfile('waitingForPayment') },
      [OrderStatus.EXPIRED]: { color: 'red', text: tProfile('orderExpired' as any) },
    }
    const config = statusMap[status as string] || { color: 'default', text: `${tProfile('status')}${status}` }
    return <Tag color={config.color}>{config.text}</Tag>
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

  // 获取订阅模式文本 (根据 mode 字段)
  const getSubscriptionModeText = (mode: PaymentMode | string) => {
    if (mode === PaymentMode.PAYMENT) {
      return tVip('oneTimePurchase' as any) // 一次性支付
    }
    else if (mode === PaymentMode.SUBSCRIPTION) {
      return tProfile('subscription' as any) // 订阅
    }
    return mode || tProfile('unknown')
  }

  // 弹窗打开时加载数据
  useEffect(() => {
    if (open) {
      fetchOrders({ page: 1, size: 10 })
      fetchSubscriptions({ page: 1, size: 10 })
    }
  }, [open])

  return (
    <>
      <Modal
        title={tVip('subscriptionManagement' as any)}
        open={open}
        onCancel={onClose}
        footer={null}
        width={1000}
        className={styles.subscriptionModal}
        destroyOnClose
      >
        <div className={styles.modalContent}>
          <Tabs defaultActiveKey="subscriptions">
            <TabPane tab={tVip('subscriptionPlanManagement' as any)} key="subscriptions">
              <div className={styles.myMembership}>
                <h3>{tVip('myMembership' as any)}</h3>
                <div className={styles.membershipCard}>
                  <div className={styles.membershipInfo}>
                    <div className={styles.membershipIcon}>
                      <Image src={plusvip} alt="plusvip" style={{ width: 28, height: 'auto', marginTop: -5 }} />
                    </div>
                    <div className={styles.membershipDetails}>
                      <div className={styles.membershipName}>
                        {(() => {
                          if (!userInfo?.vipInfo)
                            return tVip('modal.vipInfo.monthly' as any)
                          const statusInfo = getVipStatusInfo(userInfo.vipInfo.status)
                          if (statusInfo.isYearly && statusInfo.isAutoRenew) {
                            return tVip('modal.vipInfo.yearly' as any)
                          }
                          else if (statusInfo.isYearly && !statusInfo.isAutoRenew) {
                            return `${tVip('modal.vipInfo.yearly' as any)} (${tVip('modal.vipInfo.singleMonth' as any)})`
                          }
                          else if (statusInfo.isMonthly && statusInfo.isAutoRenew) {
                            return tVip('modal.vipInfo.monthly' as any)
                          }
                          else if (statusInfo.isMonthly && !statusInfo.isAutoRenew) {
                            return `${tVip('modal.vipInfo.monthly' as any)} (${tVip('modal.vipInfo.singleMonth' as any)})`
                          }
                          else if (statusInfo.isOnce) {
                            return statusInfo.isYearly ? `${tVip('modal.vipInfo.yearly' as any)} (${tVip('modal.vipInfo.singleMonth' as any)})` : `${tVip('modal.vipInfo.monthly' as any)} (${tVip('modal.vipInfo.singleMonth' as any)})`
                          }
                          else if (userInfo.vipInfo.status === 'trialing') {
                            return `${tVip('modal.vipInfo.monthly' as any)} (${tVip('modal.vipInfo.trial' as any)})`
                          }
                          else if (userInfo.vipInfo.status === 'active_nonrenewing') {
                            return tVip('modal.vipInfo.cancelled' as any)
                          }
                          return tVip('modal.vipInfo.monthly' as any)
                        })()}
                      </div>
                      <div>

                        <div className={styles.membershipExpire}>
                          {
                            tVip('membershipExpires' as any)
                          }
                        </div>
                        <div className={styles.membershipStatus}>
                          {userInfo?.vipInfo?.expireTime
                            ? new Date(userInfo.vipInfo.expireTime).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '2025-09-29 15:04'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 根据 autoContinue 显示不同的内容 */}
                <div className={styles.autoRenewal}>

                  {
                    subscriptions.length
                      ? (
                          <div className={styles.subscriptionCards}>
                            {subscriptions.map(subscription => (
                              <div key={subscription.id} className={styles.subscriptionCard}>
                                <div className={styles.subscriptionHeader}>
                                  <div className={styles.subscriptionTitle}>
                                    {subscription.plan === SubscriptionPlan.MONTH
                                      ? tVip('modal.vipInfo.monthly2' as any)
                                      : subscription.plan === SubscriptionPlan.CLOUD_SPACE_MONTH
                                        ? '云空间月度'
                                        : tVip('basicMembership' as any)}
                                  </div>
                                </div>
                                <div className={styles.subscriptionDetails}>
                                  <div className={styles.subscriptionDetailItem}>
                                    <span className={styles.detailLabel}>
                                      {tProfile('subscriptionMode')}
                                      :
                                    </span>
                                    <span className={styles.detailValue}>
                                      {subscription.plan === SubscriptionPlan.MONTH
                                        ? tVip('modal.vipInfo.monthly2' as any)
                                        : subscription.plan === SubscriptionPlan.CLOUD_SPACE_MONTH
                                          ? '云空间月度'
                                          : subscription.plan}
                                    </span>
                                  </div>
                                  <div className={styles.subscriptionDetailItem}>
                                    <span className={styles.detailLabel}>
                                      {tProfile('createTime')}
                                      :
                                    </span>
                                    <span className={styles.detailValue}>
                                      {new Date(subscription.createdAt).toLocaleString('zh-CN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  {subscription.canceledAt && (
                                    <div className={styles.subscriptionDetailItem}>
                                      <span className={styles.detailLabel}>
                                        {tProfile('cancelTime' as any)}
                                        :
                                      </span>
                                      <span className={styles.detailValue}>
                                        {new Date(subscription.canceledAt).toLocaleString('zh-CN', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {subscription.trialEndAt && (
                                    <div className={styles.subscriptionDetailItem}>
                                      <span className={styles.detailLabel}>
                                        {tProfile('trialEndTime' as any)}
                                        :
                                      </span>
                                      <span className={styles.detailValue}>
                                        {new Date(subscription.trialEndAt).toLocaleString('zh-CN', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  <div className={styles.subscriptionDetailItem}>
                                    <span className={styles.detailLabel}>
                                      {tProfile('subscriptionId')}
                                      :
                                    </span>
                                    <span className={styles.detailValue}>
                                      {subscription.id}
                                      <Button
                                        type="text"
                                        size="small"
                                        className={styles.copyBtn}
                                        onClick={() => {
                                          navigator.clipboard.writeText(subscription.id)
                                          toast.success(tProfile('copySuccess'))
                                        }}
                                      >
                                        📋
                                      </Button>
                                    </span>
                                  </div>
                                  <div className={styles.subscriptionDetailItem}>
                                    <span className={styles.detailLabel}>
                                      {tProfile('status')}
                                      :
                                    </span>
                                    <span className={styles.detailValue}>
                                      {subscription.status === SubscriptionStatus.ACTIVE
                                        ? (
                                            <Tag color="green" style={{ marginRight: 0, marginLeft: 6 }}>
                                              {subscription.cancelAtPeriodEnd ? tProfile('willCancelAtPeriodEnd' as any) : tProfile('subscriptionSuccess')}
                                            </Tag>
                                          )
                                        : subscription.status === SubscriptionStatus.CANCELED
                                          ? (
                                              <Tag color="red" style={{ marginRight: 0, marginLeft: 6 }}>{tProfile('subscriptionCancelled')}</Tag>
                                            )
                                          : subscription.status === SubscriptionStatus.PAST_DUE
                                            ? (
                                                <Tag color="orange" style={{ marginRight: 0, marginLeft: 6 }}>{tProfile('subscriptionPastDue' as any)}</Tag>
                                              )
                                            : (
                                                <Tag color="default" style={{ marginRight: 0, marginLeft: 6 }}>{subscription.status}</Tag>
                                              )}
                                    </span>
                                  </div>
                                  <div className={styles.subscriptionDetailItem}>
                                    <span className={styles.detailLabel}>
                                      {tProfile('actions')}
                                      :
                                    </span>
                                    <span className={styles.detailValue}>
                                      {(subscription.status === SubscriptionStatus.ACTIVE && !subscription.cancelAtPeriodEnd || subscription.status === SubscriptionStatus.TRIALING && !subscription.cancelAtPeriodEnd) && (
                                        <Button
                                          size="small"
                                          danger
                                          style={{ fontSize: 12 }}
                                          onClick={() => handleUnsubscribe(subscription)}
                                        >
                                          {tProfile('cancelSubscription')}
                                        </Button>
                                      )}

                                      {
                                        subscription.status === SubscriptionStatus.CANCELED && subscription.cancelAtPeriodEnd && (
                                          <Button
                                            size="small"
                                            type="primary"
                                            style={{ fontSize: 12 }}
                                            onClick={() => handleResumeSubscription(subscription)}
                                          >
                                            {tProfile('resumeSubscription' as any)}
                                          </Button>
                                        )
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {subscriptionsPagination.total > subscriptionsPagination.pageSize
                              ? (
                                  <div className={styles.paginationContainer}>
                                    <Button
                                      disabled={subscriptionsPagination.current === 1}
                                      onClick={() => fetchSubscriptions({
                                        page: subscriptionsPagination.current - 1,
                                        size: subscriptionsPagination.pageSize,
                                      })}
                                    >
                                      {tVip('previousPage' as any)}
                                    </Button>
                                    <span className={styles.paginationInfo}>
                                      {tVip('pageInfo' as any)
                                        .replace('{current}', subscriptionsPagination.current.toString())
                                        .replace('{total}', Math.ceil(subscriptionsPagination.total / subscriptionsPagination.pageSize).toString())}
                                    </span>
                                    <Button
                                      disabled={subscriptionsPagination.current >= Math.ceil(subscriptionsPagination.total / subscriptionsPagination.pageSize)}
                                      onClick={() => fetchSubscriptions({
                                        page: subscriptionsPagination.current + 1,
                                        size: subscriptionsPagination.pageSize,
                                      })}
                                    >
                                      {tVip('nextPage' as any)}
                                    </Button>
                                  </div>
                                )
                              : (
                                  <div className={styles.noMoreContent}>
                                    <p>{tVip('noMoreContent' as any)}</p>
                                  </div>
                                )}
                          </div>
                        )
                      : (
                          <div className={styles.emptyState}>
                            <p style={{ marginBottom: 20 }}>{tVip('noAutoRenewalItems' as any)}</p>
                            <Button className={styles.viewMoreBtn}>{tVip('viewMorePlans' as any)}</Button>
                          </div>
                        )
                  }

                </div>

              </div>

            </TabPane>

            <TabPane tab={tVip('purchaseHistory' as any)} key="orders">
              <div className={styles.purchaseHistory}>
                {ordersLoading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingText}>{tProfile('loading')}</div>
                  </div>
                ) : orders.length > 0 ? (
                  <div className={styles.orderCards}>
                    {orders.map(order => (
                      <div key={order._id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          {/* <div className={styles.orderTitle}>
                          {
                                                getPaymentTypeText(order.metadata?.payment)
                                             }
                          </div> */}
                        </div>
                        <div className={styles.orderDetails}>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>
                              {tProfile('subscriptionMode')}
                              :
                            </span>
                            <span className={styles.detailValue}>
                              {getSubscriptionModeText(order.mode)}
                            </span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>
                              {tProfile('amount')}
                              :
                            </span>
                            <span className={styles.detailValue}>
                              { (order.amount / 100).toFixed(2) }
                              {' '}
&nbsp;
                              { order.currency }
                            </span>

                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>
                              {tProfile('quantity' as any)}
                              :
                            </span>
                            <span className={styles.detailValue}>
                              {order.quantity || 1}
                            </span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>
                              {tProfile('status')}
                              :
                            </span>
                            <span className={styles.detailValue}>
                              {getOrderStatusTag(order.status)}
                            </span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>
                              {tProfile('createTime')}
                              :
                            </span>
                            <span className={styles.detailValue}>
                              {new Date(order.created * 1000).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>
                              {tProfile('orderId')}
                              :
                            </span>
                            <span className={styles.detailValue}>
                              {order.id}
                              <Button
                                type="text"
                                size="small"
                                className={styles.copyBtn}
                                onClick={() => {
                                  navigator.clipboard.writeText(order.id)
                                  toast.success(tProfile('copySuccess'))
                                }}
                              >
                                📋
                              </Button>
                            </span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>
                              {tProfile('paymentMethod' as any)}
                              :
                            </span>
                            <span className={styles.detailValue}>
                              {(order as any).payment_method || tVip('alipayPayment' as any)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {ordersPagination.total > ordersPagination.pageSize
                      ? (
                          <div className={styles.paginationContainer}>
                            <Button
                              disabled={ordersPagination.current === 1}
                              onClick={() => fetchOrders({
                                page: ordersPagination.current - 1,
                                size: ordersPagination.pageSize,
                              })}
                            >
                              {tVip('previousPage' as any)}
                            </Button>
                            <span className={styles.paginationInfo}>
                              {tVip('pageInfo' as any)
                                .replace('{current}', ordersPagination.current.toString())
                                .replace('{total}', Math.ceil(ordersPagination.total / ordersPagination.pageSize).toString())}
                            </span>
                            <Button
                              disabled={ordersPagination.current >= Math.ceil(ordersPagination.total / ordersPagination.pageSize)}
                              onClick={() => fetchOrders({
                                page: ordersPagination.current + 1,
                                size: ordersPagination.pageSize,
                              })}
                            >
                              {tVip('nextPage' as any)}
                            </Button>
                          </div>
                        )
                      : (
                          <div className={styles.noMoreContent}>
                            <p>{tVip('noMoreContent' as any)}</p>
                          </div>
                        )}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>{tProfile('noOrderRecords')}</p>
                  </div>
                )}
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal
        title={tProfile('orderDetails')}
        open={orderDetailVisible}
        onCancel={() => setOrderDetailVisible(false)}
        className={styles.orderDetailModal}
        footer={(
          <Button onClick={() => setOrderDetailVisible(false)}>
            {tProfile('close')}
          </Button>
        )}
        width={600}
        confirmLoading={orderDetailLoading}
      >
        {currentOrderDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={tProfile('orderId')}>{currentOrderDetail.id}</Descriptions.Item>
            <Descriptions.Item label={tProfile('internalId')}>{currentOrderDetail._id}</Descriptions.Item>
            <Descriptions.Item label={tProfile('packageType')}>
              {getPaymentTypeText(currentOrderDetail.metadata?.payment)}
            </Descriptions.Item>
            <Descriptions.Item label={tProfile('subscriptionMode')}>{currentOrderDetail.mode}</Descriptions.Item>
            <Descriptions.Item label={tProfile('amount')}>
              CNY
              {(currentOrderDetail.amount / 100).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label={tProfile('status')}>
              {getOrderStatusTag(currentOrderDetail.status)}
            </Descriptions.Item>
            <Descriptions.Item label={tProfile('createTime')}>
              {new Date(currentOrderDetail.created * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label={tProfile('paymentMethod' as any)}>
              {(currentOrderDetail as any).payment_method || tProfile('unknown')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  )
})

export default SubscriptionManagementModal
