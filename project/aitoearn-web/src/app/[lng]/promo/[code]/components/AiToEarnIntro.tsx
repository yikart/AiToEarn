/**
 * AiToEarnIntro - AiToEarn 平台介绍组件
 * 展示平台核心功能，参考 welcome 页面设计风格
 */

'use client'

import { MapPin, Sparkles, Target } from 'lucide-react'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Card } from '@/components/ui/card'

export const AiToEarnIntro = memo(() => {
  const { t } = useTransClient('promo')

  // 核心功能列表
  const features = [
    {
      icon: MapPin,
      title: t('intro.features.offlineMarketing'),
      desc: t('intro.features.offlineMarketingDesc'),
    },
    {
      icon: Target,
      title: t('intro.features.payForResults'),
      desc: t('intro.features.payForResultsDesc'),
    },
    {
      icon: Sparkles,
      title: t('intro.features.aiAssist'),
      desc: t('intro.features.aiAssistDesc'),
    },
  ]

  return (
    <Card className="relative overflow-hidden border-border/50 p-0">
      {/* 装饰光晕 */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#c565ef]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#55D9ED]/5 blur-3xl" />

      {/* 头部区域 */}
      <div className="relative p-6">
        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c565ef]/10 bg-gradient-to-r from-[#c565ef]/5 to-[#55D9ED]/5 px-3 py-1.5 backdrop-blur-sm">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#c565ef] to-[#55D9ED]">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="text-sm font-medium text-foreground/80">AiToEarn</span>
        </div>

        {/* 标题区域 */}
        <h2 className="text-xl font-bold md:text-2xl">
          <span className="bg-gradient-to-r from-[#c565ef] to-[#55D9ED] bg-clip-text text-transparent">
            {t('intro.title')}
          </span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('intro.subtitle')}
        </p>

        {/* 分隔线 */}
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-[#c565ef]/20 to-transparent" />

        {/* 主标题 */}
        <div className="rounded-lg bg-gradient-to-r from-[#c565ef]/5 to-[#55D9ED]/5 p-4">
          <h3 className="text-base font-semibold leading-relaxed">
            {t('intro.heroTitle')}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t('intro.heroSubtitle')}
          </p>
        </div>
      </div>

      {/* 核心功能 */}
      <div className="space-y-3 px-6 pb-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="group flex items-start gap-3 rounded-xl border border-transparent bg-muted/30 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-border/50 hover:bg-muted/50 hover:shadow-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#c565ef]/10 to-[#55D9ED]/10">
                <Icon className="h-5 w-5 text-foreground/70" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{feature.title}</span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
})

AiToEarnIntro.displayName = 'AiToEarnIntro'
