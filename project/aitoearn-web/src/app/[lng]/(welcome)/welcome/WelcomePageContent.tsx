/**
 * WelcomePageContent - Welcome 页面主组件
 * 使用 Tailwind CSS + shadcn/ui 重写版本
 */
'use client'

import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { AIGraderSection } from './components/sections/AIGraderSection'
import { BeliefsSection } from './components/sections/BeliefsSection'
import { ExperienceTabsSection } from './components/sections/ExperienceTabsSection'
import { ReviewsSection } from './components/sections/ReviewsSection'
import { TechFeaturesSection } from './components/sections/TechFeaturesSection'

interface WelcomePageContentProps {
  lng: string
}

export default function WelcomePageContent({ lng }: WelcomePageContentProps) {
  return (
    <div className="min-h-screen bg-white antialiased">
      {/* 导航栏 */}
      <Navbar />

      {/* 主内容区 */}
      <main className="relative">
        {/* AI 打分工具区块 */}
        <AIGraderSection />

        {/* 体验标签轮播 */}
        <ExperienceTabsSection />

        {/* 评论区块 */}
        <ReviewsSection />

        {/* 科技功能介绍 */}
        <TechFeaturesSection />

        {/* 为什么选择 AiToEarn + 核心功能（合并区块） */}
        <BeliefsSection />
      </main>

      {/* 页脚 */}
      <Footer />
    </div>
  )
}
