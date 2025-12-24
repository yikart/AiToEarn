/**
 * PricingContent - 定价页面内容组件
 * 包含定价卡片、方案选择和购买按钮
 */

'use client'

import { Check, Star, Crown, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { memo, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import { createPaymentOrderApi, PaymentType } from '@/api/vip'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import { openLoginModal } from '@/store/loginModal'

interface PricingContentProps {
  lng: string
}

// 方案配置
const PLANS: Array<{
  id: string
  highlight: boolean
  isCustom?: boolean
  isFree?: boolean
}> = [
  {
    id: 'free',
    highlight: false,
    isFree: true, // 免费方案
  },
  {
    id: 'creator',
    highlight: true, // 创作者方案设为推荐
  },
  // {
  //   id: 'enterprise',
  //   highlight: false,
  //   isCustom: true, // 定制价格
  // },
]

export const PricingContent = memo(({ lng }: PricingContentProps) => {
  const { t } = useTransClient('vip')
  const userStore = useUserStore()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const openSettings = useSettingsModalStore(state => state.openSettings)

  // 状态判断辅助函数
  const getVipStatusInfo = (status: string) => {
    switch (status) {
      case 'none':
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
      case 'trialing':
        return { isVip: true, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
      case 'monthly_once':
        return { isVip: true, isMonthly: true, isYearly: false, isAutoRenew: false, isOnce: true }
      case 'yearly_once':
        return { isVip: true, isMonthly: false, isYearly: true, isAutoRenew: false, isOnce: true }
      case 'active_monthly':
        return { isVip: true, isMonthly: true, isYearly: false, isAutoRenew: true, isOnce: false }
      case 'active_yearly':
        return { isVip: true, isMonthly: false, isYearly: true, isAutoRenew: true, isOnce: false }
      case 'active_nonrenewing':
        return { isVip: true, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
      case 'expired':
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
      default:
        return { isVip: false, isMonthly: false, isYearly: false, isAutoRenew: false, isOnce: false }
    }
  }

  // 判断用户是否为有效会员
  const isVip = useMemo(() => {
    const vipInfo = userStore.userInfo?.vipInfo
    if (!vipInfo) return false

    const statusInfo = getVipStatusInfo(vipInfo.status)
    return statusInfo.isVip && vipInfo.expireTime && new Date(vipInfo.expireTime) > new Date()
  }, [userStore.userInfo])

  // 判断用户是否已经是相同类型的会员且未过期
  const isCurrentPlan = useMemo(() => {
    if (!userStore.userInfo?.vipInfo || !isVip) {
      return {
        creator: false,
      }
    }

    const vipInfo = userStore.userInfo.vipInfo
    const statusInfo = getVipStatusInfo(vipInfo.status)
    // 创作者对应月度订阅
    return {
      creator: statusInfo.isMonthly && statusInfo.isAutoRenew, // 连续包月
    }
  }, [userStore.userInfo, isVip])

  // 根据用户状态过滤方案列表（如果是会员，隐藏免费计划）
  const visiblePlans = useMemo(() => {
    if (isVip) {
      // 如果是会员，隐藏免费计划
      return PLANS.filter(plan => plan.id !== 'free')
    }
    return PLANS
  }, [isVip])

  /**
   * 处理方案选择
   */
  const handleSelectPlan = async (planId: string) => {
    // 免费方案不处理
    if (planId === 'free') {
      return
    }

    // 检查用户是否已登录
    if (!userStore.userInfo?.id) {
      toast.error(t('pleaseLoginFirst'))
      openLoginModal()
      return
    }

    // 企业版直接发送邮件
    if (planId === 'enterprise') {
      window.open(`mailto:${ENTERPRISE_EMAIL}?subject=Enterprise Plan Inquiry`, '_blank')
      return
    }

    // 检查用户是否已经是相同类型的会员且未过期
    if (planId === 'creator' && isCurrentPlan.creator) {
      toast.warning(t('currentPlan'))
      return
    }

    setLoadingPlan(planId)
    try {
      // 根据选择的计划映射到支付类型
      let paymentType: PaymentType
      let paymentMethod: string

      if (planId === 'creator') {
        paymentType = PaymentType.MONTH // 创作者对应月度订阅
        paymentMethod = 'subscription'
      } else {
        paymentType = PaymentType.MONTH
        paymentMethod = 'subscription'
      }

      // 创建支付订单
      const returnTo = userStore.lang === 'zh-CN' 
        ? `${window.location.origin}/zh-CN/pricing` 
        : `${window.location.origin}/en/pricing`
      
      const response: any = await createPaymentOrderApi({
        returnTo,
        mode: paymentMethod,
        payment: paymentType,
        metadata: {
          userId: userStore.userInfo.id,
        },
      })

      if (response?.code === 0) {
        toast.success(t('paymentOrderCreated'))
        // 直接跳转到支付页面
        if (response.data?.url) {
          window.location.href = response.data.url
        } else {
          toast.error(t('paymentLinkNotFound'))
        }
      } else {
        toast.error(response?.message || response?.msg || t('createPaymentOrderFailed'))
      }
    } catch (error) {
      console.error('创建支付订单失败:', error)
      toast.error(t('createPaymentOrderError'))
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <>
      {/* 动画样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}} />
      <div className="min-h-screen bg-(--bg-gray) flex items-center justify-center py-16 px-4 md:px-8">
        <div className="max-w-7xl w-full">
        {/* 页面标题 */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {t('pricing.pageTitle')}
            </h1>
          </div>
        </header>

        {/* 定价卡片网格 */}
        <div className={cn(
          "grid gap-6 max-w-6xl mx-auto",
          visiblePlans.length === 1 ? "grid-cols-1 max-w-md" : visiblePlans.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
        )}>
          {visiblePlans.map((plan) => (
            <PricingCard
              key={plan.id}
              planId={plan.id}
              isHighlight={plan.highlight}
              isCustom={plan.isCustom}
              isFree={plan.isFree}
              isCurrent={plan.id === 'creator' && isCurrentPlan.creator}
              isVip={!!isVip}
              isLoading={loadingPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
              onOpenSubscriptionManagement={() => openSettings('membership')}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  )
})

PricingContent.displayName = 'PricingContent'

/**
 * 定价卡片组件
 */
interface PricingCardProps {
  planId: string
  isHighlight?: boolean
  isCustom?: boolean
  isFree?: boolean
  isCurrent?: boolean
  isVip?: boolean
  isLoading?: boolean
  onSelect: () => void
  onOpenSubscriptionManagement?: () => void
  t: (key: string, options?: any) => string
}

const PricingCard = memo(({
  planId,
  isHighlight,
  isCustom,
  isFree,
  isCurrent,
  isVip,
  isLoading,
  onSelect,
  onOpenSubscriptionManagement,
  t,
}: PricingCardProps) => {
  // 获取方案的翻译
  const planName = t(`pricing.plans.${planId}.name`)
  const planPrice = t(`pricing.plans.${planId}.price`)
  // 如果是当前计划，按钮文本显示为"订阅管理"
  const buttonText = isCurrent ? t('subscriptionManagement') : t(`pricing.plans.${planId}.button`)
  
  // 获取功能列表
  const featuresKey = `pricing.plans.${planId}.features`
  const features: string[] = []
  
  // 尝试获取功能列表（数组）
  for (let i = 0; i < 10; i++) {
    const feature = t(`${featuresKey}.${i}`, { defaultValue: '' })
    if (feature && feature !== `${featuresKey}.${i}`) {
      features.push(feature)
    }
  }

  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl p-6 flex flex-col transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        // 已开通会员：使用更明显的边框，但保持简约风格
        isCurrent && isVip
          ? 'border-2 border-(--border-color) bg-(--bg-gray)'
          : 'border border-border',
        // 推荐方案：使用柔和的边框
        isHighlight && !isCurrent && 'ring-1 ring-(--primary-color)/20'
      )}
    >
      {/* 最受欢迎标签 / 尊敬的创作者 */}
      {isHighlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className={cn(
            "relative text-xs font-medium px-4 py-1.5 rounded-full whitespace-nowrap inline-flex items-center gap-1.5",
            // 已开通会员：使用简约黑色风格，与按钮保持一致
            isCurrent && isVip
              ? "bg-(--grayColor13) text-white"
              : "bg-(--primary-color) text-white shadow-lg"
          )}>
            {/* 左侧星星 - 仅未开通会员时显示 */}
            {!isCurrent && (
              <Star 
                className="w-3 h-3 fill-yellow-300 text-yellow-300" 
                style={{ 
                  animation: 'twinkle 1.5s ease-in-out infinite',
                  animationDelay: '0s'
                }} 
              />
            )}
            {/* 文字 */}
            <span>
              {isCurrent && isVip ? t('pricing.respectedCreator') : t('pricing.mostPopular')}
            </span>
            {/* 右侧星星 - 仅未开通会员时显示 */}
            {!isCurrent && (
              <Star 
                className="w-3 h-3 fill-yellow-300 text-yellow-300" 
                style={{ 
                  animation: 'twinkle 1.5s ease-in-out infinite',
                  animationDelay: '0.75s'
                }} 
              />
            )}
          </span>
        </div>
      )}

      {/* 方案名称 */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-2">
        {planName}
      </h3>

      {/* 价格 */}
      <div className="mb-6 h-14 flex items-center">
        {isCustom ? (
          <div className="text-4xl font-bold text-foreground tracking-tight">
            {t('pricing.customPrice')}
          </div>
        ) : isFree ? (
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold text-(--text-color) tracking-tight">
              ${planPrice}
            </span>
            <span className="text-lg text-(--text-secondary)">
              {t('pricing.perMonth')}
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-lg text-muted-foreground">$</span>
            <span className="text-5xl font-bold text-foreground tracking-tight">
              {planPrice}
            </span>
            <span className="text-lg text-muted-foreground">
              {t('pricing.perMonth')}
            </span>
          </div>
        )}
      </div>

      {/* 购买按钮 */}
      {isFree ? (
        <Button
          disabled
          className="w-full h-12 text-base font-medium rounded-xl mb-6 transition-all duration-200 bg-(--bg-secondary) text-(--text-secondary) cursor-not-allowed border border-(--border-color)"
        >
          {buttonText}
        </Button>
      ) : isCurrent ? (
        <Button
          onClick={onOpenSubscriptionManagement}
          className={cn(
            "w-full h-12 text-base font-medium rounded-xl mb-6 transition-all duration-200",
            "bg-(--grayColor13) hover:bg-(--grayColor12) text-white",
            "border border-(--border-color)"
          )}
        >
          {buttonText}
        </Button>
      ) : isCustom ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onSelect}
                disabled={isLoading}
                className={cn(
                  'w-full h-12 text-base font-medium rounded-xl mb-6 transition-all duration-200',
                )}
              >
                {buttonText}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{ENTERPRISE_EMAIL}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button
          onClick={onSelect}
          disabled={isLoading}
          className={cn(
            'w-full h-12 text-base font-medium rounded-xl mb-6 transition-all duration-200',
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            buttonText
          )}
        </Button>
      )}

      {/* 功能列表 */}
      <ul className="space-y-3 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
            <span className="text-sm text-foreground leading-relaxed">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
})

PricingCard.displayName = 'PricingCard'

/**
 * 定价卡片骨架屏
 */
export const PricingCardSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl p-6 flex flex-col border border-border">
      <Skeleton className="h-7 w-24 mb-4 mt-2" />
      <Skeleton className="h-14 w-32 mb-6" />
      <Skeleton className="h-12 w-full mb-6" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}


