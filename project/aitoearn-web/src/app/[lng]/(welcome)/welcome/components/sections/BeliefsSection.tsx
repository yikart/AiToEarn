/**
 * BeliefsSection - 为什么选择 AiToEarn + 核心功能合并区块
 * 参考 img_8.png 简洁设计风格：三列布局、分隔线、无花哨元素
 */

'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { useTransClient } from '@/app/i18n/client'

/** 列表项组件（中间标题 + 右侧描述） */
interface ListItemProps {
  title: string
  description: string
  isLast?: boolean
}

function ListItem({ title, description, isLast }: ListItemProps) {
  return (
    <div className={!isLast ? 'border-b border-border/30 pb-6' : ''}>
      <div className="grid gap-4 lg:grid-cols-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

/** 子区块组件 */
interface SubSectionProps {
  title: string
  subtitle: string
  items: Array<{
    id: string
    title: string
    description: string
  }>
  actionLink?: {
    href: string
    text: string
  }
}

function SubSection({ title, subtitle, items, actionLink }: SubSectionProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
      {/* 左侧标题区 */}
      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        {actionLink && (
          <Link
            href={actionLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <span>{actionLink.text}</span>
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      {/* 右侧列表（中间标题 + 右侧描述） */}
      <div className="space-y-6 lg:col-span-2">
        {items.map((item, index) => (
          <ListItem
            key={item.id}
            title={item.title}
            description={item.description}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

export function BeliefsSection() {
  const { t } = useTransClient('welcome')

  // 为什么选择 AiToEarn 数据
  const beliefs = [
    {
      id: 'belief1',
      title: t('beliefs.belief1.title'),
      description: t('beliefs.belief1.description'),
    },
    {
      id: 'belief2',
      title: t('beliefs.belief2.title'),
      description: t('beliefs.belief2.description'),
    },
    {
      id: 'belief4',
      title: t('beliefs.belief4.title'),
      description: t('beliefs.belief4.description'),
    },
  ]

  // 核心功能数据
  const features = [
    {
      id: 'feature1',
      title: t('guides.feature1.title'),
      description: t('guides.feature1.description'),
    },
    {
      id: 'feature2',
      title: t('guides.feature2.title'),
      description: t('guides.feature2.description'),
    },
    {
      id: 'feature3',
      title: t('guides.feature3.title'),
      description: t('guides.feature3.description'),
    },
  ]

  return (
    <section className="rounded-t-3xl bg-[#f7f6f5] py-16 md:py-24 lg:mx-2">
      <div className="mx-auto max-w-7xl space-y-16 px-4 md:space-y-20 md:px-6 lg:px-8">
        {/* 为什么选择 AiToEarn */}
        <SubSection
          title={t('beliefs.title')}
          subtitle={t('beliefs.subtitle')}
          items={beliefs}
        />

        {/* 核心功能 */}
        <SubSection
          title={t('guides.title')}
          subtitle={t('guides.subtitle')}
          items={features}
          actionLink={{
            href: 'https://docs.aitoearn.ai/',
            text: t('guides.viewDocs'),
          }}
        />
      </div>
    </section>
  )
}
