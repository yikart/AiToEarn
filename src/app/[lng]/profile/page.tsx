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

const { TabPane } = Tabs;
const { Option } = Select;

export default function ProfilePage() {
  const router = useRouter();
  const { userInfo, setUserInfo, clearLoginStatus, token } = useUserStore();
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
  const isVip = userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime) > new Date() : false;
  const vipExpireTime = userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime).toLocaleDateString() : '';
  const vipCycleType = userInfo?.vipInfo?.cycleType === 1 ? '月度会员' : '年度会员';

  // 会员权益数据
  const vipBenefits = [
    { icon: <CrownOutlined />, name: "专属标识" },
    { icon: <TrophyOutlined />, name: "高级功能" },
    { icon: <GiftOutlined />, name: "会员礼包" },
    { icon: <StarOutlined />, name: "优先支持" },
    { icon: <DollarOutlined />, name: "优惠折扣" },
    { icon: <HistoryOutlined />, name: "无限时长" },
    { icon: <ThunderboltOutlined />, name: "极速体验" },
    { icon: <RocketOutlined />, name: "更多特权" },
  ];

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response: any = await getUserInfoApi();
      if (!response) {
        message.error('获取用户信息失败');
        return;
      }
      
      if (response.code === 0 && response.data) {
        setUserInfo(response.data);
      } else {
        message.error(response.message || '获取用户信息失败');
      }
    } catch (error) {
      message.error('获取用户信息失败');
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
        message.error(response?.message || '获取订单列表失败');
      }
    } catch (error) {
      message.error('获取订单列表失败');
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
        message.error(response?.message || '获取订阅列表失败');
      }
    } catch (error) {
      message.error('获取订阅列表失败');
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
        message.success('退款申请已提交');
        fetchOrders({ page: ordersPagination.current - 1, size: ordersPagination.pageSize });
      } else {
        message.error(response?.message || '退款失败');
      }
    } catch (error) {
      message.error('退款失败');
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
        message.success('退订成功');
        fetchSubscriptions({ page: subscriptionsPagination.current - 1, size: subscriptionsPagination.pageSize });
      } else {
        message.error(response?.message || '退订失败');
      }
    } catch (error) {
      message.error('退订失败');
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
        message.error(response?.message || '获取订单详情失败');
      }
    } catch (error) {
      message.error('获取订单详情失败');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      message.error('请先登录');
      router.push('/login');
      return;
    }
    fetchUserInfo();
  }, [token, router]);

  const handleLogout = () => {
    clearLoginStatus();
    message.success('退出登录成功');
    router.push('/login');
  };

  const handleUpdateName = async (values: { name: string }) => {
    try {
      const response: any = await updateUserInfoApi(values);
      if (!response) {
        message.error('更新失败');
        return;
      }

      if (response.code === 0 && response.data) {
        fetchUserInfo();
        message.success('更新成功');
        setIsModalOpen(false);
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleGoToVipPage = () => {
    router.push('/vip');
  };

  // 订单状态标签
  const getOrderStatusTag = (status: OrderStatus) => {
    const statusMap = {
      [OrderStatus.SUCCEEDED]: { color: 'green', text: '支付成功' },
      [OrderStatus.CREATED]: { color: 'orange', text: '等待支付' },
      [OrderStatus.REFUNDED]: { color: 'purple', text: '退款成功' },
      [OrderStatus.EXPIRED]: { color: 'red', text: '订单取消' }
    };
    const config = statusMap[status] || { color: 'default', text: `状态${status}` };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取套餐类型显示文本
  const getPaymentTypeText = (paymentType: string) => {
    const typeMap = {
      [PaymentType.MONTH]: '月度订阅',
      [PaymentType.YEAR]: '年度订阅', 
      [PaymentType.ONCE_MONTH]: '一次性月度',
      [PaymentType.ONCE_YEAR]: '一次性年度'
    };
    return typeMap[paymentType as PaymentType] || paymentType || '未知';
  };

  // 订单表格列
  const orderColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 200,
    },
    {
      title: '套餐类型',
      dataIndex: 'metadata',
      key: 'payment',
      render: (metadata: any) => {
        const paymentType = metadata?.payment;
        return getPaymentTypeText(paymentType);
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Order) => {
        const displayAmount = (amount / 100).toFixed(2); // Stripe金额通常以分为单位
        const symbol = record.currency === 'usd' ? '$' : record.currency === 'cny' ? '¥' : record.currency?.toUpperCase();
        return `${symbol}${displayAmount}`;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => getOrderStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created',
      key: 'created',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
    {
      title: '操作',
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
            查看详情
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
              去支付
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 订阅表格列
  const subscriptionColumns = [
    {
      title: '订阅ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: '套餐类型',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => getOrderStatusTag(status),
    },
    {
      title: '创建时间',
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
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          {record.status === OrderStatus.SUCCEEDED && (
            <Popconfirm
              title="确定要退订吗？退订后将无法享受会员权益。"
              onConfirm={() => handleUnsubscribe(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger size="small">退订</Button>
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
            <h2 className={styles.vipTitle}>PLUS会员</h2>
          </div>
          {isVip ? (<p className={styles.vipDescription}>
            尊敬的VIP用户，您已解锁全部会员权益
          </p>
          ) : (
            <p className={styles.vipDescription}>
              开通会员解锁全部功能，立享8种权益
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
              立即开通
            </button>
          )}
        </div>
      </div>

      <Card 
        title="个人信息" 
        className={styles.card}
        extra={
          <div className={styles.actions}>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              修改用户名
            </Button>
            <Button type="primary" danger onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="用户ID">{userInfo?.id}</Descriptions.Item>
          <Descriptions.Item label="用户名">{userInfo?.name}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{userInfo?.mail}</Descriptions.Item>
          <Descriptions.Item label="账号状态">
            {userInfo?.status === 1 ? '正常' : '禁用'}
          </Descriptions.Item>
          {isVip && (
            <>
              <Descriptions.Item label="会员类型">{vipCycleType}</Descriptions.Item>
              <Descriptions.Item label="会员到期时间">{vipExpireTime}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      {!isVip && (
        <div className={styles.normalUserCallToAction}>
          <p>开通PLUS会员，体验更多高级功能！</p>
          <button className={styles.activateButton} onClick={handleGoToVipPage}>
            立即开通PLUS会员
          </button>
        </div>
      )}
    </>
  );

  // 订单管理内容
  const renderOrderContent = () => (
    <div className={styles.orderContent}>
      <Tabs defaultActiveKey="orders">
        <TabPane tab="我的订单" key="orders">
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
                showTotal: (total) => `共 ${total} 条记录`,
                pageSizeOptions: ['10', '20', '50'],
              }}
              scroll={{ x: 1200 }} // 添加横向滚动以适应更多列
              locale={{
                emptyText: ordersLoading ? '加载中...' : '暂无订单记录'
              }}
            />
          </Card>
        </TabPane>
        <TabPane tab="我的订阅" key="subscriptions">
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
                showTotal: (total) => `共 ${total} 条记录`,
                pageSizeOptions: ['10', '20', '50'],
              }}
              locale={{
                emptyText: subscriptionsLoading ? '加载中...' : '暂无订阅记录'
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
              个人信息
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
              订单管理
            </span>
          } 
          key="orders"
        >
          {renderOrderContent()}
        </TabPane>
      </Tabs>

      <Modal
        title="修改用户名"
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
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名长度不能小于2个字符' },
              { max: 20, message: '用户名长度不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={orderDetailVisible}
        onCancel={() => setOrderDetailVisible(false)}
        className={styles.orderDetailModal}
        footer={[
          <Button key="close" onClick={() => setOrderDetailVisible(false)}>
            关闭
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
              前往支付
            </Button>
          )
        ]}
        width={600}
        loading={orderDetailLoading}
      >
        {currentOrderDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="订单ID">{currentOrderDetail.id}</Descriptions.Item>
            <Descriptions.Item label="内部ID">{currentOrderDetail._id}</Descriptions.Item>
            <Descriptions.Item label="套餐类型">
              {getPaymentTypeText(currentOrderDetail.metadata?.payment)}
            </Descriptions.Item>
            <Descriptions.Item label="订阅模式">{currentOrderDetail.mode}</Descriptions.Item>
            <Descriptions.Item label="金额">
              {(() => {
                const displayAmount = (currentOrderDetail.amount / 100).toFixed(2);
                const symbol = currentOrderDetail.currency === 'usd' ? '$' : 
                              currentOrderDetail.currency === 'cny' ? '¥' : 
                              currentOrderDetail.currency?.toUpperCase();
                return `${symbol}${displayAmount}`;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="已退款金额">
              {(() => {
                const displayAmount = (currentOrderDetail.amount_refunded / 100).toFixed(2);
                const symbol = currentOrderDetail.currency === 'usd' ? '$' : 
                              currentOrderDetail.currency === 'cny' ? '¥' : 
                              currentOrderDetail.currency?.toUpperCase();
                return `${symbol}${displayAmount}`;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getOrderStatusTag(currentOrderDetail.status)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(currentOrderDetail.created * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="过期时间">
              {new Date(currentOrderDetail.expires_at * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">{currentOrderDetail.userId}</Descriptions.Item>
            <Descriptions.Item label="价格ID">{currentOrderDetail.price}</Descriptions.Item>
            {currentOrderDetail.payment_intent && (
              <Descriptions.Item label="Payment Intent">{currentOrderDetail.payment_intent}</Descriptions.Item>
            )}
            {currentOrderDetail.subscription && (
              <Descriptions.Item label="订阅ID">{currentOrderDetail.subscription}</Descriptions.Item>
            )}
            {/* <Descriptions.Item label="成功页面">{currentOrderDetail.success_url}</Descriptions.Item> */}
            {currentOrderDetail.url && (
              <Descriptions.Item label="支付链接">
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => window.open(currentOrderDetail.url, '_blank')}
                >
                  打开支付页面
                </Button>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
} 