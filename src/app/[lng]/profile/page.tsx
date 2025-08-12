"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message, Modal, Form, Input, Tabs, Table, Tag, Popconfirm, DatePicker, Select, Space } from "antd";
import { CrownOutlined, TrophyOutlined, GiftOutlined, StarOutlined, RocketOutlined, ThunderboltOutlined, HistoryOutlined, DollarOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { getUserInfoApi, updateUserInfoApi } from "@/api/apiReq";
import { getOrderListApi, getOrderDetailApi, getSubscriptionListApi, refundOrderApi, unsubscribeApi } from "@/api/payment";
import type { Order, OrderListParams, SubscriptionListParams, RefundParams, UnsubscribeParams } from "@/api/types/payment";
import { OrderStatus, PaymentType } from "@/api/types/payment";
import styles from "./profile.module.css";
import { useTransClient } from "@/app/i18n/client";

const { TabPane } = Tabs;
const { Option } = Select;

export default function ProfilePage() {
  const router = useRouter();
  const { userInfo, setUserInfo, clearLoginStatus, token } = useUserStore();
  const { t } = useTransClient('profile');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  
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

  // 获取会员状态和过期时间
  const isVip = userInfo?.vipInfo?.cycleType && userInfo.vipInfo.cycleType > 0 && 
                userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime) > new Date() : false;
  const vipExpireTime = userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime).toLocaleDateString() : '';
  
  // 获取会员类型显示文本
  const getVipCycleTypeText = (cycleType: number) => {
    switch (cycleType) {
      case 0:
        return t('nonMember');
      case 1:
        return t('monthlyMember');
      case 2:
        return t('yearlyMember');
      default:
        return t('unknown');
    }
  };
  
  const vipCycleType = getVipCycleTypeText(userInfo?.vipInfo?.cycleType || 0);

  // 会员权益数据
  const vipBenefits = [
    { icon: <CrownOutlined />, name: t('vipBenefits.exclusiveBadge') },
    { icon: <TrophyOutlined />, name: t('vipBenefits.advancedFeatures') },
    { icon: <GiftOutlined />, name: t('vipBenefits.memberGift') },
    { icon: <StarOutlined />, name: t('vipBenefits.prioritySupport') },
    { icon: <DollarOutlined />, name: t('vipBenefits.discount') },
    { icon: <HistoryOutlined />, name: t('vipBenefits.unlimitedTime') },
    { icon: <ThunderboltOutlined />, name: t('vipBenefits.fastExperience') },
    { icon: <RocketOutlined />, name: t('vipBenefits.morePrivileges') },
  ];

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response: any = await getUserInfoApi();
      if (!response) {
        message.error(t('getUserInfoFailed'));
        return;
      }
      
      if (response.code === 0 && response.data) {
        setUserInfo(response.data);
      } else {
        message.error(response.message || t('getUserInfoFailed'));
      }
    } catch (error) {
      message.error(t('getUserInfoFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 获取订单列表
  const fetchOrders = async (params: OrderListParams) => {
    setOrdersLoading(true);
    try {
      const response = await getOrderListApi(params);
      if (response?.code === 0 && response.data) {
        const paginatedData = response.data;
        setOrders(paginatedData.list);
        setOrdersPagination({
          current: params.page + 1, // API发送的是0开始的页码，UI显示需要加1
          pageSize: params.size,
          total: paginatedData.count
        });
      } else {
        message.error(response?.message || t('getOrderListFailed'));
      }
    } catch (error) {
      message.error(t('getOrderListFailed'));
    } finally {
      setOrdersLoading(false);
    }
  };

  // 获取订阅列表
  const fetchSubscriptions = async (params: SubscriptionListParams) => {
    setSubscriptionsLoading(true);
    try {
      const response = await getSubscriptionListApi(params);
      if (response?.code === 0 && response.data) {
        const paginatedData = response.data;
        setSubscriptions(paginatedData.list);
        setSubscriptionsPagination({
          current: params.page + 1, // API发送的是0开始的页码，UI显示需要加1
          pageSize: params.size,
          total: paginatedData.count
        });
      } else {
        message.error(response?.message || t('getSubscriptionListFailed'));
      }
    } catch (error) {
      message.error(t('getSubscriptionListFailed'));
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
        message.success(t('refundSubmitted'));
        fetchOrders({ page: ordersPagination.current - 1, size: ordersPagination.pageSize });
      } else {
        message.error(response?.message || t('refundFailed'));
      }
    } catch (error) {
      message.error(t('refundFailed'));
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
        message.success(t('unsubscribeSuccess'));
        fetchSubscriptions({ page: subscriptionsPagination.current - 1, size: subscriptionsPagination.pageSize });
      } else {
        message.error(response?.message || t('unsubscribeFailed'));
      }
    } catch (error) {
      message.error(t('unsubscribeFailed'));
    }
  };

  // 获取订单详情
  const fetchOrderDetail = async (orderId: string) => {
    setOrderDetailLoading(true);
    try {
      const response:any = await getOrderDetailApi(orderId);
      if (response?.code === 0 && response.data) {
        setCurrentOrderDetail(response.data[0]);
        setOrderDetailVisible(true);
      } else {
        message.error(response?.message || t('getOrderDetailFailed'));
      }
    } catch (error) {
      message.error(t('getOrderDetailFailed'));
    } finally {
      setOrderDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      message.error(t('pleaseLoginFirst'));
      router.push('/login');
      return;
    }
    fetchUserInfo();
  }, [token, router]);

  const handleLogout = () => {
    clearLoginStatus();
    message.success(t('logoutSuccess'));
    router.push('/login');
  };

  const handleUpdateName = async (values: { name: string }) => {
    try {
      const response: any = await updateUserInfoApi(values);
      if (!response) {
        message.error(t('updateFailed'));
        return;
      }

      if (response.code === 0 && response.data) {
        fetchUserInfo();
        message.success(t('updateSuccess'));
        setIsModalOpen(false);
      } else {
        message.error(response.message || t('updateFailed'));
      }
    } catch (error) {
      message.error(t('updateFailed'));
    }
  };

  const handleGoToVipPage = () => {
    router.push('/vip');
  };

  // 订单状态标签
  const getOrderStatusTag = (status: OrderStatus) => {
    const statusMap = {
      [OrderStatus.SUCCEEDED]: { color: 'green', text: t('paymentSuccess') },
      [OrderStatus.CREATED]: { color: 'orange', text: t('waitingForPayment') },
      [OrderStatus.REFUNDED]: { color: 'purple', text: t('refundSuccess') },
      [OrderStatus.EXPIRED]: { color: 'red', text: t('orderCancelled') }
    };
    const config = statusMap[status] || { color: 'default', text: `状态${status}` };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取套餐类型显示文本
  const getPaymentTypeText = (paymentType: string) => {
    const typeMap = {
      [PaymentType.MONTH]: t('monthlySubscription'),
      [PaymentType.YEAR]: t('yearlySubscription'), 
      [PaymentType.ONCE_MONTH]: t('oneTimeMonthly'),
      [PaymentType.ONCE_YEAR]: t('oneTimeYearly')
    };
    return typeMap[paymentType as PaymentType] || paymentType || t('unknown');
  };

  // 订单表格列
  const orderColumns = [
    {
      title: t('orderId'),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 200,
    },
    {
      title: t('packageType'),
      dataIndex: 'metadata',
      key: 'payment',
      render: (metadata: any) => {
        const paymentType = metadata?.payment;
        return getPaymentTypeText(paymentType);
      },
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Order) => {
        const displayAmount = (amount / 100).toFixed(2); // Stripe金额通常以分为单位
        const symbol = record.currency === 'usd' ? '$' : record.currency === 'cny' ? '¥' : record.currency?.toUpperCase();
        return `${symbol}${displayAmount}`;
      },
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => getOrderStatusTag(status),
    },
    {
      title: t('createTime'),
      dataIndex: 'created',
      key: 'created',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
    {
      title: t('expireTime'),
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
    {
      title: t('actions'),
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // 阻止行点击事件
              fetchOrderDetail(record.id);
            }}
          >
            {t('viewDetails')}
          </Button>
          
          {record.url && record.status === OrderStatus.CREATED && (
            <Button 
              type="link" 
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // 阻止行点击事件
                window.open(record.url, '_blank');
              }}
            >
              {t('goToPay')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 订阅表格列
  const subscriptionColumns = [
    {
      title: t('subscriptionId'),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: t('packageType'),
      dataIndex: 'metadata',
      key: 'payment',
      render: (metadata: any) => {
        const paymentType = metadata?.payment;
        return getPaymentTypeText(paymentType);
      },
    },
    // {
    //   title: '金额',
    //   dataIndex: 'amount',
    //   key: 'amount',
    //   render: (amount: number, record: Order) => {
    //     const displayAmount = (amount / 100).toFixed(2); // Stripe金额通常以分为单位
    //     const symbol = record.currency === 'usd' ? '$' : record.currency === 'cny' ? '¥' : record.currency?.toUpperCase();
    //     return `${symbol}${displayAmount}`;
    //   },
    // },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => {
        const statusMap = {
          1: { color: 'green', text: t('subscriptionSuccess') },
          2: { color: 'red', text: t('subscriptionCancelled') },
          3: { color: 'purple', text: t('refundSuccess') },
          4: { color: 'orange', text: t('orderCancelled') }
        };
        const config = statusMap[status] || { color: 'default', text: `状态${status}` };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('createTime'),
      dataIndex: 'created',
      key: 'created',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
    // {
    //   title: '过期时间',
    //   dataIndex: 'expires_at',
    //   key: 'expires_at',
    //   render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    // },
    {
      title: t('actions'),
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          {record.status === 1 && (
            <Popconfirm
              title={t('cancelSubscriptionConfirm')}
              onConfirm={() => handleUnsubscribe(record)}
              okText={t('confirm')}
              cancelText={t('cancel')}
            >
              <Button type="link" danger size="small">{t('cancelSubscription')}</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 个人信息内容
  const renderProfileContent = () => (
    <>
      <div className={styles.vipCard}>
        <div className={styles.vipContent}>
          <div className={styles.vipHeader}>
            <span className={styles.vipIcon}><CrownOutlined /></span>
            <h2 className={styles.vipTitle}>{t('plusMember')}</h2>
          </div>
          {isVip ? (<p className={styles.vipDescription}>
            {t('vipUserGreeting')}
          </p>
          ) : (
            <p className={styles.vipDescription}>
              {t('vipDescription')}
            </p>
          )}
          <div className={styles.benefitsGrid}>
            {vipBenefits.map((benefit, index) => (
              <div key={index} className={styles.benefitItem}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <p className={styles.benefitName}>{benefit.name}</p>
              </div>
            ))}
          </div>
          {isVip ? (
            <div className={styles.vipInfo}>
            </div>
          ) : (
            <button className={styles.activateButton} onClick={handleGoToVipPage}>
              {t('activateNow')}
            </button>
          )}
        </div>
      </div>

      <Card 
        title={t('personalInfo')} 
        className={styles.card}
        extra={
          <div className={styles.actions}>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              {t('modifyUsername')}
            </Button>
            <Button type="primary" danger onClick={handleLogout}>
              {t('logout')}
            </Button>
          </div>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label={t('userId')}>{userInfo?.id}</Descriptions.Item>
          <Descriptions.Item label={t('username')}>{userInfo?.name}</Descriptions.Item>
          <Descriptions.Item label={t('email')}>{userInfo?.mail}</Descriptions.Item>
          <Descriptions.Item label={t('accountStatus')}>
            {userInfo?.status === 1 ? t('normal') : t('disabled')}
          </Descriptions.Item>
          <Descriptions.Item label='邀请码'>{userInfo?.popularizeCode}</Descriptions.Item>
          {isVip && (
            <>
              <Descriptions.Item label={t('memberType')}>{vipCycleType}</Descriptions.Item>
              <Descriptions.Item label={t('memberExpireTime')}>{vipExpireTime}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      {!isVip && (
        <div className={styles.normalUserCallToAction}>
          <p>{t('upgradeCallToAction')}</p>
          <button className={styles.activateButton} onClick={handleGoToVipPage}>
            {t('activatePlusMember')}
          </button>
        </div>
      )}
    </>
  );

  // 订单管理内容
  const renderOrderContent = () => (
    <div className={styles.orderContent}>
      <Tabs defaultActiveKey="orders">
        <TabPane tab={t('myOrders')} key="orders">
          <Card>
            <Table
              columns={orderColumns}
              dataSource={orders}
              loading={ordersLoading}
              rowKey="_id"
              onRow={(record) => ({
                onClick: () => {
                  fetchOrderDetail(record.id);
                },
                style: { cursor: 'pointer' }
              })}
              pagination={{
                current: ordersPagination.current,
                pageSize: ordersPagination.pageSize,
                total: ordersPagination.total,
                onChange: (page, size) => {
                  fetchOrders({ page: page - 1, size: size || 10 });
                },
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => t('totalRecords', { total }),
                pageSizeOptions: ['10', '20', '50'],
              }}
              scroll={{ x: 1200 }} // 添加横向滚动以适应更多列
              locale={{
                emptyText: ordersLoading ? t('loading') : t('noOrderRecords')
              }}
            />
          </Card>
        </TabPane>
        <TabPane tab={t('mySubscriptions')} key="subscriptions">
          <Card>
            <Table
              columns={subscriptionColumns}
              dataSource={subscriptions}
              loading={subscriptionsLoading}
              rowKey="id"
              pagination={{
                current: subscriptionsPagination.current,
                pageSize: subscriptionsPagination.pageSize,
                total: subscriptionsPagination.total,
                onChange: (page, size) => {
                  fetchSubscriptions({ page: page - 1, size: size || 10 });
                },
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => t('totalRecords', { total }),
                pageSizeOptions: ['10', '20', '50'],
              }}
              locale={{
                emptyText: subscriptionsLoading ? t('loading') : t('noSubscriptionRecords')
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );

  if (loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Tabs 
        defaultActiveKey="profile" 
        size="large"
        onChange={(key) => {
          if (key === 'orders') {
            fetchOrders({ page: 0, size: 10 });
            fetchSubscriptions({ page: 0, size: 10 });
          }
        }}
      >
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              {t('personalInfo')}
            </span>
          } 
          key="profile"
        >
          {renderProfileContent()}
        </TabPane>
        <TabPane 
          tab={
            <span>
              <ShoppingCartOutlined />
              {t('orderManagement')}
            </span>
          } 
          key="orders"
        >
          {renderOrderContent()}
        </TabPane>
      </Tabs>

      <Modal
        title={t('modifyUsername')}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleUpdateName}
          initialValues={{ name: userInfo?.name }}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label={t('username')}
            rules={[
              { required: true, message: t('pleaseEnterUsername') },
              { min: 2, message: t('usernameLengthMin') },
              { max: 20, message: t('usernameLengthMax') }
            ]}
          >
            <Input placeholder={t('pleaseEnterUsername')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('confirmModify')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal
        title={t('orderDetails')}
        open={orderDetailVisible}
        onCancel={() => setOrderDetailVisible(false)}
        className={styles.orderDetailModal}
        footer={[
          <Button key="close" onClick={() => setOrderDetailVisible(false)}>
            {t('close')}
          </Button>,
          currentOrderDetail?.url && currentOrderDetail?.status === OrderStatus.CREATED && (
            <Button 
              key="pay"
              type="primary"
              onClick={() => {
                if (currentOrderDetail?.url) {
                  window.open(currentOrderDetail.url, '_blank');
                }
              }}
            >
              {t('goToPayment')}
            </Button>
          )
        ]}
        width={600}
        loading={orderDetailLoading}
      >
        {currentOrderDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t('orderId')}>{currentOrderDetail.id}</Descriptions.Item>
            <Descriptions.Item label={t('internalId')}>{currentOrderDetail._id}</Descriptions.Item>
            <Descriptions.Item label={t('packageType')}>
              {getPaymentTypeText(currentOrderDetail.metadata?.payment)}
            </Descriptions.Item>
            <Descriptions.Item label={t('subscriptionMode')}>{currentOrderDetail.mode}</Descriptions.Item>
            <Descriptions.Item label={t('amount')}>
              {(() => {
                const displayAmount = (currentOrderDetail.amount / 100).toFixed(2);
                const symbol = currentOrderDetail.currency === 'usd' ? '$' : 
                              currentOrderDetail.currency === 'cny' ? '¥' : 
                              currentOrderDetail.currency?.toUpperCase();
                return `${symbol}${displayAmount}`;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label={t('refundedAmount')}>
              {(() => {
                const displayAmount = (currentOrderDetail.amount_refunded / 100).toFixed(2);
                const symbol = currentOrderDetail.currency === 'usd' ? '$' : 
                              currentOrderDetail.currency === 'cny' ? '¥' : 
                              currentOrderDetail.currency?.toUpperCase();
                return `${symbol}${displayAmount}`;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label={t('status')}>
              {getOrderStatusTag(currentOrderDetail.status)}
            </Descriptions.Item>
            <Descriptions.Item label={t('createTime')}>
              {new Date(currentOrderDetail.created * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label={t('expireTime')}>
              {new Date(currentOrderDetail.expires_at * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label={t('userId')}>{currentOrderDetail.userId}</Descriptions.Item>
            <Descriptions.Item label="价格ID">{currentOrderDetail.price}</Descriptions.Item>
            {currentOrderDetail.payment_intent && (
              <Descriptions.Item label={t('paymentIntent')}>{currentOrderDetail.payment_intent}</Descriptions.Item>
            )}
            {currentOrderDetail.subscription && (
              <Descriptions.Item label={t('subscriptionId')}>{currentOrderDetail.subscription}</Descriptions.Item>
            )}
            {/* <Descriptions.Item label="成功页面">{currentOrderDetail.success_url}</Descriptions.Item> */}
            {currentOrderDetail.url && (
              <Descriptions.Item label={t('paymentLink')}>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => window.open(currentOrderDetail.url, '_blank')}
                >
                  {t('openPaymentPage')}
                </Button>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
} 