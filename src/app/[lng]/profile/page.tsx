"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message, Modal, Form, Input, Tabs, Table, Tag, Popconfirm, DatePicker, Select, Space } from "antd";
import { CrownOutlined, TrophyOutlined, GiftOutlined, StarOutlined, RocketOutlined, ThunderboltOutlined, HistoryOutlined, DollarOutlined, ShoppingCartOutlined, UserOutlined, GiftFilled, EditOutlined, CopyOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { WalletOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useUserStore } from "@/store/user";
import { getUserInfoApi, updateUserInfoApi, getPointsRecordsApi } from "@/api/apiReq";
import { createPaymentOrderApi, PaymentType as VipPaymentType } from "@/api/vip";
import { getOrderListApi, getOrderDetailApi, getSubscriptionListApi, refundOrderApi, unsubscribeApi } from "@/api/payment";
import type { Order, OrderListParams, SubscriptionListParams, RefundParams, UnsubscribeParams } from "@/api/types/payment";
import { OrderStatus, PaymentType } from "@/api/types/payment";
import styles from "./profile.module.css";
import { useTransClient } from "@/app/i18n/client";
import PointsRechargeModal from "@/components/modals/PointsRechargeModal";
import VipContentModal from "@/components/modals/VipContentModal";
import PointsDetailModal from "@/components/modals/PointsDetailModal";

import plusvip from "@/assets/images/plusvip.png";
import logoHesd from "@/assets/images/logo.png";

const { TabPane } = Tabs;
const { Option } = Select;

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userInfo, setUserInfo, clearLoginStatus, token, lang } = useUserStore();
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

  // removed URL-driven auto-open; now fully controlled by state
  
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

  // 积分充值相关状态
  const [pointsRechargeVisible, setPointsRechargeVisible] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(8);
  const [rechargeForm] = Form.useForm();
  const [isDragging, setIsDragging] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [pointsDetailVisible, setPointsDetailVisible] = useState(false);
  const [vipModalVisible, setVipModalVisible] = useState(false);

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
        const hasVipInfo = response.data.vipInfo;
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

  // 清理滑块事件监听器
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleSliderMouseMove);
      document.removeEventListener('mouseup', handleSliderMouseUp);
    };
  }, []);

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
    setVipModalVisible(true);
  };

  const handleFreeTrialModalCancel = () => {
    setFreeTrialModalVisible(false);
    localStorage.setItem('freeTrialShown', 'true');
  };

  // 积分相关处理函数
  const handleGoToPublish = () => {
    router.push('/accounts');
    // 这里可以添加唤起发布窗口的逻辑
  };

  const handleGoToVip = () => {
    router.push('/vip');
  };

  const handleRechargePoints = () => {
    setPointsRechargeVisible(true);
  };

  const handleRechargeSubmit = async (values: any) => {
    try {
      const response = await createPaymentOrderApi({
        success_url: lang === 'zh-CN' ? "/zh-CN/profile" : "/en/profile",
        mode: 'payment',
        payment: VipPaymentType.POINTS,
        quantity: rechargeAmount, // 购买几份1000积分的资源包
        metadata: {
          userId: userInfo?.id || ''
        }
      });
      
      if (response?.code === 0 && response.data && typeof response.data === 'object' && 'url' in response.data) {
        // 保存订单ID
        if ('id' in response.data) {
          setPaymentOrderId((response.data as any).id);
          setShowPaymentSuccess(true);
        }
        // 跳转到支付页面
        window.open((response.data as any).url, '_blank');
        // setPointsRechargeVisible(false);
        message.success(t('pointsPurchase.redirectingToPayment' as any));
      } else {
        message.error(response?.message || t('pointsPurchase.createOrderFailed' as any));
      }
    } catch (error) {
      message.error(t('pointsPurchase.createOrderFailed' as any));
    }
  };

  const handleRechargeCancel = () => {
    setPointsRechargeVisible(false);
    setPaymentOrderId(null);
    setShowPaymentSuccess(false);
  };

  // 处理"我已支付"按钮点击
  const handlePaymentSuccess = async () => {
    if (!paymentOrderId) return;
    
    try {
      const response = await getOrderDetailApi(paymentOrderId);
      if (response?.code === 0 && response.data) {
        const order = Array.isArray(response.data) ? response.data[0] : response.data;
        // 检查订单状态：1=支付成功，2=等待支付，3=退款成功，4=订单取消
        if (order.status === 1) {
          message.success(t('pointsPurchase.purchaseSuccess' as any));
          setShowPaymentSuccess(false);
          setPaymentOrderId(null);
          setPointsRechargeVisible(false);
          // 刷新用户信息
          fetchUserInfo();
        } else if (order.status === 2) {
          message.warning(t('pointsPurchase.paymentPending' as any));
        } else if (order.status === 3) {
          message.warning(t('pointsPurchase.orderRefunded' as any));
          setShowPaymentSuccess(false);
          setPaymentOrderId(null);
        } else if (order.status === 4) {
          message.warning(t('pointsPurchase.orderCancelled' as any));
          setShowPaymentSuccess(false);
          setPaymentOrderId(null);
        } else {
          message.warning(t('pointsPurchase.orderUnknown' as any));
        }
      } else {
        message.error(t('pointsPurchase.queryFailed' as any));
      }
    } catch (error) {
      message.error(t('pointsPurchase.queryFailed' as any));
    }
  };

  // 滑块拖动处理
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleSliderMouseMove);
    document.addEventListener('mouseup', handleSliderMouseUp);
  };

  const handleSliderMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const sliderTrack = document.querySelector(`.${styles.sliderTrack}`) as HTMLElement;
    if (!sliderTrack) return;
    
    const rect = sliderTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newAmount = Math.round(percentage * 49) + 1; // 1-50，只能选择1000的倍数
    setRechargeAmount(newAmount);
  };

  const handleSliderMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleSliderMouseMove);
    document.removeEventListener('mouseup', handleSliderMouseUp);
  };

  const handleSliderClick = (e: React.MouseEvent) => {
    const sliderTrack = e.currentTarget as HTMLElement;
    const rect = sliderTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newAmount = Math.round(percentage * 49) + 1; // 1-50
    setRechargeAmount(newAmount);
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
          'ai_service': { color: 'green', text: t('points.aiService' as any) },
          'user_register': { color: 'blue', text: t('points.userRegister' as any) },
          'publish': { color: 'purple', text: t('points.publish' as any) },
          'point': { color: 'cyan', text: t('points.point' as any) },
          'earn': { color: 'green', text: t('points.earn' as any) },
          'spend': { color: 'red', text: t('points.spend' as any) },
          'refund': { color: 'blue', text: t('points.refund' as any) },
          'expire': { color: 'orange', text: t('points.expire' as any) }
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
      {/* 顶部头部卡片 */}
      <div className={styles.headerCard}>
        {/* VIP 提示（已是VIP时显示） */}
        {isVip && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: '#a66ae4',
          fontWeight: 700,
        }}>
          <Image src={plusvip} alt="VIP" className={styles.vipBadgeTop} />
          <span>{t('vipHonorText' as any)}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8 }}>
      <div className={styles.avatar}>
          <Image src={logoHesd} alt="Logo"  className={styles.logoHesd} />
        </div>
        <div className={styles.nameBlock}>
          <div className={styles.nameRow}>
            <span>{userInfo?.name || '-'}</span>
            <EditOutlined style={{ cursor: 'pointer', color: '#a66ae4' }} onClick={() => setIsModalOpen(true)} />
          </div>
          <div className={styles.subRow}>
            <span>{userInfo?.mail || '-'}</span>
          </div>
          <div className={styles.scoreRowThis}>
          <span className={styles.scoreLabel}>{t('inviteCode' as any)}</span>
          <span className={styles.scoreValue}>{userInfo?.popularizeCode || '-'}</span>
          <CopyOutlined
            style={{ color: '#a66ae4', cursor: 'pointer' }}
            onClick={() => {
              const code = userInfo?.popularizeCode || '';
              if (!code) return;
              navigator.clipboard?.writeText(code).then(() => {
                message.success(t('copySuccess' as any));
              }).catch(() => {
                message.success(t('copySuccess' as any));
              });
            }}
          />
        </div>
        </div>
      </div>
       
        <div className={styles.scoreRow}>
          

        
        </div>
      </div>

            

      {/* 深色统计卡片 */}
      <div className={styles.statsCard}>
        <div className={styles.statsHeader}>
          <Image src={plusvip} alt="VIP"  className={styles.vipBadge} />
          <span className={styles.statsTitle}>{t('stats.totalEarned' as any)}</span>
          <span className={styles.statsAmount}>{(userInfo as any)?.totalIncome ?? 0}</span>
          <span className={styles.statsCurrency}>{t('stats.currencyYuan' as any)}</span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statsItem}  onClick={() => router.push('/income')} >
            
            <div className={styles.statsLabel}>{t('stats.balance' as any)} <span className={styles.statsValue}> {userInfo?.income || 0} </span> CNY</div>
          </div>
          <div className={styles.statsItem} style={{cursor:'pointer'}} onClick={() => setPointsDetailVisible(true)}>
            
            <div className={styles.statsLabel}>{t('stats.points' as any)} <span className={styles.statsValue}>{Math.floor((userInfo?.score as number) || 0) } </span> {t('stats.points' as any)}</div>
          </div>
          
        </div>
      </div>


      {/* 账号状态（仅非正常时显示） */}
      {userInfo?.status !== 1 && (
        <div style={{
          marginTop: 18,
          marginBottom: 18,
          color: '#ef4444',
          fontSize: 14
        }}>
          {t('accountStatus')}: {t('disabled')}
        </div>
      )}



      {/* 底部申请注销按钮 */}
      <div style={{ textAlign: 'center', paddingTop: 24, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:"flex-start"  }}>
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between', alignItems:"flex-start", marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#54687B' }}>{t('deleteAccount.title' as any)}</div>
          <div>{t('deleteAccount.desc' as any)}</div>
        </div>
        <Button danger>{t('deleteAccount.apply' as any)}</Button>
      </div>
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

      {/* 积分充值弹窗（复用组件） */}
      <PointsRechargeModal open={pointsRechargeVisible} onClose={handleRechargeCancel} />
      <PointsDetailModal open={pointsDetailVisible} onClose={() => setPointsDetailVisible(false)} />
      <VipContentModal open={vipModalVisible} onClose={() => setVipModalVisible(false)} />
    </div>
  );
} 