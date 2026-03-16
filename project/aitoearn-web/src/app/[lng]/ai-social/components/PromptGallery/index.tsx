/**
 * PromptGallery 组件
 * 功能：展示视频提示词画廊，支持点击查看详情和应用提示词
 */
'use client'

import type { PromptGalleryItem } from './types'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import { VideoCard, VideoDetailModal } from './components'
import { promptGalleryAssets } from './data'

/** 应用提示词回调参数 */
export interface ApplyPromptData {
  /** 提示词内容 */
  prompt: string
  /** 参考素材图片列表（可选） */
  materials?: string[]
  /** 模式类型 */
  mode: 'edit' | 'generate'
}

/** PromptGallery 组件属性 */
export interface PromptGalleryProps {
  /** 应用提示词回调（点击视频卡片时触发） */
  onApplyPrompt?: (data: ApplyPromptData) => void
  /** 自定义类名 */
  className?: string
}

const PromptGallery = memo(({ onApplyPrompt, className }: PromptGalleryProps) => {
  const { t } = useTransClient('promptGallery')
  const [selectedItem, setSelectedItem] = useState<PromptGalleryItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // 组合数据 - title 和 prompt 直接使用 data.ts 中的英文，不走翻译
  const promptGalleryItems = useMemo<PromptGalleryItem[]>(
    () =>
      promptGalleryAssets.map(asset => ({
        ...asset,
        title: asset.title,
        prompt: asset.prompt,
      })),
    [],
  )

  // 点击卡片只打开详情弹窗，不应用提示词
  const handleCardClick = useCallback((item: PromptGalleryItem) => {
    setSelectedItem(item)
    setModalOpen(true)
  }, [])

  // 关闭弹窗
  const handleModalClose = useCallback((open: boolean) => {
    setModalOpen(open)
    if (!open) {
      // 延迟清除选中项，避免弹窗关闭动画中内容消失
      setTimeout(() => setSelectedItem(null), 300)
    }
  }, [])

  // 在弹窗中点击应用提示词按钮
  const handleApplyPrompt = useCallback(
    (data: { prompt: string, materials?: string[] }) => {
      if (onApplyPrompt) {
        onApplyPrompt({
          prompt: data.prompt,
          materials: data.materials,
          mode: 'generate',
        })
      }
    },
    [onApplyPrompt],
  )

  return (
    <section className="mb-10 px-4 md:px-6 lg:px-8">
      <div className={cn('w-full max-w-5xl mx-auto', className)}>
        {/* 标题区域 */}
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{t('title')}</h2>
          <p className="text-sm text-muted-foreground sm:text-base">{t('subtitle')}</p>
        </div>

        {/* 视频卡片网格 - 3列竖屏布局 */}
        {/*
        PC 端 (>= 1024px) 3 列布局：
        ┌─────────┬─────────┬─────────┐
        │         │         │         │
        │ 竖视频1 │ 竖视频2 │ 竖视频3 │
        │         │         │         │
        └─────────┴─────────┴─────────┘

        平板 (640px - 1024px) 2 列布局：
        ┌─────────┬─────────┐
        │ 竖视频1 │ 竖视频2 │
        ├─────────┼─────────┤
        │ 竖视频3 │         │
        └─────────┴─────────┘

        移动端 (< 640px) 1 列布局
      */}
        <div
          className={cn(
            'grid gap-2 sm:gap-4',
            // 移动端 1 列
            'grid-cols-1',
            // 平板 2 列
            'sm:grid-cols-2',
            // PC 端 3 列
            'lg:grid-cols-3',
          )}
        >
          {promptGalleryItems.slice(0, 3).map((item, index) => (
            <div key={index} className="aspect-[9/12]">
              <VideoCard
                item={item}
                onClick={() => handleCardClick(item)}
                size="vertical"
              />
            </div>
          ))}
        </div>

        {/* 视频详情弹窗 */}
        <VideoDetailModal
          open={modalOpen}
          onOpenChange={handleModalClose}
          item={selectedItem}
          onApplyPrompt={handleApplyPrompt}
        />
      </div>
    </section>
  )
})

export default PromptGallery
