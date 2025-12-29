/**
 * PromptGallery - 提示词画廊组件
 * 功能描述：首页展示精选提示词（8个网格对齐），支持打开全屏弹框浏览全部
 * 弹框使用瀑布流 + 上拉加载，支持状态缓存
 */

'use client'

import type { IPromptGalleryProps, PromptItem } from './types'
import { ArrowRight, Camera, Check, Grid3X3 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PromptGalleryModal } from './components'
import { SAMPLE_PROMPTS } from './constants'

/**
 * PromptGallery - 提示词画廊主组件
 */
export default function PromptGallery({
  onApplyPrompt,
  className,
}: IPromptGalleryProps) {
  const { t } = useTransClient('promptGallery')
  const { lng } = useParams()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 首页精选提示词 - 固定为三条「即点即用」的图片生成模板（不依赖外部 URL）
  const featuredPrompts = useMemo(() => {
    const prompts: PromptItem[] = [
      {
        key: 'dora',
        title: '哆啦A梦漫画套图',
        prompt: '生成三张哆啦A梦主题的漫画图片，竖版，色彩明快，漫画分镜感强，适配 Instagram，免版权素材，并直接发布到 Instagram',
        mode: 'generate',
      } as PromptItem & { key: string },
      {
        key: 'cats',
        title: '可爱猫咪插画',
        prompt: '生成三张可爱猫咪主题的插画图片，清新配色，竖版，适配 Instagram，免版权素材，并直接发布到 Instagram',
        mode: 'generate',
      } as PromptItem & { key: string },
      {
        key: 'vintage',
        title: '复古城市海报',
        prompt: '生成三张复古电影海报风格的城市夜景图片，竖版，适配 Twitter，免版权素材，并直接发布到 Twitter',
        mode: 'generate',
      } as PromptItem & { key: string },
    ]
    return prompts
  }, [])

  /**
   * 处理应用提示词 - 根据语言选择对应的提示词
   */
  const handleApplyPrompt = useCallback(
    (item: PromptItem, e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (onApplyPrompt) {
        const isEnglish = lng === 'en'
        // 根据语言选择对应的提示词
        const promptText = isEnglish && item.prompt_en ? item.prompt_en : item.prompt
        const applyData = {
          prompt: promptText,
          mode: item.mode,
          ...(item.mode === 'edit' && { image: item.preview }),
        }
        onApplyPrompt(applyData)
        setIsModalOpen(false)
        document.querySelector('#main-content')!.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [onApplyPrompt, lng],
  )

  return (
    <section className={cn('py-12 px-4 md:px-6 lg:px-8', className)}>
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
            {t('title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        {/* 顶部提示词区域（少量） */}

        {/* 文本提示列表：首页仅展示少量简洁提示词（无详情），直接触发发布行为 */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredPrompts.map((item: any, index) => {
              const topic = item.title || '主题'
              // 使用 i18n 文案优先，其次回退到 item.prompt / item.title
              const titleText = item.key ? t(`prompts.${item.key}.title`) : item.title
              const samplePrompt = item.key ? t(`prompts.${item.key}.prompt`) || item.prompt : item.prompt
              return (
                <div
                  key={index}
                  className="p-4 bg-card rounded-2xl shadow-xl hover:shadow-2xl transition-transform hover:-translate-y-1 border border-muted/10"
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-base text-foreground">{titleText || item.title}</div>
                      <div className="mt-2 text-sm text-muted-foreground leading-snug">
                        {samplePrompt}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button size="sm" variant="default" onClick={e => handleApplyPrompt({ ...item, prompt: samplePrompt }, e)} className="rounded-full px-4 py-1">
                      {t('apply') || '应用'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 查看全部按钮 */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full px-8 group"
          >
            <Grid3X3 className="w-5 h-5 mr-2" />
            {t('expandButton')}
            {' '}
            {SAMPLE_PROMPTS.length}
            {' '}
            {t('expandCount')}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* 全屏画廊弹框 */}
        <PromptGalleryModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApplyPrompt={handleApplyPrompt}
          onSelectPrompt={() => {}}
          t={t as (key: string) => string}
          lng={lng as string}
        />
      </div>
    </section>
  )
}

// 导出类型
export type { IPromptGalleryProps, PromptItem } from './types'
