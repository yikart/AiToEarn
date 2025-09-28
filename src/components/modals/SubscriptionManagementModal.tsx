"use client";

import { memo, useState, useEffect } from "react";
import { Modal, Tabs, Table, Card, Button, Tag, Descriptions, message } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { useUserStore } from "@/store/user";
import { 
  getOrderListApi, 
  getSubscriptionListApi, 
  getOrderDetailApi,
  refundOrderApi,
  unsubscribeApi
} from "@/api/payment";
import { Order, OrderListParams, SubscriptionListParams, RefundParams, UnsubscribeParams, OrderStatus, PaymentType } from "@/api/types/payment";
import styles from "./subscriptionManagementModal.module.css";

import Image from "next/image";
import plusvip from "@/assets/images/plusvip.png";

const { TabPane } = Tabs;

interface SubscriptionManagementModalProps {
  open: boolean;
  onClose: () => void;
}

const SubscriptionManagementModal = memo(({ open, onClose }: SubscriptionManagementModalProps) => {
  const { t: tProfile } = useTransClient('profile');
  const { t: tVip } = useTransClient('vip');
  const { userInfo } = useUserStore();
  
  // 订单相关状态
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [ordersPagination, setOrdersPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [subscriptionsPagination, setSubscriptionsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // 订单详情弹窗状态
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [currentOrderDetail, setCurrentOrderDetail] = useState<Order | null>(null);

  // 获取购买记录
  const fetchOrders = async (params: OrderListParams) => {
    setOrdersLoading(true);
    try {
      const response = await getOrderListApi(params);
      if (response?.code === 0 && response.data) {
        setOrders((response.data as any).list || []);
        setOrdersPagination({
          current: params.page + 1,
          pageSize: params.size,
          total: (response.data as any).count || 0
        });
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // 获取订阅列表
  const fetchSubscriptions = async (params: SubscriptionListParams) => {
    setSubscriptionsLoading(true);
    try {
      const response:any = await getSubscriptionListApi(params);
      if (response?.code === 0 && response.data) {
        setSubscriptions((response.data as any).list || []);
        setSubscriptionsPagination({
          current: params.page + 1,
          pageSize: params.size,
          total: (response.data as any).count || 0
        });
      }
    } catch (error) {
      console.error('获取订阅列表失败:', error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  // 处理退款
  const handleRefund = async (order: Order) => {
    try {
      const params: RefundParams = {
        charge: order.id,
        payment_intent: order.payment_intent || order.id,
        userId: userInfo?.id || ''
      };
      const response = await refundOrderApi(params);
      if (response?.code === 0) {
        message.success(tProfile('refundSubmitted'));
        fetchOrders({ page: ordersPagination.current - 1, size: ordersPagination.pageSize });
      } else {
        message.error(response?.message || tProfile('refundFailed'));
      }
    } catch (error) {
      console.error('退款失败:', error);
      message.error(tProfile('refundFailed'));
    }
  };

  // 处理退订
  const handleUnsubscribe = async (order: Order) => {
    try {
      const params: UnsubscribeParams = {
        id: order.id,
        userId: userInfo?.id || ''
      };
      const response = await unsubscribeApi(params);
      if (response?.code === 0) {
        message.success(tProfile('unsubscribeSuccess'));
        fetchSubscriptions({ page: subscriptionsPagination.current - 1, size: subscriptionsPagination.pageSize });
      }
    } catch (error) {
      console.error('退订失败:', error);
    }
  };

  // 获取订单详情
  const fetchOrderDetail = async (orderId: string) => {
    setOrderDetailLoading(true);
    try {
      const response: any = await getOrderDetailApi(orderId);
      if (response?.code === 0 && response.data) {
        setCurrentOrderDetail(response.data[0]);
        setOrderDetailVisible(true);
      } else {
        message.error(tProfile('getOrderDetailFailed'));
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      message.error(tProfile('getOrderDetailFailed'));
    } finally {
      setOrderDetailLoading(false);
    }
  };

  // 订单状态标签
  const getOrderStatusTag = (status: OrderStatus) => {
    const statusMap = {
      [OrderStatus.SUCCEEDED]: { color: 'green', text: tProfile('paymentSuccess') },
      [OrderStatus.CREATED]: { color: 'orange', text: tProfile('waitingForPayment') },
      [OrderStatus.REFUNDED]: { color: 'purple', text: tProfile('refundSuccess') },
      [OrderStatus.EXPIRED]: { color: 'red', text: tProfile('orderCancelled') }
    };
    const config = statusMap[status] || { color: 'default', text: `状态${status}` };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 支付类型文本
  const getPaymentTypeText = (paymentType: string) => {
    const typeMap: any = {
      [PaymentType.ONCE_MONTH]: tProfile('oneTimeMonthly'),
      [PaymentType.MONTH]: tProfile('monthlySubscription'),
      [PaymentType.YEAR]: tProfile('yearlySubscription')
    };
    return typeMap[paymentType as PaymentType] || paymentType || tProfile('unknown');
  };

  // 订单表格列
  const orderColumns = [
    {
      title: tProfile('orderId'),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 200,
    },
    {
      title: tProfile('packageType'),
      dataIndex: 'metadata',
      key: 'packageType',
      width: 120,
      render: (metadata: any) => getPaymentTypeText(metadata?.payment),
    },
    {
      title: tProfile('amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => `¥${(amount / 100).toFixed(2)}`,
    },
    {
      title: tProfile('status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => getOrderStatusTag(status),
    },
    {
      title: tProfile('createTime'),
      dataIndex: 'created',
      key: 'created',
      width: 150,
      render: (created: number) => new Date(created * 1000).toLocaleString(),
    },
    {
      title: tProfile('actions'),
      key: 'actions',
      width: 120,
      render: (_: any, record: Order) => (
        <div className={styles.actionButtons}>
          <Button 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              fetchOrderDetail(record.id);
            }}
          >
            {tProfile('viewDetails')}
          </Button>
          {record.status === OrderStatus.SUCCEEDED && (
            <Button 
              size="small" 
              danger
              onClick={(e) => {
                e.stopPropagation();
                handleRefund(record);
              }}
            >
              {tProfile('points.refund')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  // 订阅表格列
  const subscriptionColumns = [
    {
      title: tProfile('subscriptionId'),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 200,
    },
    {
      title: tProfile('packageType'),
      dataIndex: 'metadata',
      key: 'packageType',
      width: 120,
      render: (metadata: any) => getPaymentTypeText(metadata?.payment),
    },
    {
      title: tProfile('amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => `¥${(amount / 100).toFixed(2)}`,
    },
    {
      title: tProfile('status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => {
        const statusMap = {
          1: { color: 'green', text: tProfile('subscriptionSuccess') },
          2: { color: 'red', text: tProfile('subscriptionCancelled') },
          3: { color: 'purple', text: tProfile('refundSuccess') },
          4: { color: 'orange', text: tProfile('orderCancelled') }
        };
        const config = statusMap[status] || { color: 'default', text: `状态${status}` };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: tProfile('createTime'),
      dataIndex: 'created',
      key: 'created',
      width: 150,
      render: (created: number) => new Date(created * 1000).toLocaleString(),
    },
    {
      title: tProfile('actions'),
      key: 'actions',
      width: 120,
      render: (_: any, record: Order) => (
        <div className={styles.actionButtons}>
          <Button 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              fetchOrderDetail(record.id);
            }}
          >
            {tProfile('viewDetails')}
          </Button>
          {record.status === 1 && (
            <Button 
              size="small" 
              danger
              onClick={(e) => {
                e.stopPropagation();
                handleUnsubscribe(record);
              }}
            >
              {tProfile('cancelSubscription')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  // 弹窗打开时加载数据
  useEffect(() => {
    if (open) {
    //   fetchOrders({ page: 0, size: 10 });
    //   fetchSubscriptions({ page: 0, size: 10 });
      
      // 添加假数据用于测试样式
      const mockSubscriptions: Order[] = [
        {
          _id: 'mock_sub_1',
          id: 'sub_1234567890',
          amount: 2999, // 29.99 元
          amount_refunded: 0,
          created: Math.floor(Date.now() / 1000) - 86400 * 30, // 30天前
          currency: 'cny',
          customer: null,
          customer_details: null,
          expires_at: Math.floor(Date.now() / 1000) + 86400 * 30, // 30天后
          info: null,
          metadata: {
            userId: 'user123',
            payment: 'month',
            mode: 'subscription'
          },
          mode: 'subscription',
          payment_intent: 'pi_mock_123',
          price: 'price_monthly',
          status: 1, // SUCCEEDED
          subscription: { id: 'sub_1234567890' },
          success_url: '/success',
          url: '',
          userId: 'user123'
        },
        {
          _id: 'mock_sub_2',
          id: 'sub_0987654321',
          amount: 9999, // 99.99 元
          amount_refunded: 0,
          created: Math.floor(Date.now() / 1000) - 86400 * 7, // 7天前
          currency: 'cny',
          customer: null,
          customer_details: null,
          expires_at: Math.floor(Date.now() / 1000) + 86400 * 365, // 365天后
          info: null,
          metadata: {
            userId: 'user123',
            payment: 'year',
            mode: 'subscription'
          },
          mode: 'subscription',
          payment_intent: 'pi_mock_456',
          price: 'price_yearly',
          status: 1, // SUCCEEDED
          subscription: { id: 'sub_0987654321' },
          success_url: '/success',
          url: '',
          userId: 'user123'
        },
        {
          _id: 'mock_sub_2',
          id: 'sub_0987654321',
          amount: 9999, // 99.99 元
          amount_refunded: 0,
          created: Math.floor(Date.now() / 1000) - 86400 * 7, // 7天前
          currency: 'cny',
          customer: null,
          customer_details: null,
          expires_at: Math.floor(Date.now() / 1000) + 86400 * 365, // 365天后
          info: null,
          metadata: {
            userId: 'user123',
            payment: 'year',
            mode: 'subscription'
          },
          mode: 'subscription',
          payment_intent: 'pi_mock_456',
          price: 'price_yearly',
          status: 1, // SUCCEEDED
          subscription: { id: 'sub_0987654321' },
          success_url: '/success',
          url: '',
          userId: 'user123'
        },
        {
          _id: 'mock_sub_2',
          id: 'sub_0987654321',
          amount: 9999, // 99.99 元
          amount_refunded: 0,
          created: Math.floor(Date.now() / 1000) - 86400 * 7, // 7天前
          currency: 'cny',
          customer: null,
          customer_details: null,
          expires_at: Math.floor(Date.now() / 1000) + 86400 * 365, // 365天后
          info: null,
          metadata: {
            userId: 'user123',
            payment: 'year',
            mode: 'subscription'
          },
          mode: 'subscription',
          payment_intent: 'pi_mock_456',
          price: 'price_yearly',
          status: 1, // SUCCEEDED
          subscription: { id: 'sub_0987654321' },
          success_url: '/success',
          url: '',
          userId: 'user123'
        }
      ];
      
      setSubscriptions(mockSubscriptions);
      setSubscriptionsPagination({
        current: 1,
        pageSize: 10,
        total: 2
      });
    }
  }, [open]);


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
        centered
      >
        <div className={styles.modalContent}>
          <Tabs defaultActiveKey="subscriptions">
            <TabPane tab={tVip('subscriptionPlanManagement' as any)} key="subscriptions">
              <div className={styles.myMembership}>
                <h3>{tVip('myMembership' as any)}</h3>
                <div className={styles.membershipCard}>
                  <div className={styles.membershipInfo}>
                    <div className={styles.membershipIcon}>
                        <Image src={plusvip} alt="plusvip" style={{ width: 28, height: 'auto', marginTop: -5 }}/> 
                    </div>
                    <div className={styles.membershipDetails}>
                      <div className={styles.membershipName}>
                        {userInfo?.vipInfo?.cycleType === 1 
                          ? tVip('modal.vipInfo.monthly' as any)
                          : tVip('modal.vipInfo.yearly' as any)}
                        {userInfo?.vipInfo?.autoContinue === false && ` (${tVip('modal.vipInfo.singleMonth' as any)})`}
                      </div>
                      <div>

                      
                      <div className={styles.membershipExpire}>
                        {
                         tVip('membershipExpires' as any)
                        } 
                      </div>
                      <div className={styles.membershipStatus}>
                      {userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '2025-09-29 15:04'}
                      </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 根据 autoContinue 显示不同的内容 */}
                  <div className={styles.autoRenewal}>
                    {userInfo?.vipInfo?.autoContinue ? ( <h3>{tVip('activatedAutoRenewalPlans' as any)}</h3> ) : (
                        <h3>{tVip('activatedAutoRenewalPlansno' as any)}</h3>
                    )}
                
                     {
                     subscriptions.length ?(
                             <div className={styles.subscriptionCards}>
                                 {subscriptions.map((subscription) => (
                                   <div key={subscription._id} className={styles.subscriptionCard}>
                                     <div className={styles.subscriptionHeader}>
                                       <div className={styles.subscriptionTitle}>{tVip('basicMembership' as any)}</div>
                                     </div>
                                     <div className={styles.subscriptionDetails}>
                                       <div className={styles.subscriptionDetailItem}>
                                         <span className={styles.detailLabel}>{tProfile('subscriptionMode')}:</span>
                                         <span className={styles.detailValue}>
                                           {subscription.metadata?.payment === 'month' 
                                             ? tVip('modal.vipInfo.monthly' as any)
                                             : tVip('modal.vipInfo.yearly' as any)}
                                         </span>
                                       </div>
                                       <div className={styles.subscriptionDetailItem}>
                                         <span className={styles.detailLabel}>{tProfile('amount')}:</span>
                                         <span className={styles.detailValue}>¥{(subscription.amount / 100).toFixed(2)}</span>
                                       </div>
                                       <div className={styles.subscriptionDetailItem}>
                                         <span className={styles.detailLabel}>{tProfile('createTime')}:</span>
                                         <span className={styles.detailValue}>
                                           {new Date(subscription.created * 1000).toLocaleString('zh-CN', {
                                             year: 'numeric',
                                             month: '2-digit',
                                             day: '2-digit',
                                             hour: '2-digit',
                                             minute: '2-digit'
                                           })}
                                         </span>
                                       </div>
                                       <div className={styles.subscriptionDetailItem}>
                                         <span className={styles.detailLabel}>{tProfile('subscriptionId')}:</span>
                                         <span className={styles.detailValue}>
                                           {subscription.id}
                                           <Button
                                             type="text"
                                             size="small"
                                             className={styles.copyBtn}
                                             onClick={() => {
                                               navigator.clipboard.writeText(subscription.id);
                                               message.success('已复制');
                                             }}
                                           >
                                             📋
                                           </Button>
                                         </span>
                                       </div>
                                       <div className={styles.subscriptionDetailItem}>
                                         <span className={styles.detailLabel}>{tProfile('status')}:</span>
                                         <span className={styles.detailValue}>
                                           {subscription.status === 1 ? (
                                             <Tag color="green">{tProfile('subscriptionSuccess')}</Tag>
                                           ) : subscription.status === 2 ? (
                                             <Tag color="red">{tProfile('subscriptionCancelled')}</Tag>
                                           ) : subscription.status === 3 ? (
                                             <Tag color="purple">{tProfile('refundSuccess')}</Tag>
                                           ) : (
                                             <Tag color="orange">{tProfile('orderCancelled')}</Tag>
                                           )}
                                         </span>
                                       </div>
                                       <div className={styles.subscriptionDetailItem}>
                                         <span className={styles.detailLabel}>{tProfile('actions')}:</span>
                                         <span className={styles.detailValue}>
                                           {subscription.status === 1 && (
                                             <Button 
                                               size="small" 
                                               danger
                                               onClick={() => handleUnsubscribe(subscription)}
                                             >
                                               {tProfile('cancelSubscription')}
                                             </Button>
                                           )}
                                         </span>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                                 {subscriptionsPagination.total > subscriptionsPagination.pageSize ? (
                                   <div className={styles.paginationContainer}>
                                     <Button 
                                       disabled={subscriptionsPagination.current === 1}
                                       onClick={() => fetchSubscriptions({ 
                                         page: subscriptionsPagination.current - 2, 
                                         size: subscriptionsPagination.pageSize 
                                       })}
                                     >
                                       {tVip('previousPage' as any)}
                                     </Button>
                                     <span className={styles.paginationInfo}>
                                       {tVip('pageInfo' as any).replace('{current}', subscriptionsPagination.current.toString()).replace('{total}', Math.ceil(subscriptionsPagination.total / subscriptionsPagination.pageSize).toString())}
                                     </span>
                                     <Button 
                                       disabled={subscriptionsPagination.current >= Math.ceil(subscriptionsPagination.total / subscriptionsPagination.pageSize)}
                                       onClick={() => fetchSubscriptions({ 
                                         page: subscriptionsPagination.current, 
                                         size: subscriptionsPagination.pageSize 
                                       })}
                                     >
                                       {tVip('nextPage' as any)}
                                     </Button>
                                   </div>
                                 ) : (
                                   <div className={styles.noMoreContent}>
                                     <p>{tVip('noMoreContent' as any)}</p>
                                   </div>
                                 )}
                             </div>
                         ) : (
                             <div className={styles.emptyState}>
                                 <p style={{marginBottom: 20}}>{tVip('noAutoRenewalItems' as any)}</p>
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
                    {orders.map((order) => (
                      <div key={order._id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          <div className={styles.orderTitle}>
                            {userInfo?.vipInfo?.cycleType === 1 
                              ? tVip('modal.vipInfo.monthly' as any)
                              : tVip('modal.vipInfo.yearly' as any)}
                            {userInfo?.vipInfo?.autoContinue === false && ` (${tVip('modal.vipInfo.singleMonth' as any)})`}
                          </div>
                        </div>
                        <div className={styles.orderDetails}>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>{tProfile('subscriptionMode')}:</span>
                            <span className={styles.detailValue}>
                              {order.mode === 'subscription' ? tVip('continuousAnnual' as any) : tVip('oneTimePurchase' as any)}
                            </span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>{tProfile('amount')}:</span>
                            <span className={styles.detailValue}>¥{(order.amount / 100).toFixed(2)}</span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>{tProfile('createTime')}:</span>
                            <span className={styles.detailValue}>
                              {new Date(order.created * 1000).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>{tProfile('orderId')}:</span>
                            <span className={styles.detailValue}>
                              {order.id}
                              <Button 
                                type="text" 
                                size="small" 
                                className={styles.copyBtn}
                                onClick={() => {
                                  navigator.clipboard.writeText(order.id);
                                  message.success('已复制');
                                }}
                              >
                                📋
                              </Button>
                            </span>
                          </div>
                          <div className={styles.orderDetailItem}>
                            <span className={styles.detailLabel}>{tProfile('paymentMethod' as any)}:</span>
                            <span className={styles.detailValue}>
                              {(order as any).payment_method || tVip('alipayPayment' as any)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {ordersPagination.total > ordersPagination.pageSize ? (
                      <div className={styles.paginationContainer}>
                        <Button 
                          disabled={ordersPagination.current === 1}
                          onClick={() => fetchOrders({ 
                            page: ordersPagination.current - 2, 
                            size: ordersPagination.pageSize 
                          })}
                        >
                          {tVip('previousPage' as any)}
                        </Button>
                        <span className={styles.paginationInfo}>
                          {tVip('pageInfo' as any).replace('{current}', ordersPagination.current.toString()).replace('{total}', Math.ceil(ordersPagination.total / ordersPagination.pageSize).toString())}
                        </span>
                        <Button 
                          disabled={ordersPagination.current >= Math.ceil(ordersPagination.total / ordersPagination.pageSize)}
                          onClick={() => fetchOrders({ 
                            page: ordersPagination.current, 
                            size: ordersPagination.pageSize 
                          })}
                        >
                          {tVip('nextPage' as any)}
                        </Button>
                      </div>
                    ) : (
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
        footer={[
          <Button key="close" onClick={() => setOrderDetailVisible(false)}>
            {tProfile('close')}
          </Button>
        ]}
        width={600}
        loading={orderDetailLoading}
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
              ¥{(currentOrderDetail.amount / 100).toFixed(2)}
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
  );
});

export default SubscriptionManagementModal;
