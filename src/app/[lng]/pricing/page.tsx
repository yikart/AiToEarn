"use client";

import { useState } from "react";
import { useTransClient } from "@/app/i18n/client";
import styles from "./pricing.module.scss";
import { Button } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

export default function PricingPage() {
  const { t } = useTransClient('pricing');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plans = [
    {
      name: 'Free',
      price: 0,
      originalPrice: 0,
      credits: '最高60 积分',
      videos: '每月最高可生成60个视频',
      images: '每月最高可生成120张图片',
      features: [
        { text: '文本内容安全审查', included: false },
        { text: '图片内容安全审查', included: false },
        { text: '视频内容安全审查', included: false },
        { text: '多模型一站式支持', included: true },
        { text: '文字转视频', included: true },
        { text: '图像转视频', included: true },
        { text: '视频到视频', included: true },
        { text: '一致的角色视频', included: true },
        { text: 'AI动画生成', included: true },
        { text: 'AI图像生成', included: true },
        { text: '声音克隆', included: true },
        { text: '声音合成', included: true },
        { text: '更快的生成速度', included: false },
        { text: '含水印输出', included: true },
        { text: '存储空间500M', included: true },
      ],
      buttonText: '立即开始',
      buttonType: 'default' as const,
      popular: false,
    },
    {
      name: 'Plus',
      price: billingCycle === 'yearly' ? 14.5 : 29,
      originalPrice: billingCycle === 'yearly' ? 29 : 29,
      credits: '700积分',
      videos: '每月最高可生成700个视频',
      images: '每月最高可生成1400张图片',
      features: [
        { text: '文本内容安全审查', included: true },
        { text: '图片内容安全审查', included: true },
        { text: '视频内容安全审查', included: true },
        { text: '多模型一站式支持', included: true },
        { text: '文字转视频', included: true },
        { text: '图像转视频', included: true },
        { text: '视频到视频', included: true },
        { text: '一致的角色视频', included: true },
        { text: 'AI动画生成', included: true },
        { text: 'AI图像生成', included: true },
        { text: '声音克隆', included: true },
        { text: '声音合成', included: true },
        { text: '更快的生成速度', included: true },
        { text: '无水印输出', included: true },
        { text: '存储空间5G', included: true },
      ],
      buttonText: '立即购买',
      buttonType: 'primary' as const,
      popular: true,
    },
  ];

  return (
    <div className={styles.pricingPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        {/* Billing Toggle */}
        <div className={styles.billingToggle}>
          <div className={styles.toggleContainer}>
            <button
              className={`${styles.toggleButton} ${billingCycle === 'monthly' ? styles.active : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              {t('monthly')}
            </button>
            <button
              className={`${styles.toggleButton} ${billingCycle === 'yearly' ? styles.active : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              {t('yearly')}
              {billingCycle === 'yearly' && (
                <span className={styles.saveBadge}>{t('save50')}</span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={styles.pricingCards}>
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>
                  {billingCycle === 'yearly' ? t('flashSale50') : t('mostPopular')}
                </div>
              )}
              
              <div className={styles.cardHeader}>
                <h2 className={styles.planName}>{plan.name}</h2>
                <div className={styles.priceContainer}>
                  {plan.originalPrice > plan.price && (
                    <span className={styles.originalPrice}>
                      ${plan.originalPrice} USD
                    </span>
                  )}
                  <div className={styles.price}>
                    ${plan.price} USD
                    <span className={styles.period}>/{t('month')}</span>
                  </div>
                </div>
              </div>

              <div className={styles.planFeatures}>
                <div className={styles.mainFeatures}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>{t('credits')}</span>
                    <span className={styles.featureValue}>{plan.credits}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>{t('videos')}</span>
                    <span className={styles.featureValue}>{plan.videos}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>{t('images')}</span>
                    <span className={styles.featureValue}>{plan.images}</span>
                  </div>
                </div>

                <div className={styles.featuresList}>
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className={styles.featureRow}>
                      {feature.included ? (
                        <CheckOutlined className={styles.checkIcon} />
                      ) : (
                        <CloseOutlined className={styles.closeIcon} />
                      )}
                      <span className={`${styles.featureText} ${!feature.included ? styles.disabled : ''}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type={plan.buttonType}
                size="large"
                className={styles.ctaButton}
                onClick={() => {
                  if (plan.name === 'Free') {
                    // 跳转到注册页面
                    window.location.href = '/vip';
                  } else {
                    // 跳转到支付页面
                    window.location.href = '/vip';
                  }
                }}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        {/* <div className={styles.faqSection}>
          <h2 className={styles.faqTitle}>{t('faq.title')}</h2>
          <div className={styles.faqList}>
            {t('faq.items', { returnObjects: true }).map((faq: any, index: number) => (
              <div key={index} className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>{faq.question}</h3>
                <p className={styles.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
