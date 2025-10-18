"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { Modal, Button, Tag, message } from "antd";
import { useRouter } from "next/navigation";
import { createPaymentOrderApi, PaymentType } from "@/api/vip";
import { useTransClient } from "@/app/i18n/client";
import styles from "./outsideCloseModal.module.css";
import vipStyles from "./vipContentModal.module.css";
import PointsDetailModal from "@/components/modals/PointsDetailModal";
import { useUserStore } from "@/store/user";
import PointsRechargeModal from "@/components/modals/PointsRechargeModal";
import SubscriptionManagementModal from "@/components/modals/SubscriptionManagementModal";

import logo from '@/assets/images/logo.png';
import Image from "next/image";

interface VipContentModalProps {
  open: boolean;
  onClose: () => void;
}

const VipContentModal = memo(({ open, onClose }: VipContentModalProps) => {
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const userStore = useUserStore();
  const router = useRouter();
  const { t } = useTransClient('vip');
  const modalWidth = useMemo(() => "900px" as const, []);
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'year' | 'month' | 'once'>('year');
  const [loading, setLoading] = useState(false);
  const [canUseTrial, setCanUseTrial] = useState(false);
  
  // 辅助函数处理翻译
  const translate = (key: string) => t(key as any);
  
  // 状态判断辅助函数
  const getVipStatusInfo = (status: string) => {
    switch (status) {
      case 'none':
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false };
      case 'trialing':
        return { isVip: true, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false };
      case 'monthly_once':
        return { isVip: true, isMonthly: true, isYearly: false, isAutoRenew: false, isOnce: true };
      case 'yearly_once':
        return { isVip: true, isMonthly: false, isYearly: true, isAutoRenew: false, isOnce: true };
      case 'active_monthly':
        return { isVip: true, isMonthly: true, isYearly: false, isAutoRenew: true, isOnce: false };
      case 'active_yearly':
        return { isVip: true, isMonthly: false, isYearly: true, isAutoRenew: true, isOnce: false };
      case 'active_nonrenewing':
        return { isVip: true, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false };
      case 'expired':
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false };
      default:
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false };
    }
  };
  
  // 判断用户是否为有效会员
  const isVip = useMemo(() => {
    const vipInfo = userStore.userInfo?.vipInfo;
    if (!vipInfo) return false;
    
    const statusInfo = getVipStatusInfo(vipInfo.status);
    return statusInfo.isVip && vipInfo.expireTime && new Date(vipInfo.expireTime) > new Date();
  }, [userStore.userInfo]);

  // 判断用户是否已经是相同类型的会员且未过期
  const isCurrentPlan = useMemo(() => {
    if (!userStore.userInfo?.vipInfo || !isVip) {
      return {
        month: false,
        year: false,
        once: false
      };
    }
    
    const vipInfo = userStore.userInfo.vipInfo;
    const statusInfo = getVipStatusInfo(vipInfo.status);
    return {
      month: statusInfo.isMonthly && statusInfo.isAutoRenew, // 连续包月
      year: statusInfo.isYearly && statusInfo.isAutoRenew,  // 连续包年
      once: statusInfo.isOnce // 一次性购买
    };
  }, [userStore.userInfo, isVip]);
  
  const handleTabClick = (tab: 'year' | 'month' | 'once') => {
    setActiveTab(tab);
  };

  // 检查用户是否可以享受免费试用
  useEffect(() => {
    console.log('userStore.userInfo', userStore);
    if (userStore.userInfo) {
      // 如果用户没有vipInfo，说明从未开过会员，可以享受免费试用
      const hasVipInfo = userStore.userInfo.vipInfo;
      console.log('hasVipInfo', hasVipInfo);
      setCanUseTrial(!hasVipInfo);
    }
  }, [userStore.userInfo]);

  // 开通会员逻辑
  const handleActivate = async (planType: 'year' | 'month' | 'once') => {
    console.log('canUseTrial', canUseTrial);
    try {
      setLoading(true);
      
      // 检查用户是否已登录
      if (!userStore.userInfo?.id) {
        message.error(t('pleaseLoginFirst'));
        router.push('/login');
        return;
      }

      // 检查用户是否已经是相同类型的会员且未过期
      if (isCurrentPlan[planType]) {
        message.warning(translate('currentPlan'));
        setLoading(false);
        return;
      }

      // 根据选择的计划映射到支付类型
      let paymentType;
      let paymentMethod;
      let flagTrialPeriodDays = 0; // 默认不给免费试用

      switch (planType) {
        case 'once':
          paymentType = PaymentType.ONCE_MONTH;
          paymentMethod = 'payment';
          break;
        case 'month':
          paymentType = PaymentType.MONTH;
          paymentMethod = 'subscription';
          // 如果是订阅模式且用户从未开过会员，给免费试用
          flagTrialPeriodDays = canUseTrial ? 1 : 0;
          break;
        case 'year':
          paymentType = PaymentType.YEAR;
          paymentMethod = 'subscription';
          // 如果是订阅模式且用户从未开过会员，给免费试用
          flagTrialPeriodDays = canUseTrial ? 1 : 0;
          break;
        default:
          paymentType = PaymentType.MONTH;
          paymentMethod = 'subscription';
          flagTrialPeriodDays = canUseTrial ? 1 : 0;
      }
      
      // 创建支付订单
      const response: any = await createPaymentOrderApi({
        success_url: userStore.lang === 'zh-CN' ? "/zh-CN/profile" : "/en/profile",
        mode: paymentMethod,
        payment: paymentType,
        metadata: {
          userId: userStore.userInfo.id
        }
      });
      
      if (response?.code === 0) {
        message.success(t('paymentOrderCreated'));
        // 直接跳转到支付页面
        if (response.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          message.error(t('paymentLinkNotFound'));
        }
      } else {
        message.error(response?.message || response?.msg || t('createPaymentOrderFailed'));
      }
    } catch (error) {
      console.error('Create payment order failed:', error);
      message.error(t('createPaymentOrderError'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={modalWidth}
      className={styles.outsideCloseModal}
      destroyOnHidden
      centered
    >
      <div className={vipStyles.wrapper}>
        {/* 非会员顶部区域 */}
        {
          !isVip && (
            <div className={vipStyles.header}
              style={{ background: 'transparent' }}>
              <div className={vipStyles.titleBlock}>
                <h2 className={vipStyles.title}>
                  {translate('modal.title')} <span className={vipStyles.highlight}>{translate('modal.highlight')}</span>
                </h2>
                <div className={vipStyles.links}>
                  <span>{translate('modal.choosePlan')}</span>
                  <span className={vipStyles.linkButton}
                    onClick={() => setRechargeVisible(true)}
                  >{translate('modal.buyPoints')}</span>
                </div>
              </div>
              <div className={vipStyles.headerRight}>
                <Button className={vipStyles.pointsBtn} onClick={() => setPointsModalVisible(true)}>{translate('modal.pointsDetail')}</Button>
              </div>
            </div>
          )
        }
        

        {/* 会员信息区域 */}
        {isVip && userStore.userInfo?.vipInfo && (
          <div className={vipStyles.vipInfoSection}>
            <div className={vipStyles.vipInfoRow}>
              <div className={vipStyles.userInfo}>
                <div className={vipStyles.avatar}>
                  {userStore.userInfo.avatar ? (
                    <img src={userStore.userInfo.avatar} alt="用户头像" />
                  ) : (
                    <Image src={logo} alt="用户头像" style={{ padding: '3px', backgroundColor: '#e9d5ff' }} />
                  )}
                </div>
                <div className={vipStyles.userDetails}>
                  <div className={vipStyles.userName}>{userStore.userInfo.name}</div>
                  {/* <div className={vipStyles.userEmail}>{userStore.userInfo.mail}</div> */}
                </div>
              </div>
                <div className={vipStyles.vipActions}>
                  <Button className={vipStyles.detailBtn} onClick={() => setPointsModalVisible(true)}>{translate('modal.pointsDetail')}</Button>
                  <Button className={vipStyles.subscriptionBtn} onClick={() => setSubscriptionModalVisible(true)}>{translate('modal.vipInfo.subscription')}</Button>
                </div>
            </div>
            
            <div className={vipStyles.vipPlanInfo}>
              <div className={vipStyles.planDetails}>
                <div className={vipStyles.planType}>
                  {translate('modal.vipInfo.planType')}: 
                  <span className={vipStyles.planValue}>
                    {(() => {
                      const statusInfo: any = getVipStatusInfo(userStore.userInfo.vipInfo.status);
                      if (statusInfo.isYearly && statusInfo.isAutoRenew) {
                        return translate('modal.vipInfo.yearly');
                      } else if (statusInfo.isYearly && !statusInfo.isAutoRenew) {
                        return translate('modal.vipInfo.yearly2');
                      } else if (statusInfo.isMonthly && statusInfo.isAutoRenew) {
                        return translate('modal.vipInfo.monthly');
                      } else if (statusInfo.isMonthly && !statusInfo.isAutoRenew) {
                        return translate('modal.vipInfo.monthly2');
                      } else if (statusInfo.isOnce) {
                        return statusInfo.isYearly ? translate('modal.vipInfo.yearly2') : translate('modal.vipInfo.monthly2');
                      } else if (userStore.userInfo.vipInfo.status === 'trialing') {
                        return ` ${translate('modal.vipInfo.trial' as any)}`;
                      } else if (userStore.userInfo.vipInfo.status === 'active_nonrenewing') {
                        return translate('modal.vipInfo.cancelled' as any);
                      }
                      return translate('modal.vipInfo.monthly');
                    })()}
                  </span>
                </div>
                <div className={vipStyles.expireTime}>
                  {(() => {
                    const statusInfo = getVipStatusInfo(userStore.userInfo.vipInfo.status);
                    return statusInfo.isAutoRenew ? translate('modal.vipInfo.xufeiTime') : translate('modal.vipInfo.expireTime');
                  })()}: 
                  <span className={vipStyles.expireValue}>
                    {new Date(userStore.userInfo.vipInfo.expireTime).toLocaleDateString()}
                  </span>
                </div>

                <div className={vipStyles.expireTime}>
                  {translate('modal.vipInfo.remainingPoints')}: 

                  <div>
                    <span onClick={() => setPointsModalVisible(true)} className={vipStyles.expireValue} style={{ color: '#727E84' }}>
                      {(userStore.userInfo.score || 0).toFixed(1)}
                    </span>
                    <span onClick={() => setRechargeVisible(true)} className={vipStyles.expireValueHover} style={{ color: '#a66ae4', paddingLeft: 8 }}>
                      {translate('modal.buyPoints')}
                    </span>
                  </div>

                </div>
              </div>
              <div className={vipStyles.pointsInfo}>
                
              </div>
            </div>
            
          </div>
        )}

{isVip && userStore.userInfo?.vipInfo && (<h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginTop: 16, marginBottom: 16 }}> {translate('subscriptionPlans')} </h5>)}

        {/* 选项卡 */}
        <div className={vipStyles.switchRow}>
          <div onClick={() => handleTabClick('year')} className={`${vipStyles.switchBtn} ${activeTab === 'year' ? vipStyles.active : ''}`}>
            {translate('modal.tabs.yearly')} <Tag style={{ marginLeft: 6, border: '1px solid rgba(184,221,255,.08)' }}>{translate('modal.savings.yearly')}</Tag>
          </div>
          <div onClick={() => handleTabClick('month')} className={`${vipStyles.switchBtn} ${activeTab === 'month' ? vipStyles.active : ''}`}>
            {translate('modal.tabs.monthly')} <Tag style={{ marginLeft: 6, border: '1px solid rgba(184,221,255,.08)' }}>{translate('modal.savings.monthly')}</Tag>
          </div>
         {
          (() => {
            const vipInfo = userStore.userInfo?.vipInfo;
            if (!vipInfo) return true;
            const statusInfo = getVipStatusInfo(vipInfo.status);
            return !statusInfo.isAutoRenew;
          })() && (
            <div onClick={() => handleTabClick('once')} className={`${vipStyles.switchBtn} ${activeTab === 'once' ? vipStyles.active : ''}`}>
              {translate('modal.tabs.once')}
            </div>
          )
         } 
        </div>

        {/* 价格区域 */}
        <div className={vipStyles.grid}>


          {activeTab === 'year' && (
            <>

              {/* 左侧免费卡片 */}
              <div className={vipStyles.freeCard}>
                <div className={vipStyles.freeTitle}>{translate('modal.free.title')}</div>
                <div className={vipStyles.freePrice}><span>{translate('modal.free.price')}</span><span className={vipStyles.unit}>{translate('modal.free.period')}</span></div>
                <div className={vipStyles.freeForever}>{translate('modal.free.forever')}</div>
                <Button disabled className={vipStyles.freeBtn}>
                  {isVip ? translate('modal.free.freePlan') : translate('modal.free.currentPlan')}
                </Button>
                {/* <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> {translate('modal.free.points')}</div> */}
                <ul className={vipStyles.featureList}>
                <li>{translate('modal.free.points')}</li>
                  <li>{translate('modal.free.features.dailyPoints')}</li>
                  <li>{translate('modal.free.features.maxPoints')}</li>
                  <li>{translate('modal.free.features.videos')}</li>
                  <li>{translate('modal.free.features.images')}</li>
                </ul>
              </div>

              {/* 高级会员 */}
              <div className={`${vipStyles.planCard} ${vipStyles.premium}`} >
                <div className={vipStyles.planHead}>{translate('modal.plans.yearly.title')} <Tag color="#5b7cff">{translate('modal.plans.yearly.bestValue')}</Tag></div>
                <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>$</span><span className={vipStyles.bigNum}>{translate('modal.plans.yearly.price')}</span><span className={vipStyles.unit}>{translate('modal.plans.yearly.period')}</span></div>
                <div className={vipStyles.planDesc}>
                  {translate('modal.plans.yearly.button')}
                  </div>
                 <Button 
                   className={vipStyles.primaryBtn}
                   onClick={() => handleActivate('year')}
                   loading={loading}
                   disabled={isCurrentPlan.year || isCurrentPlan.month}
                 >
                   {isCurrentPlan.year ? translate('currentPlan') : translate('modal.plans.goumai')}
                 </Button>
                 <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> {translate('modal.plans.yearly.features.dailyPoints')}</div>
                <div className={vipStyles.subDesc}>{translate('modal.plans.yearly.points')}</div>
                <ul className={vipStyles.featureList}>
                  <li>{translate('modal.plans.yearly.description')}</li>
                  <li>{translate('modal.plans.yearly.features.contentReview')}</li>
                  <li>{translate('modal.plans.yearly.features.multiModel')}</li>
                  <li>{translate('modal.plans.yearly.features.textToVideo')}</li>
                  <li>{translate('modal.plans.yearly.features.aiGeneration')}</li>
                  <li>{translate('modal.plans.yearly.features.noWatermark')}</li>
                </ul>
              </div>
            </>
          )}


          {activeTab === 'month' && (
            <>
              {/* 左侧免费卡片 */}
              <div className={vipStyles.freeCard}>
                <div className={vipStyles.freeTitle}>{translate('modal.free.title')}</div>
                <div className={vipStyles.freePrice}><span>{translate('modal.free.price')}</span><span className={vipStyles.unit}>{translate('modal.free.period')}</span></div>
                <div className={vipStyles.freeForever}>{translate('modal.free.forever')}</div>
                <Button disabled className={vipStyles.freeBtn}>
                  {isVip ? translate('modal.free.freePlan') : translate('modal.free.currentPlan')}
                </Button>
                <ul className={vipStyles.featureList}>
                <li>{translate('modal.free.points')}</li>
                  <li>{translate('modal.free.features.dailyPoints')}</li>
                  <li>{translate('modal.free.features.maxPoints')}</li>
                  <li>{translate('modal.free.features.videos')}</li>
                  <li>{translate('modal.free.features.images')}</li>
                </ul>
              </div>

               {/* 月度会员 */}
               <div className={`${vipStyles.planCard} ${vipStyles.premium}`} >
                 <div className={vipStyles.planHead}>{translate('modal.plans.monthly.title')} </div>
                 <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>$</span><span className={vipStyles.bigNum}>{translate('modal.plans.monthly.price')}</span><span className={vipStyles.unit}>{translate('modal.plans.monthly.period')}</span></div>
                 <div className={vipStyles.planDesc}>
                  {translate('modal.plans.monthly.button')}
                  </div>
                 <Button 
                   className={vipStyles.primaryBtn}
                   onClick={() => handleActivate('month')}
                   loading={loading}
                   disabled={isCurrentPlan.month || isCurrentPlan.year}
                 >
                   {isCurrentPlan.month ? translate('currentPlan') : translate('modal.plans.goumai')}
                 </Button>
                 <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> {translate('modal.plans.yearly.features.dailyPoints')}</div>
                <div className={vipStyles.subDesc}>{translate('modal.plans.monthly.points')}</div>
                <ul className={vipStyles.featureList}>
                  <li>{translate('modal.plans.monthly.description')}</li>
                  <li>{translate('modal.plans.yearly.features.contentReview')}</li>
                  <li>{translate('modal.plans.yearly.features.multiModel')}</li>
                  <li>{translate('modal.plans.yearly.features.textToVideo')}</li>
                  <li>{translate('modal.plans.yearly.features.aiGeneration')}</li>
                  <li>{translate('modal.plans.yearly.features.noWatermark')}</li>
                </ul>
              </div>
            </>
          )}

          {activeTab === 'once' && (
            <>
              {/* 左侧免费卡片 */}
              <div className={vipStyles.freeCard}>
                <div className={vipStyles.freeTitle}>{translate('modal.free.title')}</div>
                <div className={vipStyles.freePrice}><span>{translate('modal.free.price')}</span><span className={vipStyles.unit}>{translate('modal.free.period')}</span></div>
                <div className={vipStyles.freeForever}>{translate('modal.free.forever')}</div>
                <Button disabled className={vipStyles.freeBtn}>
                  {isVip ? translate('modal.free.freePlan') : translate('modal.free.currentPlan')}
                </Button>
                <ul className={vipStyles.featureList}>
                <li>{translate('modal.free.points')}</li>
                  <li>{translate('modal.free.features.dailyPoints')}</li>
                  <li>{translate('modal.free.features.maxPoints')}</li>
                  <li>{translate('modal.free.features.videos')}</li>
                  <li>{translate('modal.free.features.images')}</li>
                </ul>
              </div>

               {/* 一次性月度会员 */}
               <div className={`${vipStyles.planCard} ${vipStyles.premium}`} >
                 <div className={vipStyles.planHead}>{translate('modal.plans.once.title')} </div>
                 <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>$</span><span className={vipStyles.bigNum}>{translate('modal.plans.once.price')}</span><span className={vipStyles.unit}>{translate('modal.plans.once.period')}</span></div>
                 <Button 
                   className={vipStyles.primaryBtn}
                   onClick={() => handleActivate('once')}
                   loading={loading}
                 >
                   {translate('modal.plans.goumai')}
                 </Button>
                 <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> {translate('modal.plans.yearly.features.dailyPoints')}</div>
                <div className={vipStyles.subDesc}>{translate('modal.plans.once.points')}</div>
                <ul className={vipStyles.featureList}>
                  <li>{translate('modal.plans.once.description')}</li>
                  <li>{translate('modal.plans.yearly.features.contentReview')}</li>
                  <li>{translate('modal.plans.yearly.features.multiModel')}</li>
                  <li>{translate('modal.plans.yearly.features.textToVideo')}</li>
                  <li>{translate('modal.plans.yearly.features.aiGeneration')}</li>
                  <li>{translate('modal.plans.yearly.features.noWatermark')}</li>
                </ul>
              </div>
            </>
          )}

        </div>
      </div>

      {/* 积分详情弹窗（复用组件） */}
      <PointsDetailModal open={pointsModalVisible} onClose={() => setPointsModalVisible(false)} />

      <PointsRechargeModal open={rechargeVisible} onClose={() => setRechargeVisible(false)} />

      {/* 订阅管理弹窗 */}
      <SubscriptionManagementModal open={subscriptionModalVisible} onClose={() => setSubscriptionModalVisible(false)} />
    </Modal>
  );
});

export default VipContentModal;


