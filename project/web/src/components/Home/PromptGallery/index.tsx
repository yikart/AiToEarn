/**
 * PromptGallery - 提示词画廊组件
 * 功能描述：首页展示精选提示词（8个网格对齐），支持打开全屏弹框浏览全部
 * 弹框使用瀑布流 + 上拉加载，支持状态缓存
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { Sparkles, Check, ArrowRight, Grid3X3 } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FeaturedCard, PromptDetailModal, PromptGalleryModal } from './components'
import { SAMPLE_PROMPTS, FEATURED_COUNT } from './constants'
import type { IPromptGalleryProps, PromptItem } from './types'

/**
 * PromptGallery - 提示词画廊主组件
 */
export default function PromptGallery({
  onApplyPrompt,
  className,
}: IPromptGalleryProps) {
  const { t } = useTransClient('promptGallery')
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null)
  const [applied, setApplied] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 首页精选提示词（固定8个）
  const featuredPrompts = useMemo(
    () => SAMPLE_PROMPTS.slice(0, FEATURED_COUNT),
    []
  )

  /**
   * 处理应用提示词
   */
  const handleApplyPrompt = useCallback(
    (item: PromptItem, e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (onApplyPrompt) {
        const applyData = {
          prompt: item.prompt,
          mode: item.mode,
          ...(item.mode === 'edit' && { image: item.preview }),
        }
        onApplyPrompt(applyData)
        setApplied(true)
        setIsModalOpen(false)
        setSelectedPrompt(null)
        setTimeout(() => setApplied(false), 2000)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [onApplyPrompt]
  )

  /**
   * 处理详情弹框应用
   */
  const handleDetailApply = useCallback(
    (item: PromptItem) => {
      handleApplyPrompt(item)
    },
    [handleApplyPrompt]
  )

  return (
    <section className={cn('py-12 px-4 md:px-6 lg:px-8', className)}>
      <div className="max-w-[1920px] mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t('badge')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('title')}{' '}
            <span className="text-gray-700">
              {t('titleHighlight')}
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* 精选卡片网格 - 固定8个，等高对齐 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {featuredPrompts.map((item, index) => (
            <FeaturedCard
              key={index}
              item={item}
              onApply={handleApplyPrompt}
              onClick={setSelectedPrompt}
              t={t as (key: string) => string}
            />
          ))}
        </div>

        {/* 查看全部按钮 */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full px-8 group"
          >
            <Grid3X3 className="w-5 h-5 mr-2" />
            查看全部 {SAMPLE_PROMPTS.length} 个提示词
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* 应用成功提示 */}
        {applied && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full shadow-2xl">
              <Check className="w-4 h-4 text-green-400" />
              <span className="font-medium">{t('appliedToast')}</span>
            </div>
          </div>
        )}

        {/* 提示词详情弹窗 */}
        <PromptDetailModal
          item={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onApply={handleDetailApply}
          t={t as (key: string) => string}
        />

        {/* 全屏画廊弹框 */}
        <PromptGalleryModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApplyPrompt={handleApplyPrompt}
          onSelectPrompt={setSelectedPrompt}
          t={t as (key: string) => string}
        />
      </div>
    </section>
  )
}

// 导出类型
export type { IPromptGalleryProps, PromptItem } from './types'
