"use client";

import { useState } from "react";
import { CrownOutlined, TrophyOutlined, GiftOutlined, StarOutlined, RocketOutlined, DollarOutlined, HistoryOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { createPaymentOrderApi, PaymentType } from "@/api/vip";
import { useUserStore } from "@/store/user";
import styles from "./vip.module.css";
import { useTransClient } from "@/app/i18n/client";

export default function VipPage() {
  const router = useRouter();
  const { userInfo, lang } = useUserStore();
  const { t } = useTransClient('vip');
  const [selectedPlan, setSelectedPlan] = useState('onceMonth'); // 'onceMonth', 'month', 'year'
  const [loading, setLoading] = useState(false);

  // 会员权益数据 (8个)
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

  const handleActivate = async () => {
    try {
      setLoading(true);
      
      // 检查用户是否已登录
      if (!userInfo?.id) {
        message.error(t('pleaseLoginFirst'));
        router.push('/login');
        return;
      }

      // 根据选择的计划映射到支付类型
      let paymentType;
      let paymentMethod;
      switch (selectedPlan) {
        case 'onceMonth':
          paymentType = PaymentType.ONCE_MONTH;
          paymentMethod = 'payment';
          break;
        case 'month':
          paymentType = PaymentType.MONTH;
          paymentMethod = 'subscription';
          break;
        case 'year':
          paymentType = PaymentType.YEAR;
          paymentMethod = 'subscription';
          break;
        default:
          paymentType = PaymentType.ONCE_MONTH;
          paymentMethod = 'payment';
      }
      
      // 创建支付订单
      const response: any = await createPaymentOrderApi({
        success_url: lang === 'zh-CN' ? "/zh-CN/profile" : "/en/profile",
        mode: paymentMethod,
        payment: paymentType,
        metadata: {
          userId: userInfo.id
        }
      });
      
      if (response?.code === 0) {
        message.success(t('paymentOrderCreated'));
        // 直接跳转到支付页面
        if (response.data?.url) {
          // window.location.href = response.data.url;
          window.open(response.data.url, '_blank');
        } else {
          message.error(t('paymentLinkNotFound'));
        }
      } else {
        message.error(response?.message || response?.msg || t('createPaymentOrderFailed'));
      }
    } catch (error) {
      console.error('创建支付订单失败:', error);
      message.error(t('createPaymentOrderError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.vipCard}>
        <div className={styles.vipContent}>
          <div className={styles.vipHeader}>
            <span className={styles.vipIcon}><CrownOutlined /></span>
            <h2 className={styles.vipTitle}>{t('title')}</h2>
          </div>
          <p className={styles.vipDescription}>
            {t('description')}
          </p>
          <div className={styles.benefitsGrid}>
            {vipBenefits.map((benefit, index) => (
              <div key={index} className={styles.benefitItem}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <p className={styles.benefitName}>{benefit.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className={styles.title}>选择开通时长</h3>
      <div className={styles.priceOptions}>
        <div 
          className={`${styles.priceCard} ${selectedPlan === 'onceMonth' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('onceMonth')}
        >
          <span className={styles.badge}>一次性</span>
          <h4>月度会员</h4>
          <div>
            <span className={styles.originalPrice}>$20</span>
            <span className={styles.discount}>一次性</span>
          </div>
          <p className={styles.currentPrice}>$<span>20</span></p>
        </div>
        <div 
          className={`${styles.priceCard} ${selectedPlan === 'month' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('month')}
        >
          <span className={styles.badge}>25%优惠</span>
          <h4>月费会员</h4>
          <div>
            <span className={styles.originalPrice}>$20</span>
            <span className={styles.discount}>25%优惠</span>
          </div>
          <p className={styles.currentPrice}>$<span>15</span>/月</p>
        </div>
        <div 
          className={`${styles.priceCard} ${selectedPlan === 'year' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('year')}
        >
          <span className={styles.badge}>50%优惠</span>
          <h4>年费会员</h4>
          <div>
            <span className={styles.originalPrice}>$180</span>
            <span className={styles.discount}>50%优惠</span>
          </div>
          <p className={styles.currentPrice}>$<span>10</span>/月</p>
          <p className={styles.monthlyPrice}>$120/年</p>
        </div>
      </div>
      
      <p className={styles.subscriptionInfo}>自动续订，随时取消</p>

      <button 
        className={styles.activateButton} 
        onClick={handleActivate}
        disabled={loading}
      >
        {loading ? t('createPaymentOrderFailed') : t('activateNow')}
      </button>
    </div>
  );
} 