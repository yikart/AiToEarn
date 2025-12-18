/**
 * PricingContent - 定价页面内容组件
 * 包含定价卡片、方案选择和购买按钮
 */

'use client'

import { Check } from 'lucide-react'
import { memo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'

/** 企业版联系邮箱 */
const ENTERPRISE_EMAIL = 'agent@aiearn.ai'

interface PricingContentProps {
  lng: string
}

// 方案配置
const PLANS: Array<{
  id: string
  highlight: boolean
  isCustom?: boolean
}> = [
  {
    id: 'creator',
    highlight: false,
  },
  {
    id: 'enterprise',
    highlight: false,
    isCustom: true, // 定制价格
  },
]

export const PricingContent = memo(({ lng }: PricingContentProps) => {
  const { t } = useTransClient('vip')
  const { userInfo } = useUserStore()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  /**
   * 处理方案选择
   */
  const handleSelectPlan = async (planId: string) => {
    if (!userInfo) {
      toast.error(t('pleaseLoginFirst'))
      return
    }

    // 企业版直接发送邮件
    if (planId === 'enterprise') {
      window.open(`mailto:${ENTERPRISE_EMAIL}?subject=Enterprise Plan Inquiry`, '_blank')
      return
    }

    setLoadingPlan(planId)
    try {
      // TODO: 调用支付 API 创建订单
      toast.success(t('paymentOrderCreated'))
    } catch (error) {
      console.error('创建支付订单失败:', error)
      toast.error(t('createPaymentOrderError'))
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center py-16 px-4 md:px-8">
      <div className="max-w-7xl w-full">
        {/* 页面标题 */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            {t('pricing.pageTitle')}
          </h1>
        </header>

        {/* 定价卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              planId={plan.id}
              isHighlight={plan.highlight}
              isCustom={plan.isCustom}
              isLoading={loadingPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
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
  isLoading?: boolean
  onSelect: () => void
  t: (key: string, options?: any) => string
}

const PricingCard = memo(({
  planId,
  isHighlight,
  isCustom,
  isLoading,
  onSelect,
  t,
}: PricingCardProps) => {
  // 获取方案的翻译
  const planName = t(`pricing.plans.${planId}.name`)
  const planPrice = t(`pricing.plans.${planId}.price`)
  const buttonText = t(`pricing.plans.${planId}.button`)
  
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
        'border border-border hover:shadow-xl hover:-translate-y-1',
        isHighlight && 'ring-2 ring-purple-500 shadow-purple-100 dark:shadow-purple-900/20'
      )}
    >
      {/* 最受欢迎标签 */}
      {isHighlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-purple-500 text-white text-xs font-medium px-4 py-1.5 rounded-full whitespace-nowrap">
            {t('pricing.mostPopular')}
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
      {isCustom ? (
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

