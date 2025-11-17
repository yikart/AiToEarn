'use client'

import { CrownOutlined, DollarOutlined, GiftOutlined, HistoryOutlined, RocketOutlined, StarOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPaymentOrderApi, PaymentType } from '@/api/vip'
import { useTransClient } from '@/app/i18n/client'
import { useUserStore } from '@/store/user'
import styles from './vip.module.css'

export default function VipPage() {
  const router = useRouter()
  const { userInfo, lang } = useUserStore()
  const { t } = useTransClient('vip')
  const [selectedPlan, setSelectedPlan] = useState('month') // 默认选择连续月费会员
  const [loading, setLoading] = useState(false)
  const [canUseTrial, setCanUseTrial] = useState(false) // 是否可以使用免费试用

  // 检查用户是否可以享受免费试用
  useEffect(() => {
    if (userInfo) {
      // 如果用户没有vipInfo，说明从未开过会员，可以享受免费试用
      const hasVipInfo = userInfo.vipInfo && Object.keys(userInfo.vipInfo).length > 0
      setCanUseTrial(!hasVipInfo)
    }
  }, [userInfo])

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
  ]

  const handleActivate = async () => {
    try {
      setLoading(true)

      // 检查用户是否已登录
      if (!userInfo?.id) {
        message.error(t('pleaseLoginFirst'))
        router.push('/login')
        return
      }

      // 根据选择的计划映射到支付类型
      let paymentType
      let paymentMethod
      let flagTrialPeriodDays = 0 // 默认不给免费试用

      switch (selectedPlan) {
        case 'onceMonth':
          paymentType = PaymentType.ONCE_MONTH
          paymentMethod = 'payment'
          break
        case 'month':
          paymentType = PaymentType.MONTH
          paymentMethod = 'subscription'
          // 如果是订阅模式且用户从未开过会员，给免费试用
          flagTrialPeriodDays = canUseTrial ? 1 : 0
          break
        case 'year':
          paymentType = PaymentType.YEAR
          paymentMethod = 'subscription'
          // 如果是订阅模式且用户从未开过会员，给免费试用
          flagTrialPeriodDays = canUseTrial ? 1 : 0
          break
        default:
          paymentType = PaymentType.MONTH
          paymentMethod = 'subscription'
          flagTrialPeriodDays = canUseTrial ? 1 : 0
      }

      // 创建支付订单
      const response: any = await createPaymentOrderApi({
        returnTo: lang === 'zh-CN' ? 'https://aitoearn.ai/zh-CN/profile' : 'https://aitoearn.ai/en/profile',
        mode: paymentMethod,
        payment: paymentType,
        metadata: {
          userId: userInfo.id,
        },
      })

      if (response?.code === 0) {
        message.success(t('paymentOrderCreated'))
        // 直接跳转到支付页面
        if (response.data?.url) {
          // window.location.href = response.data.url;
          window.open(response.data.url, '_blank')
        }
        else {
          message.error(t('paymentLinkNotFound'))
        }
      }
      else {
        message.error(response?.message || response?.msg || t('createPaymentOrderFailed'))
      }
    }
    catch (error) {
      console.error('创建支付订单失败:', error)
      message.error(t('createPaymentOrderError'))
    }
    finally {
      setLoading(false)
    }
  }

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

      <h3 className={styles.title}>{t('selectDuration')}</h3>

      {/* 免费试用提示 */}
      {canUseTrial && (
        <div className={styles.trialNotice}>
          <span className={styles.trialBadge}>{t('trialNotice.badge')}</span>
          <p>{t('trialNotice.description')}</p>
        </div>
      )}

      <div className={styles.priceOptions}>

        <div
          className={`${styles.priceCard} ${selectedPlan === 'month' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('month')}
        >
          <span className={styles.badge}>
            {canUseTrial ? t('badge.month') : t('badge.monthOld')}
          </span>
          <h4>{t('planTitles.month')}</h4>
          <div>
            <span className={styles.originalPrice}>$30</span>
            <span className={styles.discount}>
              {canUseTrial ? t('badge.month') : t('badge.monthOld')}
            </span>
          </div>
          <p className={styles.currentPrice}>
            $
            <span>19</span>
            {t('priceUnits.month')}
          </p>
          {canUseTrial && (
            <p className={styles.trialText}>{t('trialText.month')}</p>
          )}
        </div>
        <div
          className={`${styles.priceCard} ${selectedPlan === 'year' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('year')}
        >
          <span className={styles.badge}>
            {canUseTrial ? t('badge.year') : t('badge.yearOld')}
          </span>
          <h4>{t('planTitles.year')}</h4>
          <div>
            <span className={styles.originalPrice}>$180</span>
            <span className={styles.discount}>
              {canUseTrial ? t('badge.year') : t('badge.yearOld')}
            </span>
          </div>
          <p className={styles.currentPrice}>
            $
            <span>12</span>
            {t('priceUnits.month')}
          </p>
          <p className={styles.monthlyPrice}>
            $144
            {t('priceUnits.year')}
          </p>
          {canUseTrial && (
            <p className={styles.trialText}>{t('trialText.year')}</p>
          )}
        </div>
        <div
          className={`${styles.priceCard} ${selectedPlan === 'onceMonth' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('onceMonth')}
        >
          <span className={styles.badge}>{t('badge.onceMonth')}</span>
          <h4>{t('planTitles.onceMonth')}</h4>
          <div>
            <span className={styles.originalPrice}>$30</span>
            <span className={styles.discount}>{t('badge.onceMonth')}</span>
          </div>
          <p className={styles.currentPrice}>
            $
            <span>25</span>
          </p>
        </div>
      </div>

      <p className={styles.subscriptionInfo}>{t('autoRenewal')}</p>

      <button
        className={styles.activateButton}
        onClick={handleActivate}
        disabled={loading}
      >
        {t('activateNow')}
      </button>
    </div>
  )
}
