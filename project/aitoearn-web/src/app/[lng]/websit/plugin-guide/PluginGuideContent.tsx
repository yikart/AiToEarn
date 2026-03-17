/**
 * PluginGuideContent - 浏览器插件图文教学内容组件
 * 客户端组件，包含图片预览交互和国际化翻译
 */
'use client'

import type { StaticImageData } from 'next/image'
import {
  CheckCircle2,
  ChevronRight,
  Download,
  HelpCircle,
  Puzzle,
  Shield,
  Smartphone,
  ZoomIn,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
// 导入图片资源
import pluginGuideImg1 from './images/pluginGuideImg1.png'
import pluginGuideImg2 from './images/pluginGuideImg2.png'
import pluginGuideImg3 from './images/pluginGuideImg3.png'
import pluginGuideImg4 from './images/pluginGuideImg4.png'
import pluginGuideImg5 from './images/pluginGuideImg5.png'
import pluginGuideImg6 from './images/pluginGuideImg6.png'
import pluginGuideImg7 from './images/pluginGuideImg7.png'
import pluginGuideImg8 from './images/pluginGuideImg8.png'
import pluginGuideImg9 from './images/pluginGuideImg9.png'
import pluginGuideImg10 from './images/pluginGuideImg10.png'
import pluginGuideImg11 from './images/pluginGuideImg11.png'
import pluginGuideImg12 from './images/pluginGuideImg12.png'
import pluginGuideImg13 from './images/pluginGuideImg13.png'
import pluginGuideImg14 from './images/pluginGuideImg14.png'
import pluginGuideImg15 from './images/pluginGuideImg15.png'
import pluginGuideImg16 from './images/pluginGuideImg16.png'
import pluginGuideImg17 from './images/pluginGuideImg17.png'
import pluginGuideImg18 from './images/pluginGuideImg18.png'
import pluginGuideImg19 from './images/pluginGuideImg19.png'

// 所有图片列表，用于 MediaPreview
const ALL_IMAGES = [
  pluginGuideImg1,
  pluginGuideImg2,
  pluginGuideImg3,
  pluginGuideImg4,
  pluginGuideImg5,
  pluginGuideImg6,
  pluginGuideImg7,
  pluginGuideImg8,
  pluginGuideImg9,
  pluginGuideImg18,
  pluginGuideImg19,
  pluginGuideImg10,
  pluginGuideImg11,
  pluginGuideImg12,
  pluginGuideImg13,
  pluginGuideImg14,
  pluginGuideImg15,
  pluginGuideImg16,
  pluginGuideImg17,
]

/**
 * 步骤卡片组件
 */
interface StepCardProps {
  stepNumber: number
  title: string
  children: React.ReactNode
  icon?: React.ReactNode
}

function StepCard({ stepNumber, title, children, icon }: StepCardProps) {
  return (
    <div className="relative">
      {/* 步骤连接线 */}
      <div className="absolute left-[18px] top-14 bottom-0 w-[2px] bg-gradient-to-b from-[#c565ef]/30 to-[#55D9ED]/15" />

      <div className="flex gap-4 md:gap-6">
        {/* 步骤编号 */}
        <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#c565ef] to-[#55D9ED] text-white flex items-center justify-center font-semibold text-sm z-10 shadow-md shadow-[#c565ef]/20">
          {stepNumber}
        </div>

        {/* 步骤内容 */}
        <div className="flex-1 pb-8 md:pb-12">
          <div className="flex items-center gap-2 mb-3">
            {icon}
            <h3 className="text-lg md:text-xl font-semibold">{title}</h3>
          </div>
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * 图片展示组件
 */
interface GuideImageProps {
  src: StaticImageData
  alt: string
  caption?: string
  className?: string
  onClick?: () => void
}

function GuideImage({ src, alt, caption, className, onClick }: GuideImageProps) {
  return (
    <figure className={cn('my-4', className)}>
      <div
        className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-1.5 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:ring-2 hover:ring-[#c565ef]/15 hover:-translate-y-0.5"
        onClick={onClick}
      >
        <Image
          src={src}
          alt={alt}
          className="w-full h-auto max-h-[500px] object-contain rounded-md"
          priority={false}
          placeholder="blur"
          quality={100}
        />
        {/* 点击放大提示 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all rounded-md">
          <div className="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all bg-white/90 dark:bg-black/80 rounded-full p-2 shadow-lg">
            <ZoomIn className="w-5 h-5 text-[#c565ef]" />
          </div>
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * 目录导航组件
 */
function TableOfContents({ t }: { t: (key: string) => string }) {
  const sections = [
    { id: 'installation', label: t('sections.installation') },
    { id: 'manual-install', label: t('sections.manualInstall') },
    { id: 'authorize', label: t('sections.authorize') },
    { id: 'login-account', label: t('sections.loginAccount') },
    { id: 'sync-account', label: t('sections.syncAccount') },
    { id: 'faq', label: t('faq.title') },
  ]

  return (
    <Card className="sticky top-20 p-4 relative overflow-hidden border-border/50">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c565ef] to-[#55D9ED]" />
      <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
        {t('tableOfContents')}
      </h4>
      <nav className="space-y-1">
        {sections.map(section => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md border-l-2 border-transparent hover:border-[#c565ef]/50 hover:bg-gradient-to-r hover:from-[#c565ef]/5 hover:to-transparent transition-all cursor-pointer"
          >
            <ChevronRight className="w-3 h-3" />
            {section.label}
          </a>
        ))}
      </nav>
    </Card>
  )
}

export default function PluginGuideContent() {
  const { t } = useTransClient('pluginGuide')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  // 打开图片预览
  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }, [])

  // 关闭图片预览
  const closePreview = useCallback(() => {
    setPreviewOpen(false)
  }, [])

  // 将图片转换为 MediaPreview 所需的格式
  const previewItems = ALL_IMAGES.map((img, index) => ({
    type: 'image' as const,
    src: img.src,
    title: `${t('title')} - ${index + 1}`,
  }))

  return (
    <div className="relative min-h-screen bg-background">
      {/* 装饰光晕 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[30%] -right-40 w-80 h-80 bg-[#c565ef]/3 rounded-full blur-3xl" />
        <div className="absolute top-[60%] -left-40 w-80 h-80 bg-[#55D9ED]/3 rounded-full blur-3xl" />
      </div>

      {/* 图片预览组件 */}
      <MediaPreview
        open={previewOpen}
        items={previewItems}
        initialIndex={previewIndex}
        onClose={closePreview}
      />

      {/* 页头区域 */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#c565ef]/5 via-[#55D9ED]/3 to-background">
        {/* 页头装饰光晕 */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 bg-[#c565ef]/8 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -top-10 -right-20 w-60 h-60 bg-[#55D9ED]/8 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c565ef]/10 bg-gradient-to-r from-[#c565ef]/5 to-[#55D9ED]/5 px-3 py-1.5 backdrop-blur-sm">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#c565ef] to-[#55D9ED]">
                <Puzzle className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground/80">Browser Extension</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#c565ef] to-[#55D9ED] bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">{t('introduction')}</p>
          </div>
        </div>
        {/* 渐变分隔线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#c565ef]/20 to-transparent" />
      </div>

      {/* 主体内容 */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 目录 - 桌面端侧边栏 */}
          <aside className="hidden lg:block w-64 shrink-0">
            <TableOfContents t={t} />
          </aside>

          {/* 教程内容 */}
          <main className="flex-1 max-w-4xl">
            {/* ===== 第一部分：安装插件 ===== */}
            <section id="installation" className="mb-12">
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary/40">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{t('sections.installation')}</h2>
              </div>

              <StepCard
                stepNumber={1}
                title={t('steps.step1.title')}
                icon={<Puzzle className="w-5 h-5 text-muted-foreground" />}
              >
                <p className="text-muted-foreground">{t('steps.step1.content')}</p>
                <GuideImage
                  src={pluginGuideImg1}
                  alt={t('steps.step1.caption')}
                  caption={t('steps.step1.caption')}
                  onClick={() => openPreview(0)}
                />
              </StepCard>

              <StepCard stepNumber={2} title={t('steps.step2.title')}>
                <p className="text-muted-foreground">{t('steps.step2.content')}</p>
                <GuideImage
                  src={pluginGuideImg2}
                  alt={t('steps.step2.caption')}
                  caption={t('steps.step2.caption')}
                  onClick={() => openPreview(1)}
                />

                <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 dark:text-blue-300">
                    {t('steps.step2.note')}
                  </AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>{t('steps.step2.noteItem1')}</li>
                      <li>{t('steps.step2.noteItem2')}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </StepCard>
            </section>

            {/* ===== 第二部分：手动安装（可选） ===== */}
            <section id="manual-install" className="mb-12">
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/5 to-transparent border-l-4 border-orange-500/40">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/15 to-orange-500/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">{t('sections.manualInstall')}</h2>
                  <p className="text-sm text-muted-foreground">{t('sections.manualInstallDesc')}</p>
                </div>
              </div>

              <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-300">
                  {t('manualInstall.tip')}
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  {t('manualInstall.tipContent')}
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <Card className="p-6 border-l-4 border-l-[#c565ef]/30 hover:border-l-[#c565ef]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c565ef]/20 to-[#55D9ED]/20 flex items-center justify-center text-xs font-semibold text-foreground">
                      1
                    </span>
                    {t('manualInstall.step1.title')}
                  </h4>
                  <p className="text-muted-foreground mb-4">{t('manualInstall.step1.content')}</p>
                  <GuideImage
                    src={pluginGuideImg3}
                    alt={t('manualInstall.step1.title')}
                    onClick={() => openPreview(2)}
                  />
                </Card>

                <Card className="p-6 border-l-4 border-l-[#c565ef]/30 hover:border-l-[#c565ef]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c565ef]/20 to-[#55D9ED]/20 flex items-center justify-center text-xs font-semibold text-foreground">
                      2
                    </span>
                    {t('manualInstall.step2.title')}
                  </h4>
                  <p className="text-muted-foreground mb-4">{t('manualInstall.step2.content')}</p>
                  <GuideImage
                    src={pluginGuideImg4}
                    alt={t('manualInstall.step2.title')}
                    onClick={() => openPreview(3)}
                  />
                </Card>

                <Card className="p-6 border-l-4 border-l-[#c565ef]/30 hover:border-l-[#c565ef]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c565ef]/20 to-[#55D9ED]/20 flex items-center justify-center text-xs font-semibold text-foreground">
                      3
                    </span>
                    {t('manualInstall.step3.title')}
                  </h4>
                  <p className="text-muted-foreground mb-4">{t('manualInstall.step3.content')}</p>
                  <GuideImage
                    src={pluginGuideImg5}
                    alt={t('manualInstall.step3.title')}
                    onClick={() => openPreview(4)}
                  />
                </Card>

                <Card className="p-6 border-l-4 border-l-[#c565ef]/30 hover:border-l-[#c565ef]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c565ef]/20 to-[#55D9ED]/20 flex items-center justify-center text-xs font-semibold text-foreground">
                      4
                    </span>
                    {t('manualInstall.step4.title')}
                  </h4>
                  <p className="text-muted-foreground mb-4">{t('manualInstall.step4.content')}</p>
                  <GuideImage
                    src={pluginGuideImg6}
                    alt={t('manualInstall.step4.title')}
                    onClick={() => openPreview(5)}
                  />
                </Card>

                <Card className="p-6 border-l-4 border-l-[#c565ef]/30 hover:border-l-[#c565ef]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c565ef]/20 to-[#55D9ED]/20 flex items-center justify-center text-xs font-semibold text-foreground">
                      5
                    </span>
                    {t('manualInstall.step5.title')}
                  </h4>
                  <p className="text-muted-foreground mb-4">{t('manualInstall.step5.content')}</p>
                  <GuideImage
                    src={pluginGuideImg7}
                    alt={t('manualInstall.step5.title')}
                    onClick={() => openPreview(6)}
                  />
                </Card>
              </div>
            </section>

            {/* ===== 第三部分：授权插件 ===== */}
            <section id="authorize" className="mb-12">
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-green-500/5 to-transparent border-l-4 border-green-500/40">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/15 to-green-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{t('sections.authorize')}</h2>
              </div>

              <StepCard stepNumber={3} title={t('steps.step3.title')}>
                <p className="text-muted-foreground">{t('steps.step3.content')}</p>
                <GuideImage
                  src={pluginGuideImg8}
                  alt={t('steps.step3.caption')}
                  caption={t('steps.step3.caption')}
                  onClick={() => openPreview(7)}
                />
              </StepCard>

              <StepCard stepNumber={4} title={t('steps.step5.title')}>
                <p className="text-muted-foreground">{t('steps.step5.notLoggedInContent')}</p>
                <GuideImage
                  src={pluginGuideImg18}
                  alt={t('steps.step5.notLoggedInCaption')}
                  caption={t('steps.step5.notLoggedInCaption')}
                  onClick={() => openPreview(9)}
                />
                <p className="text-muted-foreground">{t('steps.step5.loggedInContent')}</p>
                <GuideImage
                  src={pluginGuideImg19}
                  alt={t('steps.step5.loggedInCaption')}
                  caption={t('steps.step5.loggedInCaption')}
                  onClick={() => openPreview(10)}
                />
              </StepCard>

              <StepCard stepNumber={5} title={t('steps.step6.title')}>
                <p className="text-muted-foreground">{t('steps.step6.content')}</p>
                <GuideImage
                  src={pluginGuideImg10}
                  alt={t('steps.step6.caption1')}
                  caption={t('steps.step6.caption1')}
                  onClick={() => openPreview(11)}
                />
                <GuideImage
                  src={pluginGuideImg11}
                  alt={t('steps.step6.caption2')}
                  caption={t('steps.step6.caption2')}
                  onClick={() => openPreview(12)}
                />
              </StepCard>
            </section>

            {/* ===== 第四部分：登录账号 ===== */}
            <section id="login-account" className="mb-12">
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-transparent border-l-4 border-purple-500/40">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/15 to-purple-500/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{t('sections.loginAccount')}</h2>
              </div>

              <StepCard stepNumber={6} title={t('steps.step7.title')}>
                <p className="text-muted-foreground">{t('steps.step7.loginContent')}</p>
                <GuideImage
                  src={pluginGuideImg12}
                  alt={t('steps.step7.caption')}
                  caption={t('steps.step7.caption')}
                  onClick={() => openPreview(13)}
                />
              </StepCard>

              <StepCard stepNumber={7} title={t('steps.step7b.title')}>
                <p className="text-muted-foreground">{t('steps.step7b.content')}</p>
                <GuideImage
                  src={pluginGuideImg13}
                  alt={t('steps.step7b.caption1')}
                  caption={t('steps.step7b.caption1')}
                  onClick={() => openPreview(14)}
                />

                <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300">
                    {t('steps.step7b.importantNote')}
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    {t('steps.step7b.importantNoteContent')}
                  </AlertDescription>
                </Alert>

                <GuideImage
                  src={pluginGuideImg14}
                  alt={t('steps.step7b.caption2')}
                  caption={t('steps.step7b.caption2')}
                  onClick={() => openPreview(15)}
                />
              </StepCard>
            </section>

            {/* ===== 第五部分：同步账号 ===== */}
            <section id="sync-account" className="mb-12">
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent border-l-4 border-blue-500/40">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{t('sections.syncAccount')}</h2>
              </div>

              <StepCard stepNumber={8} title={t('steps.step8.title')}>
                <p className="text-muted-foreground">{t('steps.step8.content')}</p>
                <GuideImage
                  src={pluginGuideImg15}
                  alt={t('steps.step8.caption')}
                  caption={t('steps.step8.caption')}
                  onClick={() => openPreview(16)}
                />
              </StepCard>

              <StepCard stepNumber={9} title={t('steps.step9.title')}>
                <p className="text-muted-foreground">{t('steps.step9.content')}</p>
                <GuideImage
                  src={pluginGuideImg16}
                  alt={t('steps.step9.caption1')}
                  caption={t('steps.step9.caption1')}
                  onClick={() => openPreview(17)}
                />
                <GuideImage
                  src={pluginGuideImg17}
                  alt={t('steps.step9.caption2')}
                  caption={t('steps.step9.caption2')}
                  onClick={() => openPreview(18)}
                />
              </StepCard>

              {/* 完成提示 */}
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-[#c565ef]/8 to-[#55D9ED]/8 border border-[#c565ef]/15 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c565ef] to-[#55D9ED] flex items-center justify-center shrink-0 shadow-md shadow-[#c565ef]/20">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {t('steps.complete.title')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('steps.complete.content')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== FAQ 部分 ===== */}
            <section id="faq" className="mb-12">
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/5 to-transparent border-l-4 border-violet-500/40">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/15 to-violet-500/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-violet-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{t('faq.title')}</h2>
              </div>

              <div className="space-y-4">
                <Card className="p-6 border-l-4 border-l-[#c565ef]/30 hover:shadow-md transition-shadow">
                  <h4 className="font-semibold mb-2 flex items-start gap-2">
                    <span className="bg-gradient-to-r from-[#c565ef] to-[#55D9ED] bg-clip-text text-transparent font-bold">Q:</span>
                    {t('faq.q1.question')}
                  </h4>
                  <p className="text-muted-foreground pl-6">
                    <span className="bg-gradient-to-r from-[#55D9ED] to-[#c565ef] bg-clip-text text-transparent font-semibold">A: </span>
                    {t('faq.q1.answer')}
                  </p>
                </Card>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
