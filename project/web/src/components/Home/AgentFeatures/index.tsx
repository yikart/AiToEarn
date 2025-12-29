/**
 * AgentFeatures - 独立展示 AI Agent 的功能亮点（用于首页）
 */
'use client'

import type { FC } from 'react'
import { Camera, Clock, Download, Edit3, Eye, Film, Globe, Image as ImageIcon, Lightbulb } from 'lucide-react'
import { AccountPlatInfoArr } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'

interface AgentFeaturesProps {
  className?: string
}

const iconMap = {
  inspiration: Lightbulb,
  oneClickScript: Edit3,
  multiTemplates: Edit3,
  imageGenerate: ImageIcon,
  videoGenerate: Film,

  highlight: Film,
  storyboard: Edit3,
  coverSuggestion: ImageIcon,
  download: Download,

  videoTranslation: Globe,
  platformAdapt: Globe,
  topicTag: Lightbulb,
  seo: Globe,

  schedule: Clock,
  multiPlatform: Clock,
  smartTime: Clock,

  sse: Clock,
  taskManagement: Clock,
  workflow: Lightbulb,

  videoUnderstanding: Eye,
  report: Eye,

  commentAssistant: Edit3,
  audienceInsight: Eye,
} as const

const featureKeys = [
  // Content generation & creation
  'inspiration',
  'oneClickScript',
  'multiTemplates',
  'imageGenerate',
  'videoGenerate',

  // Editing & post-processing
  'highlight',
  'storyboard',
  'coverSuggestion',
  'download',

  // Localization & smart optimization
  'videoTranslation',
  'platformAdapt',
  'topicTag',
  'seo',

  // Publishing & distribution
  'schedule',
  'multiPlatform',
  'smartTime',

  // Automation & pipeline
  'sse',
  'taskManagement',
  'workflow',

  // Understanding & analytics
  'videoUnderstanding',
  'report',

  // Interaction & ops
  'commentAssistant',
  'audienceInsight',
]

const AgentFeatures: FC<AgentFeaturesProps> = ({ className }) => {
  const { t } = useTransClient('promptGallery')

  return (
    <section className={cn('py-8 px-4 md:px-6 lg:px-8', className)}>
      <div className="w-full max-w-5xl mx-auto rounded-2xl bg-white border border-muted/8 overflow-hidden relative">

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{t('agentFeatures.title') || 'AI Agent 功能亮点'}</h3>
          <p className="text-sm text-muted-foreground">{t('agentFeatures.subtitle') || '我们的特色功能，一键触达'}</p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((key, idx) => {
            const Icon = iconMap[key as keyof typeof iconMap]
            return (
              <li
                key={key}
                className="relative rounded-xl p-5 overflow-hidden border border-gray-200 dark:border-gray-700 bg-white transition-colors hover:bg-muted/5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-none w-10 h-10 rounded-md bg-linear-to-br from-slate-100 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-sm ring-1 ring-muted/10">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-foreground">{t(`agentFeatures.items.${key}.title`)}</div>
                    <div className="text-sm text-muted-foreground mt-1">{t(`agentFeatures.items.${key}.desc`)}</div>
                    {/* 简洁显示：不展示额外要点 */}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default AgentFeatures
