/**
 * PromptGallery - 提示词画廊组件
 * 功能描述：首页展示精选提示词（8个网格对齐），支持打开全屏弹框浏览全部
 * 弹框使用瀑布流 + 上拉加载，支持状态缓存
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Check, ArrowRight, Grid3X3, Star, Image as ImageIcon } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FeaturedCard, PromptDetailModal, PromptGalleryModal } from './components'
import { SAMPLE_PROMPTS, FEATURED_COUNT } from './constants'
import type { IPromptGalleryProps, PromptItem, CategoryFilter } from './types'

/**
 * PromptGallery - 提示词画廊主组件
 */
export default function PromptGallery({
  onApplyPrompt,
  className,
}: IPromptGalleryProps) {
  const { t } = useTransClient('promptGallery')
  const { lng } = useParams()
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null)
  const [applied, setApplied] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Recommend')

  // 分类按钮配置
  const categoryButtons = [
    { key: 'Recommend' as CategoryFilter, label: t('categories.recommend'), icon: Star },
    { key: 'Image' as CategoryFilter, label: t('categories.image'), icon: ImageIcon },
  ]

  // 首页精选提示词 - 根据选中的分类显示
  const featuredPrompts = useMemo(() => {
    const filteredPrompts = SAMPLE_PROMPTS.filter(item => item.category === selectedCategory)
    return filteredPrompts.slice(0, FEATURED_COUNT)
  }, [selectedCategory])

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
        {/* 分类切换标签 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {categoryButtons.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedCategory(key)}
              className={cn(
                'rounded-full px-6 py-2 transition-all duration-300',
                selectedCategory === key 
                  ? 'shadow-lg scale-105' 
                  : 'hover:scale-102'
              )}
            >
              <Icon className="w-5 h-5 mr-2" />
              {label}
            </Button>
          ))}
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
              lng={lng as string}
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
            {t('expandButton')} {SAMPLE_PROMPTS.length} {t('expandCount')}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* 应用成功提示 */}
        {applied && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-2xl">
              <Check className="w-4 h-4 text-success" />
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
          lng={lng as string}
        />

        {/* 全屏画廊弹框 */}
        <PromptGalleryModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApplyPrompt={handleApplyPrompt}
          onSelectPrompt={setSelectedPrompt}
          t={t as (key: string) => string}
          lng={lng as string}
        />
      </div>
    </section>
  )
}

// 导出类型
export type { IPromptGalleryProps, PromptItem } from './types'
