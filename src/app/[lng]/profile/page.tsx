"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message, Modal, Form, Input } from "antd";
import { CrownOutlined, TrophyOutlined, GiftOutlined, StarOutlined, RocketOutlined, ThunderboltOutlined, HistoryOutlined, DollarOutlined, UserOutlined, GiftFilled, EditOutlined, CopyOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { WalletOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useUserStore } from "@/store/user";
import { getUserInfoApi, updateUserInfoApi, getPointsRecordsApi } from "@/api/apiReq";
import { cancelAccountApi } from "@/api/signIn";
import { createPaymentOrderApi, PaymentType as VipPaymentType } from "@/api/vip";
import { getOrderDetailApi } from "@/api/payment";
import type { Order } from "@/api/types/payment";
import { OrderStatus } from "@/api/types/payment";
import styles from "./profile.module.css";
import { useTransClient } from "@/app/i18n/client";
import PointsRechargeModal from "@/components/modals/PointsRechargeModal";
import VipContentModal from "@/components/modals/VipContentModal";
import PointsDetailModal from "@/components/modals/PointsDetailModal";

import plusvip from "@/assets/images/plusvip.png";
import logoHesd from "@/assets/images/logo.png";


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

  // 注销账户相关状态
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelForm] = Form.useForm();
  const [cancelCode, setCancelCode] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  // 检查是否已经显示过免费会员提示
  useEffect(() => {
    const hasShown = localStorage.getItem('freeTrialShown');
    if (hasShown) {
      setHasShownFreeTrial(true);
    }
  }, []);

  // removed URL-driven auto-open; now fully controlled by state

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


  // 获取订单详情
  const fetchOrderDetail = async (orderId: string) => {
    setOrderDetailLoading(true);
    try {
      const response: any = await getOrderDetailApi(orderId);
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

  /**
   * 获取注销验证码
   */
  const handleGetCancelCode = async () => {
    try {
      const response = await cancelAccountApi.getCancelCode();
      console.log('验证码响应:', response);

      if (response && response.code === 0) {
        setCancelCode(response.data?.code || '');
        message.success('验证码已发送');
        // 开始倒计时
        setCodeCountdown(60);
      } else {
        message.error(response?.message || '获取验证码失败');
      }
    } catch (error) {
      console.error('获取验证码错误:', error);
      message.error('获取验证码失败');
    }
  };

  /**
   * 处理注销账户
   */
  const handleCancelAccount = async () => {
    try {
      const values = await cancelForm.validateFields();
      setCancelLoading(true);

      console.log('发送注销请求，验证码:', values.code);

      const response: any = await cancelAccountApi.cancelAccount({
        code: values.code
      });


      if (response && response.code === 0) {
        message.success('账户注销成功');
        setCancelModalVisible(false);
        // 清除登录状态并跳转到登录页
        clearLoginStatus();
        router.push('/login');
      }
    } catch (error) {

    } finally {
      setCancelLoading(false);
    }
  };

  /**
   * 打开注销确认弹窗
   */
  const handleOpenCancelModal = () => {
    setCancelModalVisible(true);
    cancelForm.resetFields();
    setCancelCode('');
    setCodeCountdown(0);
  };

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (codeCountdown > 0) {
      timer = setTimeout(() => {
        setCodeCountdown(codeCountdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [codeCountdown]);

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
        return <span style={{ color: config.color, fontWeight: 'bold' }}>{config.text}</span>;
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
    <div style={{}}>
      {/* 顶部头部卡片 */}

      {/* VIP 提示（已是VIP时显示） */}
      {isVip && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: 8,
          color: '#a66ae4',
          fontWeight: 700,
        }}>
          <Image src={plusvip} alt="VIP" className={styles.vipBadgeTop} />
          <span>{t('vipHonorText' as any)}</span>
        </div>
      )}

      <div className={styles.headerCard}>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div className={styles.avatar}>
            <Image src={logoHesd} alt="Logo" className={styles.logoHesd} />
          </div>
          <div className={styles.nameBlock}>
            <div className={styles.nameRow}>
              <span>{userInfo?.name || '-'}</span>
              <EditOutlined style={{ cursor: 'pointer', color: '#a66ae4' }} onClick={() => setIsModalOpen(true)} />
            </div>
            <div className={styles.subRow}>
              <span>{userInfo?.mail || '-'}</span>
            </div>

          </div>
        </div>

        <div className={styles.scoreRow}>



        </div>
      </div>

      {/* 深色统计卡片 */}
      <div className={styles.statsCard}>
        <div className={styles.statsHeader}>
          <Image src={plusvip} alt="VIP" className={styles.vipBadge} />
          <span className={styles.statsTitle}>{t('stats.totalEarned' as any)}</span>
          <span className={styles.statsAmount}>{((userInfo as any)?.totalIncome as number / 100 || 0).toFixed(2)}</span>
          <span className={styles.statsCurrency}>{t('stats.currencyYuan' as any)}</span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statsItem} onClick={() => router.push('/income')} >

            <div className={styles.statsLabel}>{t('stats.balance' as any)} <span className={styles.statsValue}> {( userInfo?.income as number / 100 || 0).toFixed(2)} </span> CNY</div>
          </div>
          <div className={styles.statsItem} style={{ cursor: 'pointer' }} onClick={() => setPointsDetailVisible(true)}>

            <div className={styles.statsLabel}>{t('stats.points' as any)} <span className={styles.statsValue}>{(Math.floor((userInfo?.score as number) || 0)).toFixed(1)} </span> {t('stats.points' as any)}</div>
          </div>

        </div>
      </div>


       <div className={styles.editCard}>
         <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
           <span className={styles.scoreLabel}>{t('username')}</span>
           <div className={styles.fieldContainer}>
             <span className={styles.fieldInput}>{userInfo?.name || '-'}</span>
             <button className={styles.fieldButton} onClick={() => setIsModalOpen(true)}>{t('edit' as any)}</button>
           </div>
         </div>
         <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
           <span className={styles.scoreLabel}>{t('inviteCode' as any)}</span>
           <div className={styles.fieldContainer}>
             <span className={styles.fieldInput}>{userInfo?.popularizeCode || '-'}</span>
             <button className={styles.fieldButton} onClick={() => {
              const code = userInfo?.popularizeCode || '';
              if (!code) return;
              navigator.clipboard?.writeText(code).then(() => {
                message.success(t('copySuccess' as any));
              }).catch(() => {
                message.success(t('copySuccess' as any));
              });
            }}>{t('copy' as any)}</button>
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
      {/* <div style={{ textAlign: 'center', paddingTop: 24, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:"flex-start"  }}>
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between', alignItems:"flex-start", marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#54687B' }}>{t('deleteAccount.title' as any)}</div>
          <div>{t('deleteAccount.desc' as any)}</div>
        </div>
        <Button danger onClick={handleOpenCancelModal}>{t('deleteAccount.apply' as any)}</Button>
      </div> */}
    </div>
  );



  if (loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileContent}>
        {renderProfileContent()}
      </div>

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
              {currentOrderDetail.metadata?.payment || t('unknown')}
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
              {(() => {
                const statusMap = {
                  [OrderStatus.SUCCEEDED]: { color: 'green', text: t('paymentSuccess') },
                  [OrderStatus.CREATED]: { color: 'orange', text: t('waitingForPayment') },
                  [OrderStatus.REFUNDED]: { color: 'purple', text: t('refundSuccess') },
                  [OrderStatus.EXPIRED]: { color: 'red', text: t('orderCancelled') }
                };
                const config = statusMap[currentOrderDetail.status] || { color: 'default', text: `状态${currentOrderDetail.status}` };
                return <span style={{ color: config.color, fontWeight: 'bold' }}>{config.text}</span>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label={t('createTime')}>
              {new Date(currentOrderDetail.created * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label={ t('expireTime')}>
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

      {/* 注销账户确认弹窗 */}
      <Modal
        title={t('cancelAccount' as any)}
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ paddingTop: '20px' }}>
          <div style={{ marginBottom: '20px', color: '#666', lineHeight: '1.6' }}>
            <p>{t('cancelAccountWarning' as any)}</p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              {(t('cancelAccountDataList' as any) as string).split(',').map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{t('cancelAccountCaution' as any)}</p>
            <p style={{ color: '#1890ff', fontSize: '14px' }}>{t('cancelAccountSecurity' as any)}</p>
          </div>

          <Form
            form={cancelForm}
            layout="vertical"
            onFinish={handleCancelAccount}
          >
            <Form.Item
              label={t('verificationCode' as any)}
              name="code"
              rules={[{ required: true, message: t('pleaseEnterVerificationCode' as any) }]}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input placeholder={t('pleaseEnterVerificationCode' as any)} />
                <Button
                  onClick={handleGetCancelCode}
                  disabled={codeCountdown > 0}
                  loading={codeCountdown > 0}
                >
                  {codeCountdown > 0 ? `${codeCountdown}${t('resendAfter' as any)}` : t('getVerificationCode' as any)}
                </Button>
              </div>
            </Form.Item>


            <Form.Item>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button onClick={() => setCancelModalVisible(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  type="primary"
                  danger
                  htmlType="submit"
                  loading={cancelLoading}
                >
                  {t('confirmCancel' as any)}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
} 