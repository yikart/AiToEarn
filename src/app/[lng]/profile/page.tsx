"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message, Modal, Form, Input, Tabs, Table, Tag, Popconfirm, DatePicker, Select, Space } from "antd";
import { CrownOutlined, TrophyOutlined, GiftOutlined, StarOutlined, RocketOutlined, ThunderboltOutlined, HistoryOutlined, DollarOutlined, ShoppingCartOutlined, UserOutlined, GiftFilled } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { getUserInfoApi, updateUserInfoApi, getPointsRecordsApi } from "@/api/apiReq";
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
  
  // 免费会员提示弹框状态
  const [freeTrialModalVisible, setFreeTrialModalVisible] = useState(false);
  const [hasShownFreeTrial, setHasShownFreeTrial] = useState(false);
  
  // 检查是否已经显示过免费会员提示
  useEffect(() => {
    const hasShown = localStorage.getItem('freeTrialShown');
    if (hasShown) {
      setHasShownFreeTrial(true);
    }
  }, []);
  
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

  // 积分记录相关状态
  const [pointsRecords, setPointsRecords] = useState<any[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsPagination, setPointsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 积分记录类型定义
  interface PointsRecord {
    id: string;
    userId: string;
    amount: number;
    balance: number;
    type: string;
    description: string;
    metadata?: any;
    createdAt?: string;
  }
  
  // 获取会员状态和过期时间
  const isVip = userInfo?.vipInfo?.cycleType && userInfo.vipInfo.cycleType > 0 && 
                userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime) > new Date() : false;
  const vipExpireTime = userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime).toLocaleDateString() : '';
  
  // 检查用户是否从未开过会员
  const hasNeverBeenVip = !userInfo?.vipInfo || Object.keys(userInfo.vipInfo).length === 0;
  
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
        
        // 检查是否需要显示免费会员提示
        const hasVipInfo = response.data.vipInfo && Object.keys(response.data.vipInfo).length > 0;
        if (!hasVipInfo && !hasShownFreeTrial) {
          // 延迟显示弹框，确保页面加载完成
          setTimeout(() => {
            setFreeTrialModalVisible(true);
            setHasShownFreeTrial(true);
          }, 2000); // 增加延迟时间，让用户先看到页面内容
        }
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

  // 获取积分记录
  const fetchPointsRecords = async (params: { page: number; pageSize: number }) => {
    setPointsLoading(true);
    try {
      const response = await getPointsRecordsApi(params);
      if (response?.code === 0 && response.data) {
        const paginatedData = response.data;
        setPointsRecords(paginatedData.list || []);
        setPointsPagination({
          current: params.page,
          pageSize: params.pageSize,
          total: paginatedData.total || 0
        });
      } else {
        message.error(response?.message || '获取积分记录失败');
      }
    } catch (error) {
      message.error('获取积分记录失败');
    } finally {
      setPointsLoading(false);
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

  // 处理免费会员弹框
  const handleFreeTrialModalOk = () => {
    setFreeTrialModalVisible(false);
    localStorage.setItem('freeTrialShown', 'true');
    router.push('/vip');
  };

  const handleFreeTrialModalCancel = () => {
    setFreeTrialModalVisible(false);
    localStorage.setItem('freeTrialShown', 'true');
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

  // 积分记录表格列
  const pointsColumns = [
    {
      title: t('points.pointsChange'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {amount > 0 ? '+' : ''}{amount}
        </span>
      ),
    },
    {
      title: t('points.balance'),
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {balance}
        </span>
      ),
    },
    {
      title: t('points.changeType'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: { [key: string]: { color: string; text: string } } = {
          'ai_service': { color: 'green', text: t('points.aiService') },
          'user_register': { color: 'blue', text: t('points.userRegister') },
          'earn': { color: 'green', text: t('points.earn') },
          'spend': { color: 'red', text: t('points.spend') },
          'refund': { color: 'blue', text: t('points.refund') },
          'expire': { color: 'orange', text: t('points.expire') }
        };
        const config = typeMap[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('points.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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

      {/* 积分记录卡片 */}
      {/* <div className={styles.pointsCard}>
        <div className={styles.pointsContent}>
          <div className={styles.pointsHeader}>
            <div>
              <span style={{ marginRight: '8px' }}><GiftFilled /></span>
              <span className={styles.pointsTitle}>{t('points.myPoints')}</span>
            </div>
            <span className={styles.pointsCount}>{userInfo?.score || 0}</span>
          </div>
          <p className={styles.pointsDescription}>
            {t('points.pointsDescription')}
          </p>
        </div>
      </div> */}

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
          <Descriptions.Item label='我的积分'>{userInfo?.score}</Descriptions.Item>
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

  // 积分记录内容
  const renderPointsContent = () => (
    <div className={styles.orderContent}>
      <Card>
        <Table
          columns={pointsColumns}
          dataSource={pointsRecords}
          loading={pointsLoading}
          rowKey="id"
          className={styles.pointsTable}
          pagination={{
            current: pointsPagination.current,
            pageSize: pointsPagination.pageSize,
            total: pointsPagination.total,
            onChange: (page, size) => {
              fetchPointsRecords({ page, pageSize: size || 10 });
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('points.totalRecords', { total }),
            pageSizeOptions: ['10', '20', '50'],
          }}
          locale={{
            emptyText: pointsLoading ? t('loading') : t('points.noPointsRecords')
          }}
        />
      </Card>
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
          } else if (key === 'points') {
            fetchPointsRecords({ page: 1, pageSize: 10 });
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
        <TabPane 
          tab={
            <span>
              <GiftFilled />
              {t('points.title')}
            </span>
          } 
          key="points"
        >
          {renderPointsContent()}
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

      {/* 免费会员提示弹框 */}
      <Modal
        title={
          <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#C026D2' }}>
            {t('freeTrial.title')}
          </div>
        }
        open={freeTrialModalVisible}
        onOk={handleFreeTrialModalOk}
        onCancel={handleFreeTrialModalCancel}
        okText={t('freeTrial.claimNow')}
        cancelText={t('freeTrial.later')}
        okButtonProps={{
          style: {
            backgroundColor: '#C026D2',
            borderColor: '#C026D2',
            borderRadius: '8px',
            fontWeight: '600'
          }
        }}
        cancelButtonProps={{
          style: {
            borderRadius: '8px',
            fontWeight: '600'
          }
        }}
        width={500}
        centered
        maskClosable={false}
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👑</div>
          <h3 style={{ color: '#1f2937', marginBottom: '12px', fontSize: '16px' }}>
            {t('freeTrial.congratulations')}
          </h3>
          <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '20px' }}>
            {t('freeTrial.description')}
          </p>
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#374151', fontSize: '14px' }}>{t('freeTrial.unlimitedAI')}</span>
              <span style={{ color: '#374151', fontSize: '14px' }}>{t('freeTrial.priorityProcessing')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#374151', fontSize: '14px' }}>{t('freeTrial.advancedModels')}</span>
              <span style={{ color: '#374151', fontSize: '14px' }}>{t('freeTrial.dedicatedSupport')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#374151', fontSize: '14px' }}>{t('freeTrial.noAds')}</span>
              <span style={{ color: '#374151', fontSize: '14px' }}>{t('freeTrial.morePrivileges')}</span>
            </div>
          </div>
          <p style={{ color: '#C026D2', fontSize: '14px', fontWeight: '600' }}>
            {t('freeTrial.completelyFree')}
          </p>
        </div>
      </Modal>
    </div>
  );
} 