"use client";

import { memo, useMemo, useState } from "react";
import { Modal, Button } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import styles from "./outsideCloseModal.module.css";
import vipStyles from "./vipContentModal.module.css";
import pricingStyles from "@/app/[lng]/styles/pricing.module.scss";
import IncomePage from "@/app/[lng]/income/page";
import { useUserStore } from "@/store/user";
import { useTransClient } from "@/app/i18n/client";

interface VipContentModalProps {
  open: boolean;
  onClose: () => void;
}

const VipContentModal = memo(({ open, onClose }: VipContentModalProps) => {
  const { lang } = useUserStore();
  const { t } = useTransClient('pricing');
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const modalWidth = useMemo(() => 960, []);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plans = [
    {
      name: t('plans.free.name'),
      price: 0,
      originalPrice: 0,
      credits: t('plans.free.credits'),
      videos: t('plans.free.videos'),
      images: t('plans.free.images'),
      features: [
        { text: t('features.textModeration'), included: false },
        { text: t('features.imageModeration'), included: false },
        { text: t('features.videoModeration'), included: false },
        { text: t('features.multiModel'), included: true },
        { text: t('features.textToVideo'), included: true },
        { text: t('features.imageToVideo'), included: true },
        { text: t('features.videoToVideo'), included: true },
        { text: t('features.consistentCharacter'), included: true },
        { text: t('features.aiAnimation'), included: true },
        { text: t('features.aiImage'), included: true },
        { text: t('features.voiceClone'), included: true },
        { text: t('features.voiceSynthesis'), included: true },
        { text: t('features.fasterSpeed'), included: false },
        { text: t('features.withWatermark'), included: true },
        { text: t('features.storage500M'), included: true },
      ],
      buttonText: t('plans.free.button'),
      buttonType: 'default' as const,
      popular: false,
    },
    {
      name: t('plans.plus.name'),
      price: billingCycle === 'yearly' ? 12 : 19,
      originalPrice: billingCycle === 'yearly' ? 20 : 15,
      credits: t('plans.plus.credits'),
      videos: t('plans.plus.videos'),
      images: t('plans.plus.images'),
      features: [
        { text: t('features.textModeration'), included: true },
        { text: t('features.imageModeration'), included: true },
        { text: t('features.videoModeration'), included: true },
        { text: t('features.multiModel'), included: true },
        { text: t('features.textToVideo'), included: true },
        { text: t('features.imageToVideo'), included: true },
        { text: t('features.videoToVideo'), included: true },
        { text: t('features.consistentCharacter'), included: true },
        { text: t('features.aiAnimation'), included: true },
        { text: t('features.aiImage'), included: true },
        { text: t('features.voiceClone'), included: true },
        { text: t('features.voiceSynthesis'), included: true },
        { text: t('features.fasterSpeed'), included: true },
        { text: t('features.noWatermark'), included: true },
        { text: t('features.storage5G'), included: true },
      ],
      buttonText: t('plans.plus.button'),
      buttonType: 'primary' as const,
      popular: true,
    },
  ];

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={modalWidth}
      className={styles.outsideCloseModal}
      destroyOnClose
      centered
    >
      <div className={vipStyles.wrapper}>
        {/* 顶部头部（白底，标题含渐变高亮文字，右侧“积分详情”按钮） */}
        <div className={vipStyles.header}>
          <div className={vipStyles.titleBlock}>
            <h2 className={vipStyles.title}>
              1元试用7天会员 <span className={vipStyles.highlight}>立得200积分</span>
            </h2>
            <div className={vipStyles.links}>
              <span>选择合适你的套餐，或直接</span>
              <span className={vipStyles.linkButton}>购买积分</span>
              <span className={vipStyles.linkButton}>会员兑换</span>
            </div>
          </div>
          <div className={vipStyles.headerRight}>
            <Button className={vipStyles.pointsBtn} onClick={() => setPointsModalVisible(true)}>
              积分详情
            </Button>
          </div>
        </div>

        {/* 内容（白色背景） */}
        <div className={vipStyles.content}>
          {/* Billing Toggle */}
          <div className={pricingStyles.billingToggle}>
            <div className={pricingStyles.toggleContainer}>
              <button
                className={`${pricingStyles.toggleButton} ${billingCycle === 'monthly' ? pricingStyles.active : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                {t('monthly')}
                {billingCycle === 'monthly' && (
                  <span className={pricingStyles.saveBadge}>{t('save25')}</span>
                )}
              </button>
              <button
                className={`${pricingStyles.toggleButton} ${billingCycle === 'yearly' ? pricingStyles.active : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                {t('yearly')}
                {billingCycle === 'yearly' && (
                  <span className={pricingStyles.saveBadge}>{t('save50')}</span>
                )}
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className={pricingStyles.pricingCards}>
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`${pricingStyles.pricingCard} ${plan.popular ? pricingStyles.popular : ''}`}
              >
                {plan.popular && (
                  <div className={pricingStyles.popularBadge}>
                    {billingCycle === 'yearly' ? t('flashSale50') : t('mostPopular')}
                  </div>
                )}

                <div className={pricingStyles.cardHeader}>
                  <h2 className={pricingStyles.planName}>{plan.name}</h2>
                  <div className={pricingStyles.priceContainer}>
                    {plan.originalPrice > plan.price && (
                      <span className={pricingStyles.originalPrice}>
                        ${plan.originalPrice} USD
                      </span>
                    )}
                    <div className={pricingStyles.price}>
                      <span className={pricingStyles.currency}>$</span>
                      <span className={pricingStyles.amount}>{plan.price}</span>
                      <span className={pricingStyles.period}>/{t('month')}</span>
                    </div>
                    {billingCycle === 'yearly' && plan.price > 0 && (
                      <div className={pricingStyles.monthlyPrice}>
                        ${(plan.price * 12).toFixed(0)} USD/{t('yearly')}
                      </div>
                    )}
                  </div>
                </div>

                <div className={pricingStyles.planFeatures}>
                  <div className={pricingStyles.mainFeatures}>
                    <div className={pricingStyles.featureItem}>
                      <span className={pricingStyles.featureLabel}>{t('credits')}</span>
                      <span className={pricingStyles.featureValue}>{plan.credits}</span>
                    </div>
                    <div className={pricingStyles.featureItem}>
                      <span className={pricingStyles.featureLabel}>{t('videos')}</span>
                      <span className={pricingStyles.featureValue}>{plan.videos}</span>
                    </div>
                    <div className={pricingStyles.featureItem}>
                      <span className={pricingStyles.featureLabel}>{t('images')}</span>
                      <span className={pricingStyles.featureValue}>{plan.images}</span>
                    </div>
                  </div>

                  <div className={pricingStyles.featuresList}>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className={pricingStyles.featureRow}>
                        {feature.included ? (
                          <CheckOutlined className={pricingStyles.checkIcon} />
                        ) : (
                          <CloseOutlined className={pricingStyles.closeIcon} />
                        )}
                        <span className={`${pricingStyles.featureText} ${!feature.included ? pricingStyles.disabled : ''}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type={plan.buttonType}
                  size="large"
                  className={pricingStyles.ctaButton}
                  onClick={() => {
                    if (plan.name === t('plans.free.name')) {
                      window.location.href = '/vip';
                    } else {
                      window.location.href = '/vip';
                    }
                  }}
                >
                  {plan.buttonText}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 内联积分详情弹窗（不再引用独立组件） */}
      <Modal
        title={null}
        open={pointsModalVisible}
        onCancel={() => setPointsModalVisible(false)}
        footer={null}
        width={980}
        className={styles.outsideCloseModal}
        destroyOnClose
        centered
      >
        <IncomePage />
      </Modal>
    </Modal>
  );
});

export default VipContentModal;


