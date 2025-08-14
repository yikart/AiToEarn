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
      price: billingCycle === 'yearly' ? 14.5 : 29,
      originalPrice: billingCycle === 'yearly' ? 29 : 29,
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
                  if (plan.name === t('plans.free.name')) {
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
