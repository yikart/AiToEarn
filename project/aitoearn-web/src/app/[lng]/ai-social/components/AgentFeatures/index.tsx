/**
 * AgentFeatures - AI Agent 功能亮点轮播展示（用于首页）
 * 使用 Swiper 实现自动轮播效果，支持无缝滚动
 */
'use client'

import type { FC } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Frame,
  Hash,
  Image as ImageIcon,
  Languages,
  Layers,
  Lightbulb,
  ListTodo,
  MessageSquare,
  MonitorSmartphone,
  PanelTop,
  ScanEye,
  Scissors,
  Search,
  Send,
  Timer,
  Users,
  Video,
  Workflow,
} from 'lucide-react'
import { useCallback, useRef } from 'react'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import 'swiper/css'
import 'swiper/css/pagination'
import './style.css'

interface AgentFeaturesProps {
  className?: string
}

// 图标映射 - 每个功能使用不同的图标
const iconMap = {
  inspiration: Lightbulb, // 创意灵感 - 灯泡
  oneClickScript: FileText, // 一键生成脚本 - 文档
  multiTemplates: Layers, // 多风格模板 - 图层
  imageGenerate: ImageIcon, // 图片生成 - 图片
  videoGenerate: Video, // 视频生成 - 视频
  highlight: Scissors, // 高光剪辑 - 剪刀
  storyboard: PanelTop, // 分镜设计 - 面板
  coverSuggestion: Frame, // 封面建议 - 相框
  download: Download, // 素材下载 - 下载
  videoTranslation: Languages, // 视频翻译 - 语言
  platformAdapt: MonitorSmartphone, // 平台适配 - 多设备
  topicTag: Hash, // 话题标签 - 标签
  seo: Search, // SEO优化 - 搜索
  schedule: Calendar, // 定时发布 - 日历
  multiPlatform: Send, // 多平台分发 - 发送
  smartTime: Timer, // 智能发布时间 - 计时器
  sse: Activity, // 流式任务 - 活动/脉冲
  taskManagement: ListTodo, // 任务管理 - 待办列表
  workflow: Workflow, // 可扩展工作流 - 工作流
  videoUnderstanding: ScanEye, // 视频理解 - 扫描眼睛
  report: BarChart3, // 运营报告 - 柱状图
  commentAssistant: MessageSquare, // 评论助手 - 消息
  audienceInsight: Users, // 用户画像 - 用户组
} as const

// 所有功能项
const allFeatures = [
  'inspiration',
  'oneClickScript',
  'multiTemplates',
  'imageGenerate',
  'videoGenerate',
  'highlight',
  'storyboard',
  'coverSuggestion',
  'download',
  'videoTranslation',
  'platformAdapt',
  'topicTag',
  'seo',
  'schedule',
  'multiPlatform',
  'smartTime',
  'sse',
  'taskManagement',
  'workflow',
  'videoUnderstanding',
  'report',
  'commentAssistant',
  'audienceInsight',
]

/**
 * 功能卡片组件 - icon 和 title 同行布局
 */
interface FeatureCardProps {
  itemKey: string
  t: (key: string) => string
}

const FeatureCard: FC<FeatureCardProps> = ({ itemKey, t }) => {
  const Icon = iconMap[itemKey as keyof typeof iconMap]
  const title = t(`agentFeatures.items.${itemKey}.title`)
  const desc = t(`agentFeatures.items.${itemKey}.desc`)

  return (
    <div className="h-full rounded-xl border border-border bg-card p-4 transition-colors duration-200 hover:border-primary/30">
      {/* icon + title 同行 */}
      <div className="flex items-center gap-3 mb-2">
        {/* 带渐变动画的图标容器 */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted animate-pulse"
          style={{ animationDuration: '3s' }}
        >
          <Icon className="h-[18px] w-[18px] text-muted-foreground" />
        </div>
        <h4 className="text-sm font-medium text-foreground line-clamp-1">{title}</h4>
      </div>

      {/* 描述 */}
      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{desc}</p>
    </div>
  )
}

/**
 * AgentFeatures 主组件
 */
const AgentFeatures: FC<AgentFeaturesProps> = ({ className }) => {
  const { t } = useTransClient('promptGallery')
  const swiperRef = useRef<SwiperType | null>(null)

  // 处理 Swiper 实例
  const onSwiper = useCallback((swiper: SwiperType) => {
    swiperRef.current = swiper
  }, [])

  // 导航按钮点击
  const handlePrev = useCallback(() => {
    swiperRef.current?.slidePrev()
  }, [])

  const handleNext = useCallback(() => {
    swiperRef.current?.slideNext()
  }, [])

  return (
    <section className={cn('py-10 px-4 md:px-6 lg:px-8', className)}>
      <div className="w-full max-w-5xl mx-auto">
        {/* 标题区域 */}
        <div className="mb-8 text-center sm:mb-8">
          <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
            {t('agentFeatures.title')}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t('agentFeatures.subtitle')}
          </p>
        </div>
        <div className="flex flex-col gap-3 mb-8 md:flex-row md:items-end md:justify-between">
          <div />
          {/* 桌面端导航按钮 */}
          <div className="hidden md:flex items- center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full cursor-pointer"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full cursor-pointer"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Swiper 轮播 - 移动端分页器在两侧 */}
        <div className="flex items-center gap-2">
          {/* 移动端左箭头 */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 shrink-0 rounded-full cursor-pointer"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Swiper 内容 */}
          <div className="flex-1 min-w-0 agent-features-swiper">
            <Swiper
              modules={[Autoplay, Pagination]}
              onSwiper={onSwiper}
              spaceBetween={12}
              slidesPerView={1}
              loop
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                clickable: true,
              }}
              breakpoints={{
                // 移动端：1 个卡片
                0: {
                  slidesPerView: 1,
                  spaceBetween: 12,
                },
                // 小屏幕：2 个卡片
                480: {
                  slidesPerView: 2,
                  spaceBetween: 12,
                },
                // 平板：3 个卡片
                768: {
                  slidesPerView: 3,
                  spaceBetween: 16,
                },
                // 桌面：4 个卡片
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 16,
                },
              }}
            >
              {allFeatures.map(itemKey => (
                <SwiperSlide key={itemKey} className="h-auto!">
                  <FeatureCard itemKey={itemKey} t={t} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 移动端右箭头 */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 shrink-0 rounded-full cursor-pointer"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

export default AgentFeatures
