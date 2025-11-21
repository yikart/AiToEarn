'use client'

import { CheckOutlined } from '@ant-design/icons'
import { Button, Collapse } from 'antd'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import pricingStyles from '../styles/pricing.module.scss'

/**
 * 定价页面组件
 */
export default function PricingPage() {
  const { t } = useTransClient('pricing')
  const { t: tVip } = useTransClient('vip')

  // 直接使用 aaa.md 中的完整数据
  const fallbackPricingData = [
    {
      model: 'gpt-5',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '大模型价格以官方价格为准',
      credits: '每百万tokens',
      price: '输入 9元，输出 72',
      channel: 'yun',
    },
    {
      model: 'gpt-5-mini',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '',
      credits: '',
      price: '输入 1.8元，输出 14.4',
      channel: 'yun',
    },
    {
      model: 'gpt-5-nano',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '',
      credits: '',
      price: '输入 0.36元，输出 2.88',
      channel: 'yun',
    },
    {
      model: 'gemini-2.5-pro',
      type: '大模型',
      duration: '',
      resolution: '支持视频',
      notes: '',
      credits: '',
      price: '输入9元，输出 72',
      channel: 'yun',
    },
    {
      model: 'chatgpt-4o-latest',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '',
      credits: '',
      price: '输入 36元，输出 108',
      channel: 'yun',
    },
    {
      model: 'gemini-2.5-flash',
      type: '大模型',
      duration: '',
      resolution: '支持视频',
      notes: '',
      credits: '',
      price: '输入 2.16元，输出 18',
      channel: 'yun',
    },
    {
      model: 'qwen-vl-max-latest',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '',
      credits: '',
      price: '输入1.6元，输出4',
      channel: 'yun',
    },
    {
      model: 'kimi-k2-0711-preview',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '不支持图片',
      credits: '',
      price: '',
      channel: '暂不接入',
    },
    {
      model: 'grok-4',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '不支持图片',
      credits: '',
      price: '',
      channel: '暂不接入',
    },
    {
      model: 'claude-opus-4-1-20250805-thinking',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '不支持图片，不支持图片的不着急支持',
      credits: '',
      price: '',
      channel: '暂不接入 ',
    },
    {
      model: 'qwen3-235b-a22b-07-25',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '不支持图片',
      credits: '',
      price: '',
      channel: '暂不接入',
    },
    {
      model: 'deepseek-r1-0528',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '不支持图片',
      credits: '',
      price: '',
      channel: '暂不接入',
    },
    {
      model: 'claude-sonnet-4-20250514-thinking',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '不支持图片',
      credits: '',
      price: '',
      channel: '暂不接入',
    },
    {
      model: 'deepseek-v3-0324',
      type: '大模型',
      duration: '',
      resolution: '',
      notes: '不支持图片',
      credits: '',
      price: '',
      channel: '暂不接入',
    },
    {
      model: 'gemini-2.5-flash-image',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '又名Nano Banana Pro，支持多图像输入',
      credits: '1',
      price: '0.27',
      channel: 'yun',
    },
    {
      model: 'seedream-3.0',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '',
      credits: '2.6',
      price: '0.26',
      channel: '官方',
    },
    {
      model: 'seededit-3.0',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '图片编辑，传入图片需要满足以下条件：图片格式：jpeg、png。宽高比（宽/高）：在范围 (1/3, 3) 。宽高长度（px） > 14。大小：不超过 10MB。',
      credits: '3',
      price: '0.3',
      channel: '官方',
    },
    {
      model: 'gpt-image-1',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '支持图片编辑',
      credits: '1',
      price: 'low $0.011-0.016, medium $0.042-0.063, high $0.167-0.25',
      channel: 'yun',
    },
    {
      model: 'FLUX.1 Kontext [max]',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '支持图片编辑',
      credits: '1.5',
      price: '0.6',
      channel: 'yun',
    },
    {
      model: 'FLUX.1 Kontext [pro]',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '支持图片编辑',
      credits: '1',
      price: '0.3',
      channel: 'yun',
    },
    {
      model: 'FLUX.1[dev]',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '',
      credits: '先不上',
      price: '0.2',
      channel: '',
    },
    {
      model: 'Flux 1.1 pro ultra',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '',
      credits: '4.5',
      price: '0.45',
      channel: '官方',
    },
    {
      model: 'Flux1.1 pro',
      type: '图片生成',
      duration: '',
      resolution: '',
      notes: '',
      credits: '3',
      price: '0.3',
      channel: '官方',
    },
    {
      model: 'midjourney relax',
      type: '视频生成',
      duration: '5秒',
      resolution: '',
      notes: '',
      credits: '免费',
      price: '',
      channel: 'yun',
    },
    {
      model: 'midjourney fast/turbo',
      type: '视频生成',
      duration: '5秒',
      resolution: '',
      notes: '',
      credits: '4',
      price: '',
      channel: 'yun',
    },
    {
      model: 'kling1.5/1.6/2.1',
      type: '视频生成',
      duration: '5秒',
      resolution: '720p',
      notes: '',
      credits: '20',
      price: '2',
      channel: 'yun',
    },
    {
      model: 'kling1.5/1.6/2.1',
      type: '视频生成',
      duration: '10秒',
      resolution: '720p',
      notes: '',
      credits: '40',
      price: '4',
      channel: 'yun',
    },
    {
      model: 'kling1.5/1.6/2.1',
      type: '视频生成',
      duration: '5秒',
      resolution: '1080p',
      notes: '',
      credits: '35',
      price: '3.5',
      channel: 'yun',
    },
    {
      model: 'kling1.5/1.6/2.1',
      type: '视频生成',
      duration: '10秒',
      resolution: '1080p',
      notes: '',
      credits: '70',
      price: '7',
      channel: 'yun',
    },
    {
      model: 'kling1.6多图参考',
      type: '视频生成',
      duration: '5秒',
      resolution: '720p',
      notes: '',
      credits: '20',
      price: '2',
      channel: 'yun',
    },
    {
      model: 'kling1.6多图参考',
      type: '视频生成',
      duration: '10秒',
      resolution: '720p',
      notes: '',
      credits: '40',
      price: '4',
      channel: 'yun',
    },
    {
      model: 'kling1.6多图参考',
      type: '视频生成',
      duration: '5秒',
      resolution: '1080p',
      notes: '',
      credits: '35',
      price: '3.5',
      channel: 'yun',
    },
    {
      model: 'kling1.6多图参考',
      type: '视频生成',
      duration: '10秒',
      resolution: '1080p',
      notes: '',
      credits: '70',
      price: '7',
      channel: 'yun',
    },
    {
      model: 'kling2.1大师',
      type: '视频生成',
      duration: '5秒',
      resolution: '1080p',
      notes: '',
      credits: '100',
      price: '10',
      channel: 'yun',
    },
    {
      model: 'kling2.1大师',
      type: '视频生成',
      duration: '10秒',
      resolution: '1080p',
      notes: '',
      credits: '200',
      price: '20',
      channel: 'yun',
    },
    {
      model: 'wan2.2-plus',
      type: '视频生成',
      duration: '5秒',
      resolution: '480p',
      notes: '',
      credits: '70',
      price: '0.7',
      channel: 'yun',
    },
    {
      model: 'wan2.2-plus',
      type: '视频生成',
      duration: '5秒',
      resolution: '1080p',
      notes: '',
      credits: '35',
      price: '3.5',
      channel: 'yun',
    },
    {
      model: 'wan2.1-turbo(14b）',
      type: '视频生成',
      duration: '5秒',
      resolution: '720p',
      notes: '不要使用火山渠道',
      credits: '12',
      price: '1.2',
      channel: 'yun',
    },
    {
      model: 'wan2.1-plus',
      type: '视频生成',
      duration: '5秒',
      resolution: '720p',
      notes: '支持首尾帧',
      credits: '35',
      price: '3.5',
      channel: 'yun',
    },
    {
      model: 'wanx2.1-vace-plus',
      type: '视频生成',
      duration: '5秒',
      resolution: '720p',
      notes: '视频编辑',
      credits: '35',
      price: '3.5',
      channel: 'yun',
    },
    {
      model: 'seedance-1.0-pro',
      type: '视频生成',
      duration: '5秒',
      resolution: '480p',
      notes: '支持10秒',
      credits: '7.2',
      price: '0.72',
      channel: 'yun',
    },
    {
      model: 'seedance-1.0-pro',
      type: '视频生成',
      duration: '5秒',
      resolution: '720p',
      notes: '10秒价格翻倍就行',
      credits: '16.4',
      price: '1.64',
      channel: 'yun',
    },
    {
      model: 'seedance-1.0-pro',
      type: '视频生成',
      duration: '5秒',
      resolution: '1080p',
      notes: '',
      credits: '36.7',
      price: '3.67',
      channel: 'yun',
    },
    {
      model: 'seedance-1.0-lite',
      type: '视频生成',
      duration: '5秒',
      resolution: '480p',
      notes: '支持首尾帧',
      credits: '5',
      price: '0.5',
      channel: 'yun',
    },
    {
      model: 'seedance-1.0-lite',
      type: '视频生成',
      duration: '5秒',
      resolution: '720p',
      notes: '支持10秒',
      credits: '11',
      price: '1.1',
      channel: 'yun',
    },
    {
      model: 'seedance-1.0-lite',
      type: '视频生成',
      duration: '5秒',
      resolution: '1080p',
      notes: '10秒价格翻倍',
      credits: '25',
      price: '2.5',
      channel: 'yun',
    },
  ]

  // 尝试从 i18n 获取数据，如果失败则使用备选数据
  const getPricingData = () => {
    try {
      const rows = t('faq.creditDeduction.pricingTable.rows' as any)
      if (Array.isArray(rows) && rows.length > 0) {
        return rows
      }
    }
    catch (error) {
      console.error('Error loading pricing data from i18n:', error)
    }
    return fallbackPricingData
  }

  const plans = [
    {
      name: tVip('modal.free.title' as any),
      price: tVip('modal.free.price' as any),
      period: tVip('modal.free.period' as any),
      subtitle: tVip('modal.free.forever' as any),
      credits: tVip('modal.free.points' as any),
      features: [
        tVip('modal.free.features.dailyPoints' as any),
        tVip('modal.free.features.maxPoints' as any),
        tVip('modal.free.features.videos' as any),
        tVip('modal.free.features.images' as any),
      ],
      buttonText: tVip('modal.free.currentPlan' as any),
      buttonType: 'default' as const,
      popular: false,
      disabled: true,
    },
    {
      name: tVip('modal.plans.monthly.title' as any),
      price: `$${tVip('modal.plans.monthly.price' as any)}`,
      period: tVip('modal.plans.monthly.period' as any),
      originalPrice: tVip('modal.plans.monthly.originalPrice' as any),
      subtitle: tVip('modal.plans.monthly.button' as any),
      credits: tVip('modal.plans.monthly.points' as any),
      benefitBox: tVip('modal.plans.yearly.features.dailyPoints' as any),
      features: [
        // tVip('modal.plans.monthly.description' as any),
        tVip('modal.plans.yearly.features.contentReview' as any),
        tVip('modal.plans.yearly.features.dailyPoints' as any),
        tVip('modal.plans.yearly.features.multiModel' as any),
        tVip('modal.plans.yearly.features.textToVideo' as any),
        // tVip('modal.plans.yearly.features.aiGeneration' as any),
        // tVip('modal.plans.yearly.features.noWatermark' as any),
      ],
      buttonText: tVip('modal.plans.goumai' as any),
      buttonType: 'primary' as const,
      popular: true,
      disabled: false,
    },
  ]

  const faqItems = [
    {
      question: t('faq.paymentMethods.question'),
      answer: t('faq.paymentMethods.answer'),
    },
    {
      question: t('faq.creditDeduction.question'),
      answer: t('faq.creditDeduction.answer'),
    },
    {
      question: t('faq.creditExpiry.question'),
      answer: t('faq.creditExpiry.answer'),
    },
    {
      question: t('faq.moreCredits.question'),
      answer: t('faq.moreCredits.answer'),
    },
    {
      question: t('faq.checkCredits.question'),
      answer: t('faq.checkCredits.answer'),
    },
    {
      question: t('faq.hiddenFees.question'),
      answer: t('faq.hiddenFees.answer'),
    },
    {
      question: t('faq.refundPolicy.question'),
      answer: t('faq.refundPolicy.answer'),
    },
  ]

  return (
    <div className={pricingStyles.pricingPage}>
      <div className={pricingStyles.container}>

        {/* Header */}
        <div className={pricingStyles.header}>
          <h1 className={pricingStyles.title}>{t('title')}</h1>
          <p className={pricingStyles.subtitle}>{t('subtitle')}</p>
        </div>

        {/* Pricing Cards */}
        <div className={pricingStyles.pricingCards}>
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`${pricingStyles.pricingCard} ${plan.popular ? pricingStyles.popular : ''}`}
            >
              {/* {plan.popular && (
                <div className={pricingStyles.popularBadge}>
                  {tVip('modal.savings.monthly' as any)}
                </div>
              )} */}

              <div className={pricingStyles.cardHeader}>
                <h2 className={pricingStyles.planName}>{plan.name}</h2>
                <div className={pricingStyles.priceContainer}>
                  <div className={pricingStyles.price}>
                    <span className={pricingStyles.priceText}>{plan.price}</span>
                    <span className={pricingStyles.period}>{plan.period}</span>
                  </div>
                  {/* {plan.subtitle && (
                    <div className={pricingStyles.subtitle}>
                      {plan.subtitle}
                    </div>
                  )} */}
                  {/* {plan.originalPrice && (
                    <div className={pricingStyles.originalPrice}>
                      {plan.originalPrice}
                    </div>
                  )} */}
                </div>
              </div>

              <Button
                type={plan.buttonType}
                size="large"
                disabled={plan.disabled}
                className={pricingStyles.ctaButton}
                onClick={() => {
                  if (!plan.disabled) {
                    window.location.href = '/accounts?showVip=true'
                  }
                }}
              >
                {plan.buttonText}
              </Button>

              {plan.benefitBox && (
                <div className={pricingStyles.benefitBox}>
                  <span className={pricingStyles.dot}>•</span>
                  {' '}
                  {plan.benefitBox}
                </div>
              )}

              <div className={pricingStyles.planFeatures}>
                {/* {plan.credits && (
                  <div className={pricingStyles.creditsInfo}>
                    {plan.credits}
                  </div>
                )} */}

                <div className={pricingStyles.featuresList}>
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className={pricingStyles.featureRow}>
                      <CheckOutlined className={pricingStyles.checkIcon} />
                      <span className={pricingStyles.featureText}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className={pricingStyles.faqSection}>
          <h2 className={pricingStyles.faqTitle}>{t('faq.title')}</h2>
          <Collapse
            className={pricingStyles.faqCollapse}
            items={faqItems.map((faq, index) => ({
              key: index,
              label: faq.question,
              children: (
                <div>
                  <p>{faq.answer}</p>
                  {faq.question === t('faq.creditDeduction.question') && (
                    <div className={pricingStyles.pricingTableContainer}>
                      <h4>{t('faq.creditDeduction.pricingTable.title' as any)}</h4>
                      <div className={pricingStyles.pricingTableWrapper}>
                        <table className={pricingStyles.pricingTable}>
                          <thead>
                            <tr>
                              <th>{t('faq.creditDeduction.pricingTable.headers.model' as any)}</th>
                              <th>{t('faq.creditDeduction.pricingTable.headers.type' as any)}</th>
                              <th>{t('faq.creditDeduction.pricingTable.headers.duration' as any)}</th>
                              <th>{t('faq.creditDeduction.pricingTable.headers.resolution' as any)}</th>
                              <th>{t('faq.creditDeduction.pricingTable.headers.credits' as any)}</th>
                              <th>{t('faq.creditDeduction.pricingTable.headers.price' as any)}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getPricingData().map((row: any, rowIndex: number) => (
                              <tr key={rowIndex}>
                                <td>{row.model}</td>
                                <td>{row.type}</td>
                                <td>{row.duration}</td>
                                <td>{row.resolution}</td>
                                <td>{row.credits}</td>
                                <td>{row.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
