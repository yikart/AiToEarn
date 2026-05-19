/**
 * PluginUpdateDocsContent - 浏览器插件更新图文教学内容组件
 * 展示 .crx 插件包更新扩展的完整步骤
 */
'use client'

import type { ReactNode } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CloudDownload,
  Download,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  ZoomIn,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PLUGIN_DOWNLOAD_LINKS } from '@/store/plugin/constants'

interface PublicImageAsset {
  src: string
  width: number
  height: number
}

const pluginUpdateDocsImages = {
  pluginUpdateDocsImg1_1: {
    src: '/assets/plugin-update-docs-images/pluginUpdateDocsImg1_1.png',
    width: 537,
    height: 321,
  },
  pluginUpdateDocsImg1_2: { src: '/assets/plugin-guide-images/pluginGuideImg1-2.png', width: 1878, height: 1015 },
  pluginUpdateDocsImg1_3: { src: '/assets/plugin-guide-images/pluginGuideImg3.png', width: 1912, height: 1026 },
  pluginUpdateDocsImg1_4: { src: '/assets/plugin-guide-images/pluginGuideImg1-5.png', width: 1850, height: 940 },
  pluginUpdateDocsImg1_5: { src: '/assets/plugin-guide-images/pluginGuideImg1-3.png', width: 1893, height: 935 },
  pluginUpdateDocsImg1_6: {
    src: '/assets/plugin-update-docs-images/pluginUpdateDocsImg1_2.png',
    width: 1203,
    height: 766,
  },
  pluginUpdateDocsImg5: { src: '/assets/plugin-guide-images/pluginGuideImg1-5.png', width: 1850, height: 940 },
} satisfies Record<string, PublicImageAsset>

const {
  pluginUpdateDocsImg1_1,
  pluginUpdateDocsImg1_2,
  pluginUpdateDocsImg1_3,
  pluginUpdateDocsImg1_4,
  pluginUpdateDocsImg1_5,
  pluginUpdateDocsImg1_6,
  pluginUpdateDocsImg5,
} = pluginUpdateDocsImages

const ALL_IMAGES = [
  pluginUpdateDocsImg1_1,
  pluginUpdateDocsImg1_2,
  pluginUpdateDocsImg1_3,
  pluginUpdateDocsImg1_4,
  pluginUpdateDocsImg1_5,
  pluginUpdateDocsImg1_6,
  pluginUpdateDocsImg5,
]

interface GuideImageProps {
  src: PublicImageAsset
  alt: string
  caption?: string
  className?: string
  onClick?: () => void
}

function GuideImage({ src, alt, caption, className, onClick }: GuideImageProps) {
  return (
    <figure className={cn('space-y-3', className)}>
      <button
        type="button"
        className="group relative block w-full overflow-hidden rounded-2xl border border-border/60 bg-background/90 p-2 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
        onClick={onClick}
      >
        <Image
          src={src.src}
          alt={alt}
          className="h-auto w-full rounded-xl object-contain"
          width={src.width}
          height={src.height}
          sizes="(min-width: 1280px) 760px, (min-width: 768px) 70vw, 100vw"
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/0 transition-colors duration-200 group-hover:bg-background/10">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" />
            {caption || alt}
          </div>
        </div>
      </button>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

interface SectionHeadingProps {
  id: string
  title: string
  description?: string
  icon: ReactNode
}

function SectionHeading({ id, title, description, icon }: SectionHeadingProps) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-linear-to-r from-sky-500/6 via-background to-transparent p-5 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500/15 to-emerald-500/15 text-sky-700 dark:text-sky-300">
          {icon}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
          {description && (
            <p className="text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface StepCardProps {
  step: number
  title: string
  description: string
  children?: ReactNode
}

function StepCard({ step, title, description, children }: StepCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <div className="border-b border-border/50 bg-linear-to-r from-sky-500/8 to-transparent px-5 py-4 md:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-600 to-emerald-500 text-sm font-semibold text-white shadow-sm">
            {step}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold md:text-xl">{title}</h3>
            <p className="text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
        </div>
      </div>
      {children && <div className="space-y-5 p-5 md:p-6">{children}</div>}
    </Card>
  )
}

function TableOfContents({ t }: { t: (key: string) => string }) {
  const items = [
    { id: 'before-update', label: t('sections.beforeUpdate') },
    { id: 'update-steps', label: t('sections.steps') },
  ]

  return (
    <Card className="sticky top-20 overflow-hidden border-border/60 p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t('tableOfContents')}
      </div>
      <nav className="space-y-1.5">
        {items.map(item => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-sky-500/8 hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" />
            {item.label}
          </a>
        ))}
      </nav>
    </Card>
  )
}

export default function PluginUpdateDocsContent() {
  const { t } = useTransClient('pluginUpdateDocs')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }, [])

  const closePreview = useCallback(() => {
    setPreviewOpen(false)
  }, [])

  const previewItems = ALL_IMAGES.map((img, index) => ({
    type: 'image' as const,
    src: img.src,
    title: `${t('hero.title')} ${index + 1}`,
  }))

  const checklistItems = [
    t('checklist.item1'),
    t('checklist.item2'),
  ]

  const steps = [
    {
      title: t('steps.step1.title'),
      content: t('steps.step1.content'),
      caption: t('steps.step1.caption'),
      image: pluginUpdateDocsImg1_1,
    },
    {
      title: t('steps.step2.title'),
      content: t('steps.step2.content'),
      caption: t('steps.step2.caption'),
      image: pluginUpdateDocsImg1_2,
    },
    {
      title: t('steps.step3.title'),
      content: t('steps.step3.content'),
      caption: t('steps.step3.caption'),
      image: pluginUpdateDocsImg1_3,
    },
    {
      title: t('steps.step4.title'),
      content: t('steps.step4.content'),
      caption: t('steps.step4.caption'),
      image: pluginUpdateDocsImg1_4,
    },
    {
      title: t('steps.step5.title'),
      content: t('steps.step5.content'),
      caption: t('steps.step5.caption'),
      image: pluginUpdateDocsImg1_5,
    },
    {
      title: t('steps.step6.title'),
      content: t('steps.step6.content'),
      caption: t('steps.step6.caption'),
      image: pluginUpdateDocsImg1_6,
    },
    {
      title: t('steps.step7.title'),
      content: t('steps.step7.content'),
      caption: t('steps.step7.caption'),
      image: pluginUpdateDocsImg5,
    },
  ]

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-sky-500/8 blur-3xl" />
        <div className="absolute right-[-6rem] top-[28rem] h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
      </div>

      <MediaPreview
        open={previewOpen}
        items={previewItems}
        initialIndex={previewIndex}
        onClose={closePreview}
      />

      <header className="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-sky-500/6 via-background to-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/6 px-4 py-2 text-sm font-medium text-foreground/80">
              <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              {t('hero.eyebrow')}
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
                {t('hero.title')}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {t('hero.description')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2 cursor-pointer">
                <a
                  href={PLUGIN_DOWNLOAD_LINKS.china}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CloudDownload className="h-4 w-4" />
                  {t('actions.downloadChina')}
                </a>
              </Button>

              <Button asChild variant="secondary" className="gap-2 cursor-pointer">
                <a
                  href={PLUGIN_DOWNLOAD_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                  {t('actions.downloadGithub')}
                </a>
              </Button>

              <Button asChild variant="outline" className="gap-2 cursor-pointer">
                <Link href="/websit/plugin-guide">
                  <BookOpen className="h-4 w-4" />
                  {t('actions.viewInstallGuide')}
                </Link>
              </Button>
            </div>

          </div>

          <Card className="border-border/60 bg-background/90 p-5 shadow-sm">
            <div className="space-y-4">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t('hero.summaryLabel')}
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-border/60 p-4">
                  <div className="text-sm text-muted-foreground">{t('facts.time')}</div>
                  <div className="mt-1 text-lg font-semibold">{t('facts.timeValue')}</div>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <div className="text-sm text-muted-foreground">{t('facts.scenario')}</div>
                  <div className="mt-1 text-lg font-semibold leading-7">{t('facts.scenarioValue')}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-10 md:px-6 md:py-12">
        <aside className="hidden w-72 shrink-0 lg:block">
          <TableOfContents t={t} />
        </aside>

        <main className="min-w-0 flex-1 space-y-12">
          <section className="space-y-6">
            <SectionHeading
              id="before-update"
              title={t('sections.beforeUpdate')}
              description={t('sections.beforeUpdateDesc')}
              icon={<ShieldCheck className="h-5 w-5" />}
            />

            <Alert className="border-amber-500/25 bg-amber-500/8">
              <HelpCircle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">
                {t('backupNotice.title')}
              </AlertTitle>
              <AlertDescription className="space-y-2 text-amber-800/90 dark:text-amber-100/80">
                <p>{t('backupNotice.content1')}</p>
                <p>{t('backupNotice.content2')}</p>
              </AlertDescription>
            </Alert>

            <Card className="border-border/60 p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                <h3 className="text-lg font-semibold">{t('checklist.title')}</h3>
              </div>
              <ul className="space-y-3">
                {checklistItems.map(item => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground md:text-base">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section className="space-y-6">
            <SectionHeading
              id="update-steps"
              title={t('sections.steps')}
              description={t('sections.stepsDesc')}
              icon={<Download className="h-5 w-5" />}
            />

            <div className="space-y-6">
              {steps.map((step, index) => (
                <StepCard
                  key={step.title}
                  step={index + 1}
                  title={step.title}
                  description={step.content}
                >
                  <GuideImage
                    src={step.image}
                    alt={step.caption}
                    caption={step.caption}
                    onClick={() => openPreview(index)}
                  />
                </StepCard>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
